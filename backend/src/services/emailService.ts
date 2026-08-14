import axios from 'axios';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export function buildOtpEmailHtml(name: string, otpCode: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MeshX Verification Code</title>
</head>
<body style="margin:0; padding:0; background-color:#0F0F14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0F0F14; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#1A1A22; border-radius:20px; overflow:hidden;">

          <!-- Header / Logo -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <div style="display:inline-block; padding:14px 28px; border-radius:16px; background: linear-gradient(135deg, #7C3AED, #3B82F6);">
                <span style="font-size:22px; font-weight:700; color:#ffffff; letter-spacing:0.5px;">MeshX</span>
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td align="center" style="padding: 10px 40px 0 40px;">
              <p style="font-size:18px; color:#F5F5F7; margin:0;">Hi ${name || 'there'} 👋</p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 10px 40px 0 40px;">
              <p style="font-size:14px; color:#9A9AA5; margin:0; line-height:1.6;">
                Use the verification code below to complete your MeshX signup. This code will expire in 10 minutes.
              </p>
            </td>
          </tr>

          <!-- OTP Code Box -->
          <tr>
            <td align="center" style="padding: 32px 40px;">
              <div style="background: linear-gradient(135deg, #7C3AED, #3B82F6); border-radius:16px; padding:2px;">
                <div style="background-color:#1A1A22; border-radius:14px; padding:24px 40px;">
                  <span style="font-size:36px; font-weight:700; letter-spacing:10px; color:#ffffff; font-family: 'Courier New', monospace;">
                    ${otpCode}
                  </span>
                </div>
              </div>
            </td>
          </tr>

          <!-- Expiry note -->
          <tr>
            <td align="center" style="padding: 0 40px 8px 40px;">
              <p style="font-size:13px; color:#6B6B76; margin:0;">
                ⏱ Expires in 10 minutes
              </p>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td align="center" style="padding: 24px 40px 0 40px;">
              <p style="font-size:12px; color:#6B6B76; margin:0; line-height:1.6;">
                If you didn't request this code, you can safely ignore this email. Someone may have typed your email address by mistake.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 32px 40px 0 40px;">
              <div style="height:1px; background-color:#2A2A33; width:100%;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px 40px 40px 40px;">
              <p style="font-size:12px; color:#6B6B76; margin:0;">
                © ${new Date().getFullYear()} MeshX. Connect, chat, forever.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

import nodemailer from 'nodemailer';

export const sendOtpEmail = async (toEmail: string, otpCode: string, name?: string): Promise<boolean> => {
  const apiKey = process.env.BREVO_API_KEY;
  const smtpKey = process.env.BREVO_SMTP_KEY;
  const smtpUser = process.env.BREVO_SMTP_USER || 'b1d8c5001@smtp-brevo.com';
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'maliktayab.in@gmail.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'MeshX Auth';
  const recipientName = name || 'MeshX User';

  const htmlContent = buildOtpEmailHtml(recipientName, otpCode);

  console.log(`\n==================================================`);
  console.log(`[Brevo Email Service] OTP Generated for ${toEmail}: ${otpCode}`);
  console.log(`==================================================\n`);

  // 1. Try Nodemailer SMTP if BREVO_SMTP_KEY is present
  if (smtpKey) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        auth: {
          user: smtpUser,
          pass: smtpKey,
        },
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: `"${recipientName}" <${toEmail}>`,
        subject: `${otpCode} is your MeshX verification code`,
        html: htmlContent,
      });

      console.log(`[Brevo SMTP Service] Email successfully sent to ${toEmail}. MessageId: ${info.messageId}`);
      return true;
    } catch (smtpErr: any) {
      console.error(`[Brevo SMTP Error] Failed via Nodemailer SMTP:`, smtpErr.message);
    }
  }

  // 2. Try Brevo REST API if BREVO_API_KEY is present
  if (apiKey && !apiKey.includes('your_brevo') && !apiKey.includes('your-brevo')) {
    try {
      const response = await axios.post(
        BREVO_API_URL,
        {
          sender: { name: senderName, email: senderEmail },
          to: [{ email: toEmail, name: recipientName }],
          subject: `${otpCode} is your MeshX verification code`,
          htmlContent,
        },
        {
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
            'accept': 'application/json',
          },
        }
      );

      console.log(`[Brevo API Service] Email successfully sent to ${toEmail}. Message ID: ${response.data.messageId}`);
      return true;
    } catch (error: any) {
      const errorMessage = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
      console.error(`[Brevo Email Service Error] Failed to send email to ${toEmail}:`, errorMessage);
    }
  }

  console.warn(`[Brevo Email Service Fallback] Sign-up proceeding in dev fallback mode. Use console OTP above: ${otpCode}`);
  return false;
};

export const sendInviteEmail = async (toEmail: string, inviterName: string): Promise<boolean> => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'no-reply@meshx.app';
  const senderName = process.env.BREVO_SENDER_NAME || 'MeshX';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Join MeshX</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0F0F14; color: #f3f4f6; margin: 0; padding: 40px 16px; }
        .card { max-width: 480px; margin: 0 auto; background-color: #1A1A22; border-radius: 20px; padding: 32px; text-align: center; }
        .logo { font-size: 24px; font-weight: 800; color: #ffffff; display: inline-block; padding: 12px 24px; border-radius: 14px; background: linear-gradient(135deg, #7C3AED, #3B82F6); }
        .heading { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 20px; margin-bottom: 12px; }
        .subtext { font-size: 15px; color: #9A9AA5; line-height: 1.6; margin-bottom: 28px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #7C3AED, #3B82F6); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; }
        .footer { font-size: 12px; color: #6B6B76; margin-top: 32px; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="logo">MeshX</span>
        <div class="heading">You're Invited!</div>
        <div class="subtext"><strong>${inviterName}</strong> wants to connect with you on MeshX, the fast, secure real-time messaging app.</div>
        <a href="https://meshx.app" class="btn">Join MeshX Now</a>
        <div class="footer">&copy; ${new Date().getFullYear()} MeshX. Connect, chat, forever.</div>
      </div>
    </body>
    </html>
  `;

  console.log(`\n==================================================`);
  console.log(`[Brevo Email Service] Invite Email sent to ${toEmail} from ${inviterName}`);
  console.log(`==================================================\n`);

  if (!apiKey || apiKey.includes('your_brevo') || apiKey.includes('your-brevo')) {
    console.warn(`[Brevo Email Service] BREVO_API_KEY is not configured or using default template. Logged invite above.`);
    return true;
  }

  try {
    const response = await axios.post(
      BREVO_API_URL,
      {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: toEmail }],
        subject: `${inviterName} invited you to join MeshX`,
        htmlContent,
      },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
      }
    );
    console.log(`[Brevo Email Service] Invite email sent to ${toEmail}. Message ID: ${response.data.messageId}`);
    return true;
  } catch (error: any) {
    const errorMessage = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
    console.error(`[Brevo Email Service Error] Failed to send invite email to ${toEmail}:`, errorMessage);
    throw new Error(`Brevo API Email Error: ${errorMessage}`);
  }
};
