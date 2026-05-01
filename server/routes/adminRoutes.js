const express = require('express');
const r = express.Router();
const c = require('../controllers/adminController');
const { authenticate, requireRoles, requireVerified } = require('../middleware/auth');

r.get('/college',        c.getCollegeInfo);  // public — used by frontend on login page
r.use(authenticate, requireVerified, requireRoles('admin'));

r.get('/stats',          c.getDashboardStats);
r.get('/users',          c.getAllUsers);
r.get('/users/search',   c.searchUsers);
r.put('/users/:id/toggle', c.toggleUserActive);
r.get('/audit-log',      c.getAuditLog);

module.exports = r;