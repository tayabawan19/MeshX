import axios from 'axios';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export const sendOtpEmail = async (toEmail: string, otpCode: string): Promise<boolean> => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'no-reply@meshx.app';
  const senderName = process.env.BREVO_SENDER_NAME || 'MeshX Verification';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>MeshX Verification Code</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 40px 20px; }
        .container { max-width: 500px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .logo { font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; margin-bottom: 24px; }
        .title { font-size: 20px; font-weight: 600; color: #ffffff; text-align: center; margin-bottom: 12px; }
        .text { font-size: 14px; color: #94a3b8; text-align: center; margin-bottom: 28px; line-height: 1.6; }
        .otp-box { background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 12px; padding: 18px; text-align: center; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ffffff; margin-bottom: 28px; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4); }
        .footer { font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #334155; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">⚡ MESHX</div>
        <div class="title">Verify Your Email Address</div>
        <div class="text">Use the 6-digit verification code below to complete your MeshX sign up. This code will expire in <strong>10 minutes</strong>.</div>
        <div class="otp-box">${otpCode}</div>
        <div class="text" style="margin-bottom:0;">If you didn't request this code, you can safely ignore this email.</div>
        <div class="footer">&copy; ${new Date().getFullYear()} MeshX Inc. All rights reserved.</div>
      </div>
    </body>
    </html>
  `;

  console.log(`\n========================================`);
  console.log(`[Brevo Email Service] OTP generated for ${toEmail}: ${otpCode}`);
  console.log(`========================================\n`);

  if (!apiKey || apiKey.includes('your-brevo-api-key')) {
    console.warn(`[Brevo Email Service] API key not configured or default. Logged OTP code directly above.`);
    return true;
  }

  try {
    const response = await axios.post(
      BREVO_API_URL,
      {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: toEmail }],
        subject: `${otpCode} is your MeshX verification code`,
        htmlContent: htmlContent,
      },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
      }
    );
    console.log(`[Brevo Email Service] Email successfully sent to ${toEmail}. Message ID: ${response.data.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`[Brevo Email Service] Failed to send email via Brevo API:`, error?.response?.data || error.message);
    return false;
  }
};

export const sendInviteEmail = async (toEmail: string, inviterName: string): Promise<boolean> => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'no-reply@meshx.app';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: sans-serif; background-color: #0f172a; color: #fff; padding: 40px 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; text-align: center;">
        <h1 style="color: #8b5cf6;">⚡ You are invited to MeshX!</h1>
        <p style="color: #94a3b8; font-size: 16px;"><strong>${inviterName}</strong> wants to connect with you on MeshX, the modern real-time chat app.</p>
        <a href="https://meshx.app/download" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px;">Join MeshX Now</a>
      </div>
    </body>
    </html>
  `;

  if (!apiKey || apiKey.includes('your-brevo-api-key')) {
    console.log(`[Brevo Email Service] Invite logged for ${toEmail} from ${inviterName}`);
    return true;
  }

  try {
    await axios.post(
      BREVO_API_URL,
      {
        sender: { name: 'MeshX', email: senderEmail },
        to: [{ email: toEmail }],
        subject: `${inviterName} invited you to join MeshX`,
        htmlContent: htmlContent,
      },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );
    return true;
  } catch (error: any) {
    console.error(`[Brevo Email Service] Failed to send invite email:`, error?.response?.data || error.message);
    return false;
  }
};
