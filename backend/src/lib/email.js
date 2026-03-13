import nodemailer from 'nodemailer';

const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const FROM = process.env.SMTP_FROM || '"QuestList" <no-reply@questlist.app>';

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587'),
    secure: parseInt(SMTP_PORT || '587') === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendVerificationEmail(to, token) {
  const link = `${APP_URL}/verify-email?token=${token}`;
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[EMAIL] Verification link for ${to}: ${link}`);
    return;
  }
  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Verify your QuestList email',
    html: `
      <div style="font-family:sans-serif;background:#0f0f1a;padding:40px;color:#e2e8f0;max-width:480px;margin:auto;border-radius:12px;">
        <h2 style="color:#a78bfa;margin-bottom:8px;">⚔️ QuestList</h2>
        <h3 style="color:#fff;margin-bottom:16px;">Verify your email address</h3>
        <p style="color:#94a3b8;margin-bottom:24px;">Click the button below to verify your email and complete your hero registration.</p>
        <a href="${link}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-bottom:24px;">Verify Email</a>
        <p style="color:#64748b;font-size:13px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to, token) {
  const link = `${APP_URL}/reset-password?token=${token}`;
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[EMAIL] Password reset link for ${to}: ${link}`);
    return;
  }
  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Reset your QuestList password',
    html: `
      <div style="font-family:sans-serif;background:#0f0f1a;padding:40px;color:#e2e8f0;max-width:480px;margin:auto;border-radius:12px;">
        <h2 style="color:#a78bfa;margin-bottom:8px;">⚔️ QuestList</h2>
        <h3 style="color:#fff;margin-bottom:16px;">Reset your password</h3>
        <p style="color:#94a3b8;margin-bottom:24px;">Click the button below to set a new password. This link expires in 1 hour.</p>
        <a href="${link}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-bottom:24px;">Reset Password</a>
        <p style="color:#64748b;font-size:13px;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
      </div>
    `,
  });
}
