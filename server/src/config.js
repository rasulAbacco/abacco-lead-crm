// Central place for business settings. Values can be overridden in .env.
const num = (v, d) =>
  v !== undefined && v !== "" && !isNaN(Number(v)) ? Number(v) : d;

export const config = {
  port: num(process.env.PORT, 5001),
  jwtSecret: process.env.JWT_SECRET,
  masterOtp: process.env.MASTER_OTP || null,

  /** All business dates (today, months, retention) use US Central time. */
  timeZone: "America/Chicago",

  corsOrigins: (
    process.env.CORS_ORIGINS ||
    "http://localhost:5173,https://leadcrm.abaccotech.com,https://t3kkdxqs-5173.inc1.devtunnels.ms"
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  /** Same client email can be uploaded again only after this many months. */
  duplicateWindowMonths: num(process.env.DUPLICATE_WINDOW_MONTHS, 2),

  /** Number of calendar months kept (current month + 3 previous = 4). */
  retentionMonths: num(process.env.RETENTION_MONTHS, 4),
  /** Hours between the report email/notice and the permanent delete. */
  retentionNoticeHours: num(process.env.RETENTION_NOTICE_HOURS, 48),
  retentionReportEmail:
    process.env.RETENTION_REPORT_EMAIL || "info@abaccotech.com",

  /** Login history older than this is deleted automatically. */
  loginHistoryDays: num(process.env.LOGIN_HISTORY_DAYS, 7),

  /** "What's new" popup is shown on login for this many hours after release. */
  releasePopupHours: num(process.env.RELEASE_POPUP_HOURS, 48),

  /** Bonus when an employee reaches 2x their monthly target. */
  doubleTargetBonus: num(process.env.DOUBLE_TARGET_BONUS, 5000),

  /** Attendance: full day needs this many hours between first and last punch. */
  fullDayHours: num(process.env.FULL_DAY_HOURS, 9),
  /** Biometric punches + clock-in sessions kept for this many months (current + previous). */
  attendanceMonths: num(process.env.ATTENDANCE_MONTHS, 2),
  /** Open clock-in sessions are closed automatically at this IST time. */
  autoClockOutIst: process.env.AUTO_CLOCK_OUT_IST || "04:30",
  /** Monthly attendance Excel is emailed here on the 1st of each month. */
  attendanceReportEmail:
    process.env.ATTENDANCE_REPORT_EMAIL ||
    process.env.RETENTION_REPORT_EMAIL ||
    "info@abaccotech.com",
  /** Optional shared secret the biometric machine/bridge sends as ?key= or x-device-key. */
  deviceKey: process.env.BIOMETRIC_DEVICE_KEY || null,

  /** Server-side cache lifetime for dashboards/lists (seconds). */
  cacheTtlSeconds: num(process.env.CACHE_TTL_SECONDS, 300),
};

if (!config.jwtSecret) {
  console.error("❌ JWT_SECRET is not set. Refusing to start without it.");
  process.exit(1);
}
