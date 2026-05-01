const db = require('../config/db');
const { auditLog } = require('../utils/audit');
const { sendCandidateStatusEmail } = require('../services/emailService');
const { getIO } = require('../config/socket');

// ── Student: Apply as candidate ───────────────────────────────────────────────
async function applyCandidate(req, res) {
  const { electionId } = req.params;
  const userId = req.user.id;
  const { party_name, manifesto, agenda_points, social_links } = req.body;
  const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const [[election]] = await db.query('SELECT * FROM elections WHERE id=?', [electionId]);
    if (!election)
      return res.status(404).json({ success: false, message: 'Election not found' });

    // Check application window
    const now = new Date();
    if (election.candidate_apply_start && now < new Date(election.candidate_apply_start))
      return res.status(400).json({ success: false, message: 'Candidate applications have not opened yet' });
    if (election.candidate_apply_end && now > new Date(election.candidate_apply_end))
      return res.status(400).json({ success: false, message: 'Candidate application deadline has passed' });
    if (['ended','cancelled'].includes(election.status))
      return res.status(400).json({ success: false, message: 'This election is no longer accepting applications' });

    // Check duplicate
    const [[existing]] = await db.query(
      'SELECT id, status FROM candidate_applications WHERE election_id=? AND user_id=?',
      [electionId, userId]
    );
    if (existing)
      return res.status(409).json({
        success: false,
        message: `You have already applied for this election (status: ${existing.status})`,
      });

    const [result] = await db.query(`
      INSERT INTO candidate_applications
        (election_id, user_id, party_name, manifesto, agenda_points, photo_url, social_links, status)
      VALUES (?,?,?,?,?,?,?,?)
    `, [
      electionId, userId,
      party_name || null,
      manifesto  || null,
      agenda_points  ? JSON.stringify(agenda_points)  : null,
      photo_url,
      social_links   ? JSON.stringify(social_links)   : null,
      'pending',
    ]);

    auditLog('candidate_applied', { electionId: Number(electionId), userId, details: { party_name }, ip: req.ip });
    try { getIO().to('admin_room').emit('new_candidate_application', { electionId, applicationId: result.insertId }); } catch (_) {}

    res.status(201).json({ success: true, applicationId: result.insertId, message: 'Application submitted. Await admin approval.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to submit application' });
  }
}

