// SMTP mailer. The transport is created lazily so .env values are always loaded first.
import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT) || 465;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
  });
  return transporter;
}

export async function verifyMailer() {
  try {
    await getTransporter().verify();
    console.log("✅ SMTP ready");
  } catch (err) {
    console.error("❌ SMTP connection failed:", err.message);
  }
}

/**
 * @param {{ to: string, subject: string, text?: string, html?: string,
 *           attachments?: {filename: string, content: Buffer}[] }} options
 */
export async function sendMail({ to, subject, text, html, attachments }) {
  return getTransporter().sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
    attachments,
  });
}
