const crypto = require('crypto');

function generateOTP(len = 6) {
  const bytes = crypto.randomBytes(len);
  return Array.from(bytes).map(b => b % 10).join('');
}

module.exports = { generateOTP };