// ── Get approved candidates for an election ───────────────────────────────────
async function getCandidates(req, res) {
  const { electionId } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT ca.id, ca.party_name, ca.manifesto, ca.agenda_points,
             ca.photo_url, ca.social_links, ca.display_order,
             u.id AS user_id, u.full_name, u.department, u.year, u.degree
      FROM candidate_applications ca
      JOIN users u ON ca.user_id = u.id
      WHERE ca.election_id=? AND ca.status='approved'
      ORDER BY ca.display_order ASC, ca.applied_at ASC
    `, [electionId]);
    res.json({ success: true, candidates: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch candidates' });
  }
}

// ── Get single candidate profile ──────────────────────────────────────────────
async function getCandidateProfile(req, res) {
  const { id } = req.params;
  try {
    const [[row]] = await db.query(`
      SELECT ca.*, u.full_name, u.department, u.year, u.degree, u.gender,
             e.title AS election_title, e.id AS election_id, e.status AS election_status
      FROM candidate_applications ca
      JOIN users u ON ca.user_id = u.id
      JOIN elections e ON ca.election_id = e.id
      WHERE ca.id=? AND ca.status='approved'
    `, [id]);
    if (!row) return res.status(404).json({ success: false, message: 'Candidate not found' });
    if (row.agenda_points)  row.agenda_points  = JSON.parse(row.agenda_points);
    if (row.social_links)   row.social_links   = JSON.parse(row.social_links);
    res.json({ success: true, candidate: row });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch candidate' });
  }
}

// ── Candidate: Get own application status ─────────────────────────────────────
async function getMyApplications(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT ca.*, e.title AS election_title, e.status AS election_status,
             e.start_time, e.end_time
      FROM candidate_applications ca
      JOIN elections e ON ca.election_id = e.id
      WHERE ca.user_id=?
      ORDER BY ca.applied_at DESC
    `, [req.user.id]);

    rows.forEach(r => {
      if (r.agenda_points) r.agenda_points = JSON.parse(r.agenda_points);
      if (r.social_links)  r.social_links  = JSON.parse(r.social_links);
    });

    res.json({ success: true, applications: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
}

// ── Candidate: Get own vote count (only after election ends) ──────────────────
async function getMyVoteCount(req, res) {
  const { applicationId } = req.params;
  try {
    const [[app]] = await db.query(
      'SELECT * FROM candidate_applications WHERE id=? AND user_id=?',
      [applicationId, req.user.id]
    );
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    const [[elec]] = await db.query('SELECT status FROM elections WHERE id=?', [app.election_id]);
    if (elec.status !== 'ended')
      return res.status(403).json({ success: false, message: 'Vote counts are available after the election ends' });

    const [[countRow]] = await db.query(
      'SELECT COUNT(*) AS vote_count FROM votes WHERE candidate_application_id=?',
      [applicationId]
    );
    const [[total]] = await db.query(
      'SELECT COUNT(*) AS total FROM votes WHERE election_id=?',
      [app.election_id]
    );
    res.json({
      success: true,
      vote_count: Number(countRow.vote_count),
      total_votes: Number(total.total),
      percent: total.total > 0 ? Math.round(countRow.vote_count / total.total * 100) : 0,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch vote count' });
  }
}

// ── Admin: Get all applications (pending + all) ───────────────────────────────
async function adminGetApplications(req, res) {
  const { electionId } = req.params;
  const { status } = req.query;
  try {
    let q = `
      SELECT ca.*, u.full_name, u.email, u.department, u.year, u.roll_number,
             u.phone, u.gender, u.hostel_day,
             r.full_name AS reviewed_by_name
      FROM candidate_applications ca
      JOIN users u ON ca.user_id = u.id
      LEFT JOIN users r ON ca.reviewed_by = r.id
      WHERE ca.election_id=?
    `;
    const params = [electionId];
    if (status) { q += ' AND ca.status=?'; params.push(status); }
    q += ' ORDER BY ca.applied_at DESC';

    const [rows] = await db.query(q, params);
    rows.forEach(r => {
      if (r.agenda_points) r.agenda_points = JSON.parse(r.agenda_points);
      if (r.social_links)  r.social_links  = JSON.parse(r.social_links);
    });
    res.json({ success: true, applications: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
}

// ── Admin: Approve or reject application ─────────────────────────────────────
async function reviewApplication(req, res) {
  const { id } = req.params;
  const { status, admin_note } = req.body;

  if (!['approved','rejected'].includes(status))
    return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });

  try {
    const [[app]] = await db.query(`
      SELECT ca.*, u.full_name, u.email, e.title AS election_title
      FROM candidate_applications ca
      JOIN users u  ON ca.user_id     = u.id
      JOIN elections e ON ca.election_id = e.id
      WHERE ca.id=?
    `, [id]);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    await db.query(
      `UPDATE candidate_applications SET status=?, admin_note=?, reviewed_at=NOW(), reviewed_by=? WHERE id=?`,
      [status, admin_note || null, req.user.id, id]
    );

    // If approved, update user role to candidate
    if (status === 'approved') {
      await db.query(`UPDATE users SET role='candidate' WHERE id=?`, [app.user_id]);
    }

    // Send email notification
    try {
      await sendCandidateStatusEmail(app.email, app.full_name, app.election_title, status, admin_note);
    } catch (emailErr) {
      console.error('Email notification failed:', emailErr.message);
    }

    auditLog(`candidate_${status}`, {
      electionId: app.election_id,
      userId: req.user.id,
      details: { applicationId: Number(id), candidateName: app.full_name },
      ip: req.ip,
    });

    try { getIO().to('admin_room').emit('application_reviewed', { id, status }); } catch (_) {}

    res.json({ success: true, message: `Application ${status} and candidate notified by email` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to review application' });
  }
}

// ── Admin: Update candidate display order ─────────────────────────────────────
async function updateDisplayOrder(req, res) {
  const { id } = req.params;
  const { display_order } = req.body;
  try {
    await db.query('UPDATE candidate_applications SET display_order=? WHERE id=?', [display_order, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update order' });
  }
}

module.exports = {
  applyCandidate, getCandidates, getCandidateProfile,
  getMyApplications, getMyVoteCount,
  adminGetApplications, reviewApplication, updateDisplayOrder,
};