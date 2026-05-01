const db = require('../config/db');

async function auditLog(eventType, { electionId = null, userId = null, details = {}, ip = null } = {}) {
  try {
    await db.query(
      `INSERT INTO audit_log (event_type, election_id, user_id, details, ip_address) VALUES (?,?,?,?,?)`,
      [eventType, electionId, userId, JSON.stringify(details), ip]
    );
  } catch (_) {}
}

module.exports = { auditLog };