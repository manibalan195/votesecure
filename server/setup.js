/**
 * setup.js — Run ONCE after schema.sql to seed the admin account with a real bcrypt hash.
 * Usage:  node setup.js
 */
require('dotenv').config();
const bcrypt  = require('bcrypt');
const mysql   = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const adminEmail    = 'admin@mepcoeng.ac.in';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const hash = await bcrypt.hash(adminPassword, 10);

  await conn.execute(
    `UPDATE users SET password_hash = ? WHERE email = ?`,
    [hash, adminEmail]
  );

  console.log(`✅ Admin account ready.`);
  console.log(`   Email    : ${adminEmail}`);
  console.log(`   Password : ${adminPassword}`);
  console.log(`\n   Change ADMIN_PASSWORD in .env then re-run to update it.\n`);

  await conn.end();
}

main().catch(err => { console.error('Setup failed:', err.message); process.exit(1); });