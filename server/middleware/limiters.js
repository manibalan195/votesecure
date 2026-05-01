const rateLimit = require('express-rate-limit');
const multer    = require('multer');
const path      = require('path');
const fs        = require('fs');

// ── Rate limiters ─────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, max: 5,
  message: { success: false, message: 'Too many login attempts. Try again in 2 minutes.' },
});

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 10,
  keyGenerator: req => req.body.email || req.ip,
  message: { success: false, message: 'Too many OTP requests. Try again in 1 hour.' },
});

const voteLimiter = rateLimit({
  windowMs: 60 * 1000, max: 5,
  message: { success: false, message: 'Too many vote requests.' },
});

// ── Multer ────────────────────────────────────────────────────────────────────
const uploadPath = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadPath),
  filename:    (_req, file,  cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const imageFilter = (_req, file, cb) => {
  const ok = ['.jpg','.jpeg','.png','.webp'].includes(path.extname(file.originalname).toLowerCase());
  cb(ok ? null : new Error('Only image files allowed'), ok);
};

const maxSize = (parseInt(process.env.MAX_FILE_SIZE_MB) || 2) * 1024 * 1024;
const uploadImage = multer({ storage, fileFilter: imageFilter, limits: { fileSize: maxSize } });
const uploadCSV   = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = { loginLimiter, otpLimiter, voteLimiter, uploadImage, uploadCSV };