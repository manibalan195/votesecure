// authRoutes.js
const express = require('express');
const r = express.Router();
const c = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginLimiter, otpLimiter, uploadImage } = require('../middleware/limiters');

r.post('/register',     c.register);
r.post('/login',        loginLimiter, c.login);

r.post('/send-otp',     otpLimiter, c.sendOTP);
r.post('/verify-otp',   c.verifyOTP);
r.get('/me',            authenticate, c.getMe);
r.put('/profile',       authenticate, uploadImage.single('avatar'), c.updateProfile);

module.exports = r;