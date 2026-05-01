const jwt = require('jsonwebtoken');
const db  = require('../config/db');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'No token provided' });

  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const [[user]] = await db.query(
      'SELECT id, full_name, email, role, department, year, is_verified, is_active FROM users WHERE id = ?',
      [decoded.id]
    );
    if (!user || !user.is_active)
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ success: false, message: 'Access denied' });
    next();
  };
}

function requireVerified(req, res, next) {
  if (!req.user.is_verified)
    return res.status(403).json({ success: false, message: 'Email not verified', needsVerification: true });
  next();
}

module.exports = { authenticate, requireRoles, requireVerified };