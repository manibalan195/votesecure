const db = require('../config/db');
const { auditLog } = require('../utils/audit');
const { getIO } = require('../config/socket');

// ── Get all elections (voter view) ────────────────────────────────────────────
async function getElections(req, res) {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(`
      SELECT e.*,
        (SELECT COUNT(*) FROM candidate_applications ca WHERE ca.election_id=e.id AND ca.status='approved') AS candidate_count,
        (SELECT COUNT(*) FROM election_voters ev WHERE ev.election_id=e.id) AS voter_count,
        (SELECT COUNT(*) FROM election_voters ev WHERE ev.election_id=e.id AND ev.has_voted=1) AS voted_count,
        (SELECT ev2.has_voted FROM election_voters ev2 WHERE ev2.election_id=e.id AND ev2.user_id=?) AS my_has_voted,
        (SELECT ca.status FROM candidate_applications ca WHERE ca.election_id=e.id AND ca.user_id=?) AS my_application_status
      FROM elections e
      WHERE e.status != 'cancelled'
      ORDER BY
        CASE e.status WHEN 'live' THEN 1 WHEN 'upcoming' THEN 2 WHEN 'ended' THEN 3 ELSE 4 END,
        e.start_time DESC
    `, [userId, userId]);
    res.json({ success: true, elections: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch elections' });
  }
}

// ── Get single election ───────────────────────────────────────────────────────
async function getElection(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const [[election]] = await db.query(`
      SELECT e.*,
        (SELECT COUNT(*) FROM candidate_applications ca WHERE ca.election_id=e.id AND ca.status='approved') AS candidate_count,
        (SELECT COUNT(*) FROM election_voters ev WHERE ev.election_id=e.id) AS voter_count,
        (SELECT COUNT(*) FROM election_voters ev WHERE ev.election_id=e.id AND ev.has_voted=1) AS voted_count,
        (SELECT ev2.has_voted FROM election_voters ev2 WHERE ev2.election_id=e.id AND ev2.user_id=?) AS my_has_voted,
        (SELECT ca.status FROM candidate_applications ca WHERE ca.election_id=e.id AND ca.user_id=?) AS my_application_status,
        (SELECT ca.id FROM candidate_applications ca WHERE ca.election_id=e.id AND ca.user_id=?) AS my_application_id
      FROM elections e WHERE e.id=?
    `, [userId, userId, userId, id]);
    if (!election) return res.status(404).json({ success: false, message: 'Election not found' });
    res.json({ success: true, election });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch election' });
  }
}

