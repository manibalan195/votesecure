const db = require('../config/db');

async function getDashboardStats(req, res) {
  try {
    const [[electionStats]] = await db.query(`
      SELECT
        COUNT(*) AS total_elections,
        SUM(status='live') AS live_count,
        SUM(status='upcoming') AS upcoming_count,
        SUM(status='ended') AS ended_count
      FROM elections WHERE status != 'cancelled'
    `);
    const [[userStats]] = await db.query(`
      SELECT
        COUNT(*) AS total_users,
        SUM(is_verified=1) AS verified_users,
        SUM(role='candidate') AS total_candidates
      FROM users WHERE role != 'admin'
    `);
    const [[voteStats]] = await db.query(`
      SELECT COUNT(*) AS votes_today
      FROM votes WHERE DATE(voted_at) = CURDATE()
    `);
    const [[pendingApps]] = await db.query(`
      SELECT COUNT(*) AS pending_applications
      FROM candidate_applications WHERE status='pending'
    `);

    // Recent activity
    const [recentVotes] = await db.query(`
      SELECT e.title, COUNT(v.id) AS count
      FROM votes v JOIN elections e ON v.election_id=e.id
      WHERE DATE(v.voted_at) = CURDATE()
      GROUP BY e.id ORDER BY count DESC LIMIT 5
    `);

    res.json({
      success: true,
      stats: {
        ...electionStats,
        ...userStats,
        ...voteStats,
        ...pendingApps,
      },
      recentVotes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
}

async function getAllUsers(req, res) {
  const { search, role, department, page = 1, limit = 25 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    let q = `SELECT id, full_name, email, role, roll_number, department, year,
                    degree, gender, phone, hostel_day, is_verified, is_active, created_at
             FROM users WHERE 1=1`;
    const params = [];
    if (search) {
      q += ' AND (full_name LIKE ? OR email LIKE ? OR roll_number LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (role)       { q += ' AND role=?';       params.push(role); }
    if (department) { q += ' AND department=?'; params.push(department); }
    q += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [rows] = await db.query(q, params);
    const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM users WHERE 1=1');
    res.json({ success: true, users: rows, total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
}

async function searchUsers(req, res) {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ success: true, users: [] });
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, email, roll_number, department, year, is_verified
       FROM users WHERE (full_name LIKE ? OR email LIKE ? OR roll_number LIKE ?)
       AND is_active=1 LIMIT 15`,
      [`%${q}%`, `%${q}%`, `%${q}%`]
    );
    res.json({ success: true, users: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Search failed' });
  }
}

async function toggleUserActive(req, res) {
  const { id } = req.params;
  try {
    await db.query('UPDATE users SET is_active = NOT is_active WHERE id=?', [id]);
    res.json({ success: true, message: 'User status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
}

async function getAuditLog(req, res) {
  const { page = 1, limit = 50, event_type } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    let q = 'SELECT al.*, u.full_name, u.email FROM audit_log al LEFT JOIN users u ON al.user_id=u.id WHERE 1=1';
    const params = [];
    if (event_type) { q += ' AND al.event_type=?'; params.push(event_type); }
    q += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);
    const [rows] = await db.query(q, params);
    const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM audit_log');
    res.json({ success: true, log: rows, total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit log' });
  }
}

async function getCollegeInfo(_req, res) {
  res.json({
    success: true,
    college: {
      name:     process.env.COLLEGE_NAME     || 'Mepco Schlenk Engineering College',
      short:    process.env.COLLEGE_SHORT    || 'MSEC',
      domain:   process.env.COLLEGE_DOMAIN   || '@mepcoeng.ac.in',
      location: process.env.COLLEGE_LOCATION || 'Sivakasi, Tamil Nadu',
    },
  });
}

module.exports = { getDashboardStats, getAllUsers, searchUsers, toggleUserActive, getAuditLog, getCollegeInfo };