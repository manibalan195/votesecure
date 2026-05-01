const express = require('express');
const r = express.Router();
const c = require('../controllers/candidateController');
const { authenticate, requireRoles, requireVerified } = require('../middleware/auth');
const { uploadImage } = require('../middleware/limiters');

r.use(authenticate, requireVerified);

// Public-ish (any verified user)
r.get('/election/:electionId',          c.getCandidates);
r.get('/profile/:id',                   c.getCandidateProfile);
r.get('/my-applications',               c.getMyApplications);
r.get('/my-vote-count/:applicationId',  c.getMyVoteCount);

// Student: apply
r.post('/apply/:electionId',            uploadImage.single('photo'), c.applyCandidate);

// Admin
r.get('/admin/:electionId',             requireRoles('admin'), c.adminGetApplications);
r.put('/admin/review/:id',              requireRoles('admin'), c.reviewApplication);
r.put('/admin/order/:id',               requireRoles('admin'), c.updateDisplayOrder);

module.exports = r;