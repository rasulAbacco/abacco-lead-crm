// ═══════════════════════════════════════════════════════════════
//  Abacco Technology — CRM Email Templates
//  Drop these functions into your auth route file and call them
//  in place of the inline html strings in sgMail.send()
// ═══════════════════════════════════════════════════════════════

/**
 * OTP Login Email Template
 * Usage: html: otpEmailTemplate(generatedOtp)
 */
export function otpEmailTemplate(otp) {
  const digits = otp.toString().split("");
  const digitBoxes = digits
    .map(
      (d) => `
    <td style="padding:0 4px;">
      <div style="width:46px;height:56px;background:#ffffff;border:2px solid #c4b5fd;
        border-radius:12px;text-align:center;line-height:56px;
        font-family:Georgia,serif;font-size:30px;font-weight:900;
        color:#1e1b4b;box-shadow:0 4px 12px rgba(124,58,237,0.15);">${d}</div>
    </td>`,
    )
    .join(
      '<td style="padding:0 5px;"><div style="width:5px;height:5px;background:#c4b5fd;border-radius:50%;margin:auto;"></div></td>',
    );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Admin Login OTP — Abacco Technology</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f0ff;font-family:Georgia,'Times New Roman',serif;">

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f3f0ff;">
    <tr><td align="center" style="padding:40px 16px;">

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;width:100%;">

        <!-- ═══ HEADER ═══ -->
        <tr><td>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
            style="background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 45%,#4f46e5 100%);border-radius:20px 20px 0 0;">
            <tr><td style="padding:36px 40px 32px;">

              <!-- Brand -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background:rgba(255,255,255,0.15);border-radius:12px;padding:8px;border:1px solid rgba(255,255,255,0.25);">
                    <img src="https://www.abaccotech.com/Logo/icon.png" alt="A" width="36" height="36"
                      style="display:block;width:36px;height:36px;border-radius:6px;"/>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <div style="font-family:Georgia,serif;font-size:16px;font-weight:700;color:#fff;">Abacco Technology</div>
                    <div style="font-family:Georgia,serif;font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.12em;margin-top:2px;">Lead CRM Management</div>
                  </td>
                </tr>
              </table>

              <div style="height:1px;background:rgba(255,255,255,0.15);margin:24px 0;"></div>

              <!-- Icon -->
              <div style="text-align:center;margin-bottom:16px;">
                <div style="display:inline-block;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.22);border-radius:18px;padding:16px 20px;font-size:34px;">🔐</div>
              </div>

              <div style="text-align:center;">
                <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#fff;margin:0 0 8px;line-height:1.25;">
                  Admin Verification Required
                </h1>
                <p style="font-family:Georgia,serif;font-size:14px;color:rgba(255,255,255,0.65);margin:0;line-height:1.7;">
                  A sign-in attempt was detected for your admin account.<br/>
                  Enter the code below to continue.
                </p>
              </div>

            </td></tr>
          </table>
        </td></tr>

        <!-- ═══ BODY ═══ -->
        <tr><td>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
            style="background:#fff;border-left:1px solid #ede9fe;border-right:1px solid #ede9fe;">
            <tr><td style="padding:40px 40px 32px;">

              <p style="font-family:Georgia,serif;font-size:15px;color:#4b5563;line-height:1.8;margin:0 0 28px;">
                Hello, <strong style="color:#1e1b4b;">Admin</strong> 👋<br/>
                Use the one-time passcode below to sign in to your
                <strong style="color:#7c3aed;">Abacco CRM Dashboard</strong>.
                This code is valid for <strong>10 minutes</strong> only and can only be used once.
              </p>

              <!-- OTP Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-radius:16px;border:2px solid #ddd6fe;padding:32px 20px;text-align:center;">

                    <p style="font-family:Georgia,serif;font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.14em;margin:0 0 20px;">
                      ✦ &nbsp;Your One-Time Passcode&nbsp; ✦
                    </p>

                    <!-- Digit boxes -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                      <tr>${digitBoxes}</tr>
                    </table>

                    <!-- Fallback plain text OTP -->
                    <p style="font-family:'Courier New',monospace;font-size:36px;font-weight:900;color:#1e1b4b;letter-spacing:10px;margin:20px 0 0;">
                      ${otp}
                    </p>

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-top:18px;">
                      <tr>
                        <td style="background:rgba(124,58,237,0.1);border-radius:20px;padding:8px 20px;">
                          <span style="font-family:Georgia,serif;font-size:12px;font-weight:700;color:#7c3aed;">⏱&nbsp; Expires in 10 minutes</span>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Info cards row -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:24px;">
                <tr>
                  <td width="50%" style="padding-right:8px;vertical-align:top;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;">
                          <div style="font-size:18px;margin-bottom:8px;">🛡️</div>
                          <div style="font-family:Georgia,serif;font-size:12px;font-weight:700;color:#166534;margin-bottom:4px;">Secure & Encrypted</div>
                          <div style="font-family:Georgia,serif;font-size:12px;color:#4b7a5e;line-height:1.6;">This code is unique to this login session only.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="50%" style="padding-left:8px;vertical-align:top;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px;">
                          <div style="font-size:18px;margin-bottom:8px;">⚠️</div>
                          <div style="font-family:Georgia,serif;font-size:12px;font-weight:700;color:#9a3412;margin-bottom:4px;">Never Share This</div>
                          <div style="font-family:Georgia,serif;font-size:12px;color:#7c4c38;line-height:1.6;">Abacco will never ask for your OTP via call or message.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Warning box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:20px;">
                <tr>
                  <td style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:14px 18px;">
                    <p style="font-family:Georgia,serif;font-size:13px;color:#dc2626;margin:0;line-height:1.7;">
                      <strong>Didn't request this?</strong> If you did not attempt to sign in, someone may be trying to access your account.
                      Please contact your system administrator immediately at
                      <a href="mailto:admin@abaccotech.com" style="color:#7c3aed;text-decoration:none;font-weight:700;">admin@abaccotech.com</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td></tr>
          </table>
        </td></tr>

        <!-- ═══ FOOTER ═══ -->
        <tr><td>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
            style="background:#1e1b4b;border-radius:0 0 20px 20px;">
            <tr><td style="padding:28px 40px;">

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <div style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#fff;">Abacco Technology</div>
                    <div style="font-family:Georgia,serif;font-size:11px;color:rgba(255,255,255,0.38);margin-top:3px;">Lead CRM Management Platform</div>
                  </td>
                  <td style="text-align:right;vertical-align:top;">
                    <span style="font-family:Georgia,serif;font-size:11px;color:rgba(255,255,255,0.35);">🔒 SSL Secured</span>
                  </td>
                </tr>
              </table>

              <div style="height:1px;background:rgba(255,255,255,0.1);margin:16px 0;"></div>

              <p style="font-family:Georgia,serif;font-size:11px;color:rgba(255,255,255,0.28);margin:0;text-align:center;line-height:1.9;">
                This is an automated security notification from Abacco Technology.<br/>
                Please do not reply to this email.&nbsp;&nbsp;·&nbsp;&nbsp;© 2026 Abacco Technology&nbsp;&nbsp;·&nbsp;&nbsp;All rights reserved
              </p>

            </td></tr>
          </table>
        </td></tr>

        <tr><td style="height:32px;"></td></tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

/**
 * Resend OTP Email Template
 * Usage: html: resendOtpEmailTemplate(newOtp)
 * Same design, slight copy change + resend badge
 */
export function resendOtpEmailTemplate(otp) {
  const digits = otp.toString().split("");
  const digitBoxes = digits
    .map(
      (d) => `
    <td style="padding:0 4px;">
      <div style="width:46px;height:56px;background:#ffffff;border:2px solid #a5f3fc;
        border-radius:12px;text-align:center;line-height:56px;
        font-family:Georgia,serif;font-size:30px;font-weight:900;
        color:#0e7490;box-shadow:0 4px 12px rgba(6,182,212,0.15);">${d}</div>
    </td>`,
    )
    .join(
      '<td style="padding:0 5px;"><div style="width:5px;height:5px;background:#a5f3fc;border-radius:50%;margin:auto;"></div></td>',
    );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>New OTP Code — Abacco Technology</title>
</head>
<body style="margin:0;padding:0;background-color:#ecfeff;font-family:Georgia,'Times New Roman',serif;">

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ecfeff;">
    <tr><td align="center" style="padding:40px 16px;">

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;width:100%;">

        <!-- HEADER -->
        <tr><td>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
            style="background:linear-gradient(135deg,#0891b2 0%,#0e7490 50%,#155e75 100%);border-radius:20px 20px 0 0;">
            <tr><td style="padding:36px 40px 32px;">

              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background:rgba(255,255,255,0.15);border-radius:12px;padding:8px;border:1px solid rgba(255,255,255,0.25);">
                    <img src="https://www.abaccotech.com/Logo/icon.png" alt="A" width="36" height="36"
                      style="display:block;width:36px;height:36px;border-radius:6px;"/>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <div style="font-family:Georgia,serif;font-size:16px;font-weight:700;color:#fff;">Abacco Technology</div>
                    <div style="font-family:Georgia,serif;font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.12em;margin-top:2px;">Lead CRM Management</div>
                  </td>
                  <td style="padding-left:20px;vertical-align:middle;">
                    <div style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);border-radius:20px;padding:5px 14px;">
                      <span style="font-family:Georgia,serif;font-size:11px;font-weight:700;color:#fff;letter-spacing:0.06em;">🔄 RESENT</span>
                    </div>
                  </td>
                </tr>
              </table>

              <div style="height:1px;background:rgba(255,255,255,0.15);margin:24px 0;"></div>

              <div style="text-align:center;margin-bottom:14px;">
                <div style="display:inline-block;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.22);border-radius:18px;padding:16px 20px;font-size:34px;">📨</div>
              </div>

              <div style="text-align:center;">
                <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#fff;margin:0 0 8px;">
                  Here's Your New Code
                </h1>
                <p style="font-family:Georgia,serif;font-size:14px;color:rgba(255,255,255,0.65);margin:0;line-height:1.7;">
                  You requested a fresh verification code.<br/>
                  Your previous code has been invalidated.
                </p>
              </div>

            </td></tr>
          </table>
        </td></tr>

        <!-- BODY -->
        <tr><td>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
            style="background:#fff;border-left:1px solid #a5f3fc;border-right:1px solid #a5f3fc;">
            <tr><td style="padding:40px 40px 32px;">

              <p style="font-family:Georgia,serif;font-size:15px;color:#4b5563;line-height:1.8;margin:0 0 28px;">
                Hello, <strong style="color:#0e7490;">Admin</strong> 👋<br/>
                Here's your <strong>new one-time passcode</strong> for signing in to the
                <strong style="color:#0891b2;">Abacco CRM Dashboard</strong>.
                Use this code within <strong>10 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background:linear-gradient(135deg,#ecfeff,#cffafe);border-radius:16px;border:2px solid #a5f3fc;padding:32px 20px;text-align:center;">

                    <p style="font-family:Georgia,serif;font-size:11px;font-weight:700;color:#0891b2;text-transform:uppercase;letter-spacing:0.14em;margin:0 0 20px;">
                      ✦ &nbsp;Your New One-Time Passcode&nbsp; ✦
                    </p>

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                      <tr>${digitBoxes}</tr>
                    </table>

                    <p style="font-family:'Courier New',monospace;font-size:36px;font-weight:900;color:#0e7490;letter-spacing:10px;margin:20px 0 0;">
                      ${otp}
                    </p>

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-top:18px;">
                      <tr>
                        <td style="background:rgba(8,145,178,0.1);border-radius:20px;padding:8px 20px;">
                          <span style="font-family:Georgia,serif;font-size:12px;font-weight:700;color:#0891b2;">⏱&nbsp; Expires in 10 minutes</span>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:20px;">
                <tr>
                  <td style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:14px 18px;">
                    <p style="font-family:Georgia,serif;font-size:13px;color:#dc2626;margin:0;line-height:1.7;">
                      <strong>Didn't request this?</strong> Contact your administrator immediately at
                      <a href="mailto:admin@abaccotech.com" style="color:#0891b2;text-decoration:none;font-weight:700;">admin@abaccotech.com</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td></tr>
          </table>
        </td></tr>

        <!-- FOOTER -->
        <tr><td>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
            style="background:#0c4a6e;border-radius:0 0 20px 20px;">
            <tr><td style="padding:28px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <div style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#fff;">Abacco Technology</div>
                    <div style="font-family:Georgia,serif;font-size:11px;color:rgba(255,255,255,0.35);margin-top:3px;">Lead CRM Management Platform</div>
                  </td>
                  <td style="text-align:right;">
                    <span style="font-family:Georgia,serif;font-size:11px;color:rgba(255,255,255,0.3);">🔒 SSL Secured</span>
                  </td>
                </tr>
              </table>
              <div style="height:1px;background:rgba(255,255,255,0.1);margin:16px 0;"></div>
              <p style="font-family:Georgia,serif;font-size:11px;color:rgba(255,255,255,0.26);margin:0;text-align:center;line-height:1.9;">
                Automated security notification · Do not reply · © 2026 Abacco Technology · All rights reserved
              </p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="height:32px;"></td></tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}
