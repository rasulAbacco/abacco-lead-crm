// utils/mailer.js - SMTP mail transport (replaces SendGrid)
import nodemailer from "nodemailer";

const port = Number(process.env.SMTP_PORT) || 465;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // e.g. smtp.gmail.com / smtp.zoho.in / smtp.office365.com
  port,
  secure: process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === "true"
    : port === 465, // 465 = SSL, 587 = STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // for Gmail: a 16-char App Password, not your normal password
  },
  pool: true, // reuse connections instead of opening one per email
  maxConnections: 3,
  maxMessages: 100,
});

// Check SMTP credentials once at startup so misconfiguration shows up in logs immediately
transporter
  .verify()
  .then(() => console.log("✅ SMTP server ready to send emails"))
  .catch((err) => console.error("❌ SMTP connection failed:", err.message));

/**
 * Send an email over SMTP.
 * @param {{ to: string, subject: string, text?: string, html?: string }} options
 */
export async function sendMail({ to, subject, text, html }) {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM, // e.g. "Abacco CRM <noreply@abaccotech.com>"
    to,
    subject,
    text,
    html,
  });
}

export default transporter;
