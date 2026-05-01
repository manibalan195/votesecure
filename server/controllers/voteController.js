const crypto = require('crypto');
const db     = require('../config/db');
const { auditLog } = require('../utils/audit');
const { getIO }    = require('../config/socket');
const { sendVoteReceiptEmail } = require('../services/emailService');

async function castVote(req, res) {
  const { electionId, candidateApplicationId, isNota } = req.body;
  const userId = req.user.id;

  if (!electionId)
    return res.status(400).json({ success: false, message: 'electionId is required' });
  if (!isNota && !candidateApplicationId)
    return res.status(400).json({ success: false, message: 'Provide candidateApplicationId or set isNota=true' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Election must be live
    const [[election]] = await conn.query(
      `SELECT * FROM elections WHERE id=? AND status='live' FOR UPDATE`, [electionId]
    );
    if (!election) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Election is not currently active' });
    }

    // 2. NOTA check
    if (isNota && !election.allow_nota) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'NOTA is not allowed in this election' });
    }

    // 3. Voter must be registered for this election
    const [[voter]] = await conn.query(
      `SELECT * FROM election_voters WHERE election_id=? AND user_id=? FOR UPDATE`,
      [electionId, userId]
    );
    if (!voter) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: 'You are not registered to vote in this election' });
    }

    // 4. Must not have already voted
    if (voter.has_voted) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'You have already voted in this election' });
    }

    // 5. Validate candidate belongs to this election (if not NOTA)
    if (!isNota) {
      const [[candidate]] = await conn.query(
        `SELECT * FROM candidate_applications WHERE id=? AND election_id=? AND status='approved'`,
        [candidateApplicationId, electionId]
      );
      if (!candidate) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: 'Candidate not found in this election' });
      }
    }

    // 6. Generate anonymous vote hash
    const voteHash = crypto
      .createHash('sha256')
      .update(`${electionId}|${candidateApplicationId || 'nota'}|${userId}|${Date.now()}|${process.env.VOTE_SALT}`)
      .digest('hex');

    // 7. Insert vote (no user_id = anonymous)
    await conn.query(
      `INSERT INTO votes (election_id, candidate_application_id, is_nota, vote_hash) VALUES (?,?,?,?)`,
      [electionId, isNota ? null : candidateApplicationId, isNota ? 1 : 0, voteHash]
    );

    // 8. Mark voter as voted
    await conn.query(
      `UPDATE election_voters SET has_voted=1 WHERE election_id=? AND user_id=?`,
      [electionId, userId]
    );

    await conn.commit();

    // Audit
    auditLog('vote_cast', { electionId: Number(electionId), userId, details: { vote_hash: voteHash, is_nota: !!isNota }, ip: req.ip });

    // Emit live update
    try {
      const [counts] = await db.query(`
        SELECT ca.id, u.full_name, COUNT(v.id) AS vote_count
        FROM candidate_applications ca
        JOIN users u ON ca.user_id=u.id
        LEFT JOIN votes v ON v.candidate_application_id=ca.id AND v.election_id=?
        WHERE ca.election_id=? AND ca.status='approved'
        GROUP BY ca.id
      `, [electionId, electionId]);

      const [[notaRow]] = await db.query(
        `SELECT COUNT(*) AS nota_count FROM votes WHERE election_id=? AND is_nota=1`, [electionId]
      );
      const totalVotes = counts.reduce((s, c) => s + Number(c.vote_count), 0) + Number(notaRow.nota_count);
      const [[ev]] = await db.query(`SELECT COUNT(*) AS t FROM election_voters WHERE election_id=?`, [electionId]);
      const turnoutPercent = ev.t > 0 ? Math.round(totalVotes / ev.t * 100) : 0;

      getIO().to(`election_${electionId}`).emit('vote_update', {
        electionId,
        counts: counts.map(c => ({
          ...c,
          vote_count: Number(c.vote_count),
          percent: totalVotes > 0 ? Math.round(Number(c.vote_count) / totalVotes * 100) : 0,
        })),
        nota_count: Number(notaRow.nota_count),
        totalVotes,
        turnoutPercent,
      });
    } catch (_) {}

    // Send receipt email (non-blocking)
    try {
      const [[u]] = await db.query('SELECT full_name, email FROM users WHERE id=?', [userId]);
      await sendVoteReceiptEmail(u.email, u.full_name, election.title, voteHash);
    } catch (_) {}

    res.json({ success: true, voteHash, message: 'Vote cast successfully' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to cast vote' });
  } finally {
    conn.release();
  }
}

async function verifyHash(req, res) {
  try {
    const [[row]] = await db.query(
      `SELECT v.id, v.election_id, v.is_nota, v.voted_at, e.title AS election_title
       FROM votes v JOIN elections e ON v.election_id=e.id
       WHERE v.vote_hash=?`, [req.params.hash]
    );
    if (!row) return res.json({ success: true, found: false });
    res.json({ success: true, found: true, vote: row });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
}

module.exports = { castVote, verifyHash };