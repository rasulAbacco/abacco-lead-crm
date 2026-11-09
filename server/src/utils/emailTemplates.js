// Plain, email-client-safe HTML templates.
const shell = (title, body) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
<table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f5f7;padding:32px 12px;"><tr><td align="center">
<table width="540" cellspacing="0" cellpadding="0" border="0" style="max-width:540px;width:100%;">
<tr><td style="padding-bottom:18px;text-align:center;">
  <img src="https://www.abaccotech.com/Logo/icon.png" alt="Abacco" width="36" height="36" style="vertical-align:middle;border-radius:6px;margin-right:8px;"/>
  <span style="font-size:17px;font-weight:bold;color:#1e293b;vertical-align:middle;">Abacco Lead CRM</span>
</td></tr>
<tr><td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:32px 36px;">${body}</td></tr>
<tr><td style="padding:18px 0;text-align:center;font-size:11px;color:#9ca3af;">
  © ${new Date().getFullYear()} Abacco Technology · Automated message, please do not reply.
</td></tr></table></td></tr></table></body></html>`;

export function otpEmailHtml(otp, { resent = false, role = "EMPLOYEE" } = {}) {
  return shell(
    "Login verification",
    `<p style="margin:0 0 6px;font-size:12px;font-weight:bold;color:#2563eb;text-transform:uppercase;letter-spacing:.08em;">
      ${role === "ADMIN" ? "Admin" : "Employee"} login verification${resent ? " (new code)" : ""}</p>
    <h1 style="margin:0 0 12px;font-size:21px;color:#111827;">Your one-time passcode</h1>
    <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#4b5563;">
      Use this code to finish signing in. It expires in <b>10 minutes</b>${resent ? " and replaces your previous code" : ""}.</p>
    <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:10px;padding:22px;text-align:center;">
      <span style="font-family:'Courier New',monospace;font-size:38px;font-weight:bold;letter-spacing:12px;color:#0f172a;">${otp}</span>
    </div>
    <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#6b7280;">
      Never share this code. If you did not try to sign in, contact your administrator.</p>`,
  );
}

export function retentionReportEmailHtml({ monthLabel, leadCount, deleteAt }) {
  return shell(
    `Lead report ${monthLabel}`,
    `<p style="margin:0 0 6px;font-size:12px;font-weight:bold;color:#b45309;text-transform:uppercase;letter-spacing:.08em;">Data retention</p>
    <h1 style="margin:0 0 12px;font-size:21px;color:#111827;">${monthLabel} lead report</h1>
    <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#4b5563;">
      The CRM keeps the last 4 months of leads. <b>${monthLabel}</b> is now outside that window.
      The full Excel report (<b>${leadCount}</b> leads) is attached.</p>
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:14px 16px;font-size:13px;color:#92400e;line-height:1.6;">
      All ${monthLabel} leads will be <b>permanently deleted on ${deleteAt}</b> (US Central time).
      Keep this email as the archive copy.</div>`,
  );
}

export function attendanceReportEmailHtml({ monthLabel, employees, summary }) {
  return shell(
    `Attendance ${monthLabel}`,
    `<p style="margin:0 0 6px;font-size:12px;font-weight:bold;color:#2563eb;text-transform:uppercase;letter-spacing:.08em;">Monthly attendance</p>
    <h1 style="margin:0 0 12px;font-size:21px;color:#111827;">${monthLabel} employee attendance report</h1>
    <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#4b5563;">
      The full attendance report for <b>${employees}</b> employees is attached as Excel
      (summary, punch in / punch out for every date, daily biometric grid and system clock-in).</p>
    <table cellspacing="0" cellpadding="6" style="font-size:13px;color:#374151;border-collapse:collapse;">
      <tr><td>Present days</td><td><b>${summary.present}</b></td></tr>
      <tr><td>Half days</td><td><b>${summary.halfDay}</b></td></tr>
      <tr><td>Absent days</td><td><b>${summary.absent}</b></td></tr>
      <tr><td>Missing punch-outs</td><td><b>${summary.missingOut}</b></td></tr>
      <tr><td>Not clocked out (system)</td><td><b>${summary.notClockedOut}</b></td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:12px;color:#6b7280;">Punch data older than 2 months is removed from the CRM, so keep this email as the record.</p>`,
  );
}

/** Punch in / punch out report (sent from Attendance → Punch in / out) */
export function punchReportEmailHtml({
  title,
  employees,
  days,
  totals,
  sentBy,
}) {
  const row = (label, value) =>
    `<tr><td style="padding:7px 10px;border-bottom:1px solid #D8DAD5;color:#65727A;">${label}</td><td style="padding:7px 10px;border-bottom:1px solid #D8DAD5;text-align:right;"><b style="color:#08090B;">${value}</b></td></tr>`;
  return shell(
    `Punch report ${title}`,
    `<p style="margin:0 0 6px;font-size:12px;font-weight:bold;color:#0B3048;text-transform:uppercase;letter-spacing:.08em;">Punch in / punch out</p>
    <h1 style="margin:0 0 12px;font-size:21px;color:#08090B;">${title} punch report</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#4b5563;">
      Punch in and punch out times of <b>${employees}</b> employees for <b>${days}</b> days are attached as Excel.
      Sheet <b>Punch In-Out</b> has every date with punch in and punch out per employee;
      sheet <b>Punch list</b> has one row per person per day with filters.</p>
    <table cellspacing="0" cellpadding="0" style="width:100%;font-size:13px;border-collapse:collapse;background:#F2F0E9;border-radius:8px;">
      ${row("Days with punches", totals.punched)}
      ${row("Present days", totals.present)}
      ${row("Half days", totals.halfDay)}
      ${row("Absent days", totals.absent)}
      ${row("No punch-out", totals.missingOut)}
    </table>
    <p style="margin:16px 0 0;font-size:12px;color:#65727A;">Times are IST. Day = US Central workday.${sentBy ? ` Sent by ${sentBy}.` : ""}</p>`,
  );
}
