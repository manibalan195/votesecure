const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth:   { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const FROM       = process.env.EMAIL_FROM       || 'MSEC Election Committee <manibalan195@gmail.com>';
const REPLY_TO   = process.env.EMAIL_REPLY_TO   || 'manibalan195@gmail.com';
const COLLEGE    = process.env.COLLEGE_NAME     || 'Mepco Schlenk Engineering College';
const SHORT      = process.env.COLLEGE_SHORT    || 'MSEC';

function base(content) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F4F0;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E0DED6">
    <div style="background:#1a3a5c;padding:24px 32px;display:flex;align-items:center;gap:12px">
      <div style="width:36px;height:36px;background:#E8A020;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff">${SHORT[0]}</div>
      <div>
        <div style="font-size:16px;font-weight:600;color:#fff">${SHORT} Election Portal</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.7)">${COLLEGE}</div>
      </div>
    </div>
    <div style="padding:32px">${content}</div>
    <div style="background:#F5F4F0;padding:16px 32px;font-size:12px;color:#888;text-align:center">
      © ${new Date().getFullYear()} ${COLLEGE} · Sivakasi, Tamil Nadu<br>
      This is an automated message. <a href="mailto:${REPLY_TO}" style="color:#1a3a5c">Contact us</a>
    </div>
  </div></body></html>`;
}

async function sendOTPEmail(to, name, otp) {
  try {
  const info = await transporter.sendMail({
    from: FROM, to, replyTo: REPLY_TO,
    subject: `${otp} — Your ${SHORT} Election Portal verification code`,
    html: base(`
      <p style="font-size:16px;font-weight:600;color:#1a1a18;margin:0 0 10px">Hi ${name},</p>
      <p style="font-size:14px;color:#555;margin:0 0 24px;line-height:1.7">
        Use this code to verify your email and activate your ${SHORT} Election Portal account. It expires in <strong>10 minutes</strong>.
      </p>
      <div style="background:#EEF5FF;border:1px solid #B3CFEE;border-radius:10px;text-align:center;padding:28px;margin-bottom:24px">
        <div style="font-size:44px;font-weight:700;letter-spacing:18px;color:#1a3a5c">${otp}</div>
      </div>
      <p style="font-size:12px;color:#999;margin:0">Only use this on the official ${SHORT} Election Portal. Never share this code with anyone.</p>
    `),
       

  });
   console.log("✅ OTP email sent:", info.messageId);
}catch(err){
        console.error("❌ Email failed:", err.message);

  }
}

async function sendCandidateStatusEmail(to, name, electionTitle, status, adminNote) {
  const approved = status === 'approved';
  await transporter.sendMail({
    from: FROM, to, replyTo: REPLY_TO,
    subject: `Your candidate application has been ${status} — ${SHORT} Elections`,
    html: base(`
      <p style="font-size:16px;font-weight:600;color:#1a1a18;margin:0 0 10px">Hi ${name},</p>
      <p style="font-size:14px;color:#555;margin:0 0 16px;line-height:1.7">
        Your application to be a candidate in <strong>${electionTitle}</strong> has been 
        <strong style="color:${approved ? '#0a5c36' : '#791F1F'}">${status}</strong> by the Election Committee.
      </p>
      ${approved
        ? `<div style="background:#E1F5EE;border:1px solid #9FE1CB;border-radius:8px;padding:16px;margin-bottom:16px">
            <p style="margin:0;font-size:14px;color:#085041">✅ Your name will appear on the ballot when voting opens. Students can view your profile and manifesto.</p>
          </div>`
        : `<div style="background:#FCEBEB;border:1px solid #F09595;border-radius:8px;padding:16px;margin-bottom:16px">
            <p style="margin:0;font-size:14px;color:#791F1F">❌ Unfortunately your application was not approved for this election.</p>
          </div>`
      }
      ${adminNote ? `<p style="font-size:14px;color:#555;margin:0 0 8px"><strong>Note from Election Committee:</strong> ${adminNote}</p>` : ''}
      <p style="font-size:12px;color:#999;margin:16px 0 0">For queries, contact the Election Committee at <a href="mailto:${REPLY_TO}" style="color:#1a3a5c">${REPLY_TO}</a></p>
    `),
  });
}

async function sendVoteReceiptEmail(to, name, electionTitle, voteHash) {
  await transporter.sendMail({
    from: FROM, to, replyTo: REPLY_TO,
    subject: `Vote confirmed — ${electionTitle}`,
    html: base(`
      <p style="font-size:16px;font-weight:600;color:#1a1a18;margin:0 0 10px">Hi ${name},</p>
      <p style="font-size:14px;color:#555;margin:0 0 24px;line-height:1.7">
        Your vote in <strong>${electionTitle}</strong> has been securely and anonymously recorded.
      </p>
      <div style="background:#F5F4F0;border-radius:8px;padding:14px 18px;margin-bottom:16px">
        <div style="font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Vote Receipt Hash</div>
        <div style="font-family:monospace;font-size:13px;color:#1a1a18;word-break:break-all">${voteHash}</div>
      </div>
      <p style="font-size:12px;color:#999;margin:0;line-height:1.7">
        This receipt proves your vote was counted without revealing who you voted for. Your ballot is completely anonymous.
        Save this code to verify your vote at any time.
      </p>
    `),
  });
}

async function sendWelcomeEmail(to, name) {
  await transporter.sendMail({
    from: FROM, to, replyTo: REPLY_TO,
    subject: `Welcome to ${SHORT} Election Portal`,
    html: base(`
      <p style="font-size:16px;font-weight:600;color:#1a1a18;margin:0 0 10px">Welcome, ${name}! 🎉</p>
      <p style="font-size:14px;color:#555;margin:0 0 16px;line-height:1.7">
        Your account on the <strong>${COLLEGE} Election Portal</strong> is now active. You can now:
      </p>
      <ul style="font-size:14px;color:#555;line-height:2;margin:0 0 20px;padding-left:20px">
        <li>View and participate in active elections</li>
        <li>Apply as a candidate when applications open</li>
        <li>View election results after voting ends</li>
        <li>Track your voting history</li>
      </ul>
      <p style="font-size:12px;color:#999;margin:0">Questions? Contact us at <a href="mailto:${REPLY_TO}" style="color:#1a3a5c">${REPLY_TO}</a></p>
    `),
  });
}

module.exports = { sendOTPEmail, sendCandidateStatusEmail, sendVoteReceiptEmail, sendWelcomeEmail };