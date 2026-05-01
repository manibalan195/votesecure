const express = require('express');
const r = express.Router();
const c = require('../controllers/voteController');
const { authenticate, requireVerified } = require('../middleware/auth');
const { voteLimiter } = require('../middleware/limiters');

r.post('/',              authenticate, requireVerified, voteLimiter, c.castVote);
r.get('/verify/:hash',   c.verifyHash);

module.exports = r;