// ── Admin: Create election ────────────────────────────────────────────────────
async function createElection(req, res) {
  const {
    title, description, election_type,
    start_time, end_time,
    candidate_apply_start, candidate_apply_end,
    eligible_departments, eligible_years,
    allow_nota, results_visible_after,
  } = req.body;

  if (!title || !start_time || !end_time)
    return res.status(400).json({ success: false, message: 'Title, start and end time are required' });

  try {
    const [result] = await db.query(`
      INSERT INTO elections
        (title,description,election_type,start_time,end_time,
         candidate_apply_start,candidate_apply_end,
         eligible_departments,eligible_years,
         allow_nota,results_visible_after,status,created_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      title, description||null, election_type||null,
      start_time, end_time,
      candidate_apply_start||null, candidate_apply_end||null,
      eligible_departments ? JSON.stringify(eligible_departments) : 'ALL',
      eligible_years       ? JSON.stringify(eligible_years)       : 'ALL',
      allow_nota !== false ? 1 : 0,
      results_visible_after || 'ended',
      'draft',
      req.user.id,
    ]);

    auditLog('election_created', { electionId: result.insertId, userId: req.user.id, details: { title }, ip: req.ip });
    res.status(201).json({ success: true, electionId: result.insertId, message: 'Election created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create election' });
  }
}

// ── Admin: Update election ────────────────────────────────────────────────────
async function updateElection(req, res) {
  const { id } = req.params;
  const allowed = [
    'title','description','election_type','start_time','end_time',
    'candidate_apply_start','candidate_apply_end',
    'eligible_departments','eligible_years',
    'allow_nota','results_visible_after','status',
  ];
  try {
    const fields = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        if (k === 'eligible_departments' || k === 'eligible_years') {
          fields[k] = typeof req.body[k] === 'string' ? req.body[k] : JSON.stringify(req.body[k]);
        } else {
          fields[k] = req.body[k];
        }
      }
    }
    if (!Object.keys(fields).length)
      return res.status(400).json({ success: false, message: 'No fields to update' });

    const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
    await db.query(`UPDATE elections SET ${sets} WHERE id=?`, [...Object.values(fields), id]);

    auditLog('election_updated', { electionId: Number(id), userId: req.user.id, details: fields, ip: req.ip });
    try { getIO().emit('elections_changed', {}); } catch (_) {}

    res.json({ success: true, message: 'Election updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update election' });
  }
}

// ── Admin: Delete (cancel) election ──────────────────────────────────────────
async function deleteElection(req, res) {
  try {
    await db.query(`UPDATE elections SET status='cancelled' WHERE id=?`, [req.params.id]);
    auditLog('election_cancelled', { electionId: Number(req.params.id), userId: req.user.id, ip: req.ip });
    res.json({ success: true, message: 'Election cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to cancel election' });
  }
}

// ── Results ───────────────────────────────────────────────────────────────────
async function getResults(req, res) {
  const { id } = req.params;
  try {
    const [[election]] = await db.query('SELECT * FROM elections WHERE id=?', [id]);
    if (!election) return res.status(404).json({ success: false, message: 'Election not found' });

    // Restrict live results to admin unless results_visible_after='live'
    if (election.status === 'live' && election.results_visible_after === 'ended' && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Results will be available after voting ends' });

    const [candidates] = await db.query(`
      SELECT ca.id, ca.party_name, ca.photo_url, ca.display_order,
             u.full_name, u.department, u.year,
             COUNT(v.id) AS vote_count
      FROM candidate_applications ca
      JOIN users u ON ca.user_id = u.id
      LEFT JOIN votes v ON v.candidate_application_id = ca.id AND v.election_id=?
      WHERE ca.election_id=? AND ca.status='approved'
      GROUP BY ca.id
      ORDER BY vote_count DESC, ca.display_order ASC
    `, [id, id]);

    const [[notaRow]] = await db.query(
      `SELECT COUNT(*) AS nota_count FROM votes WHERE election_id=? AND is_nota=1`, [id]
    );

    const totalVotes = candidates.reduce((s, c) => s + Number(c.vote_count), 0) + Number(notaRow.nota_count);
    const [[evRow]]  = await db.query(`SELECT COUNT(*) AS t FROM election_voters WHERE election_id=?`, [id]);

    const results = candidates.map(c => ({
      ...c,
      vote_count: Number(c.vote_count),
      percent: totalVotes > 0 ? Math.round(Number(c.vote_count) / totalVotes * 100) : 0,
    }));

    res.json({
      success: true, results,
      nota_count: Number(notaRow.nota_count),
      nota_percent: totalVotes > 0 ? Math.round(Number(notaRow.nota_count) / totalVotes * 100) : 0,
      totalVotes,
      totalEligible: Number(evRow.t),
      turnoutPercent: evRow.t > 0 ? Math.round(totalVotes / Number(evRow.t) * 100) : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch results' });
  }
}

// ── Admin: All elections list ─────────────────────────────────────────────────
async function adminGetElections(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT e.*,
        (SELECT COUNT(*) FROM candidate_applications ca WHERE ca.election_id=e.id AND ca.status='approved') AS candidate_count,
        (SELECT COUNT(*) FROM candidate_applications ca WHERE ca.election_id=e.id AND ca.status='pending') AS pending_count,
        (SELECT COUNT(*) FROM election_voters ev WHERE ev.election_id=e.id) AS voter_count,
        (SELECT COUNT(*) FROM election_voters ev WHERE ev.election_id=e.id AND ev.has_voted=1) AS voted_count,
        u.full_name AS created_by_name
      FROM elections e
      JOIN users u ON e.created_by=u.id
      WHERE e.status != 'cancelled'
      ORDER BY e.created_at DESC
    `);
    res.json({ success: true, elections: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch elections' });
  }
}

module.exports = { getElections, getElection, createElection, updateElection, deleteElection, getResults, adminGetElections };