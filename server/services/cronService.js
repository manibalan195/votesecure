const cron = require('node-cron');
const db   = require('../config/db');
const { getIO } = require('../config/socket');

function startCronJobs() {
  // Every minute — flip election status
  cron.schedule('* * * * *', async () => {
    try {
      const [opened] = await db.query(
        `UPDATE elections SET status='live' WHERE status='upcoming' AND start_time <= NOW()`
      );
      const [closed] = await db.query(
        `UPDATE elections SET status='ended' WHERE status='live' AND end_time <= NOW()`
      );
      if (opened.affectedRows || closed.affectedRows) {
        try { getIO().emit('elections_changed', { ts: new Date() }); } catch (_) {}
      }
    } catch (e) { console.error('Cron error:', e.message); }
  });

  // Every hour — clean expired OTPs
  cron.schedule('0 * * * *', async () => {
    try { await db.query(`DELETE FROM otp_tokens WHERE expires_at < NOW()`); } catch (_) {}
  });

  console.log('⏰ Cron jobs started');
}

module.exports = { startCronJobs };