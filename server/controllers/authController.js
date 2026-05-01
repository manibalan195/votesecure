const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');
const { generateOTP }       = require('../utils/generateOTP');
const { auditLog }           = require('../utils/audit');
const { sendOTPEmail, sendWelcomeEmail } = require('../services/emailService');

const DOMAIN = process.env.COLLEGE_DOMAIN || '@mepcoeng.ac.in';

// ── Register ──────────────────────────────────────────────────────────────────
async function register(req, res) {
  const {
    full_name, email, password,
    roll_number, department, year, degree,
    gender, phone, hostel_day,
  } = req.body;

  if (!full_name || !email || !password)
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });

  if (!email.endsWith(DOMAIN))
    return res.status(400).json({ success: false, message: `Only ${DOMAIN} email addresses are allowed` });

  if (password.length < 8)
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });

  try {
    const [[existing]] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing)
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO users (full_name,email,password_hash,roll_number,department,year,degree,gender,phone,hostel_day)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [full_name, email, hash, roll_number||null, department||null, year||null,
       degree||null, gender||null, phone||null, hostel_day||null]
    );

    const otp     = generateOTP();
    await db.query(
  `INSERT INTO otp_tokens (user_id, token, purpose, expires_at)
   VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
  [result.insertId, otp, 'verify_email']
);

    await sendOTPEmail(email, full_name, otp);
    auditLog('register', { userId: result.insertId, details: { email }, ip: req.ip });

    res.status(201).json({ success: true, message: 'Account created. Check your college email for the verification code.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password required' });

  try {
    const [[user]] = await db.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    if (!user.is_verified)
      return res.status(403).json({ success: false, message: 'Please verify your email first', needsVerification: true, email });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    auditLog('login', { userId: user.id, ip: req.ip });

    res.json({
      success: true, token,
      user: {
        id: user.id, full_name: user.full_name, email: user.email,
        role: user.role, department: user.department, year: user.year,
        roll_number: user.roll_number, avatar_url: user.avatar_url,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
}

// ── Send OTP ──────────────────────────────────────────────────────────────────
async function sendOTP(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email required' });

  try {
    const [[user]] = await db.query('SELECT id, full_name, is_verified FROM users WHERE email = ?', [email]);
    if (!user) return res.status(404).json({ success: false, message: 'No account found with this email' });
    if (user.is_verified) return res.status(400).json({ success: false, message: 'Email already verified' });

    await db.query('UPDATE otp_tokens SET is_used=1 WHERE user_id=? AND is_used=0', [user.id]);

    const otp     = generateOTP();
    await db.query(
  `INSERT INTO otp_tokens (user_id, token, purpose, expires_at)
   VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
  [user.id, otp, 'verify_email']
);

    await sendOTPEmail(email, user.full_name, otp);
    res.json({ success: true, message: 'Verification code sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
}

// ── Verify OTP ────────────────────────────────────────────────────────────────
async function verifyOTP(req, res) {
  const { email, token } = req.body;
  if (!email || !token) return res.status(400).json({ success: false, message: 'Email and code required' });

  try {
    const [[user]] = await db.query('SELECT id, full_name FROM users WHERE email = ?', [email]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const [[otp]] = await db.query(
      `SELECT * FROM otp_tokens WHERE user_id=? AND token=? AND is_used=0 AND expires_at>NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [user.id, token]
    );
    if (!otp) return res.status(400).json({ success: false, message: 'Invalid or expired code. Request a new one.' });

    await db.query('UPDATE otp_tokens SET is_used=1 WHERE id=?', [otp.id]);
    await db.query('UPDATE users SET is_verified=1 WHERE id=?', [user.id]);

    await sendWelcomeEmail(email, user.full_name);
    auditLog('email_verified', { userId: user.id, ip: req.ip });

    res.json({ success: true, message: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
}

// ── Get Me ────────────────────────────────────────────────────────────────────
async function getMe(req, res) {
  try {
    const [[user]] = await db.query(
      `SELECT id,full_name,email,role,roll_number,department,year,degree,gender,phone,hostel_day,avatar_url,created_at
       FROM users WHERE id=?`, [req.user.id]
    );
    res.json({ success: true, user, college: { name: process.env.COLLEGE_NAME, short: process.env.COLLEGE_SHORT } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
}

// ── Update Profile ────────────────────────────────────────────────────────────
async function updateProfile(req, res) {
  const { full_name, phone, hostel_day, gender } = req.body;
  const avatar_url = req.file ? `/uploads/${req.file.filename}` : undefined;
  try {
    const fields = { full_name, phone, hostel_day, gender };
    if (avatar_url) fields.avatar_url = avatar_url;
    const sets  = Object.keys(fields).map(k => `${k}=?`).join(',');
    const vals  = [...Object.values(fields), req.user.id];
    await db.query(`UPDATE users SET ${sets} WHERE id=?`, vals);
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
}

module.exports = { register, login, sendOTP, verifyOTP, getMe, updateProfile };