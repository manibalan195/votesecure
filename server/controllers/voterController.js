const db  = require('../config/db');
const csv = require('csv-parser');
const fs  = require('fs');

async function getVoters(req, res) {
  const { electionId } = req.params;
  const { search, filter, page = 1, limit = 30 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    let q = `
      SELECT ev.has_voted, ev.added_at,
             u.id AS user_id, u.full_name, u.email, u.roll_number, u.department, u.year
      FROM election_voters ev JOIN users u ON ev.user_id=u.id
      WHERE ev.election_id=?
    `;
    const params = [electionId];
    if (search) {
      q += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.roll_number LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (filter === 'voted')     q += ' AND ev.has_voted=1';
    if (filter === 'not_voted') q += ' AND ev.has_voted=0';
    q += ' ORDER BY ev.added_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [rows] = await db.query(q, params);
    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) AS total FROM election_voters WHERE election_id=?', [electionId]
    );
    res.json({ success: true, voters: rows, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch voters' });
  }
}

async function addVoter(req, res) {
  const { electionId } = req.params;
  const { email } = req.body;
  try {
    const [[user]] = await db.query('SELECT id FROM users WHERE email=? AND is_verified=1', [email]);
    if (!user) return res.status(404).json({ success: false, message: 'No verified user found with that email' });
    await db.query('INSERT IGNORE INTO election_voters (election_id, user_id) VALUES (?,?)', [electionId, user.id]);
    res.json({ success: true, message: 'Voter added' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add voter' });
  }
}

async function bulkAddVoters(req, res) {
  // Add all verified users from college (by dept/year filter)
  const { electionId } = req.params;
  const { departments, years } = req.body; // arrays or 'ALL'
  try {
    let q = 'SELECT id FROM users WHERE is_verified=1 AND role != "admin" AND is_active=1';
    const params = [];
    if (departments && departments !== 'ALL' && departments.length) {
      q += ` AND department IN (${departments.map(() => '?').join(',')})`;
      params.push(...departments);
    }
    if (years && years !== 'ALL' && years.length) {
      q += ` AND year IN (${years.map(() => '?').join(',')})`;
      params.push(...years);
    }
    const [users] = await db.query(q, params);
    let added = 0;
    for (const u of users) {
      const [r] = await db.query(
        'INSERT IGNORE INTO election_voters (election_id, user_id) VALUES (?,?)', [electionId, u.id]
      );
      if (r.affectedRows) added++;
    }
    res.json({ success: true, added, total: users.length, message: `Added ${added} voters` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to bulk-add voters' });
  }
}

async function uploadVotersCSV(req, res) {
  if (!req.file) return res.status(400).json({ success: false, message: 'CSV file required' });
  const { electionId } = req.params;
  const results = [];
  let added = 0, skipped = 0;
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', row => results.push(row))
    .on('end', async () => {
      try {
        for (const row of results) {
          const email = (row.email || '').trim().toLowerCase();
          if (!email) { skipped++; continue; }
          const [[user]] = await db.query('SELECT id FROM users WHERE email=? AND is_verified=1', [email]);
          if (!user) { skipped++; continue; }
          const [r] = await db.query('INSERT IGNORE INTO election_voters (election_id,user_id) VALUES (?,?)', [electionId, user.id]);
          if (r.affectedRows) added++; else skipped++;
        }
        fs.unlinkSync(req.file.path);
        res.json({ success: true, added, skipped, total: results.length });
      } catch (err) {
        res.status(500).json({ success: false, message: 'CSV processing failed' });
      }
    });
}

async function removeVoter(req, res) {
  const { electionId, userId } = req.params;
  try {
    await db.query('DELETE FROM election_voters WHERE election_id=? AND user_id=?', [electionId, userId]);
    res.json({ success: true, message: 'Voter removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove voter' });
  }
}

module.exports = { getVoters, addVoter, bulkAddVoters, uploadVotersCSV, removeVoter };