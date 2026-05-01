const express = require('express');
const r = express.Router();
const c = require('../controllers/electionController');
const { authenticate, requireRoles, requireVerified } = require('../middleware/auth');

r.use(authenticate, requireVerified);

r.get('/',              c.getElections);
r.get('/admin/all',     requireRoles('admin'), c.adminGetElections);
r.get('/:id',           c.getElection);
r.get('/:id/results',   c.getResults);
r.post('/',             requireRoles('admin'), c.createElection);
r.put('/:id',           requireRoles('admin'), c.updateElection);
r.delete('/:id',        requireRoles('admin'), c.deleteElection);

module.exports = r;