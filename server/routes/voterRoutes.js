const express = require('express');
const r = express.Router();
const c = require('../controllers/voterController');
const { authenticate, requireRoles, requireVerified } = require('../middleware/auth');
const { uploadCSV } = require('../middleware/limiters');

r.use(authenticate, requireVerified, requireRoles('admin'));

r.get('/election/:electionId',           c.getVoters);
r.post('/election/:electionId',          c.addVoter);
r.post('/election/:electionId/bulk',     c.bulkAddVoters);
r.post('/election/:electionId/csv',      uploadCSV.single('file'), c.uploadVotersCSV);
r.delete('/election/:electionId/user/:userId', c.removeVoter);

module.exports = r;