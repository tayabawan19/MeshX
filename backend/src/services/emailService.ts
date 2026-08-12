import axios from 'axios';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export const sendOtpEmail = async (toEmail: string, otpCode: string, name?: string): Promise<boolean> => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'no-reply@meshx.app';
  const senderName = process.env.BREVO_SENDER_NAME || 'MeshX Auth';

  const recipientName = name || 'MeshX User';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MeshX Verification Code</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 40px 16px; }
        .card { max-width: 480px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
        .logo-container { text-align: center; margin-bottom: 24px; }
        .logo { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .heading { font-size: 20px; font-weight: 700; color: #ffffff; text-align: center; margin-bottom: 8px; }
        .subtext { font-size: 14px; color: #9ca3af; text-align: center; margin-bottom: 24px; line-height: 1.5; }
        .otp-container { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border-radius: 12px; padding: 20px; text-align: center; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #ffffff; margin-bottom: 24px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4); }
        .notice { font-size: 13px; color: #6b7280; text-align: center; margin-bottom: 24px; }
        .divider { height: 1px; background-color: #1f2937; margin-bottom: 24px; }
        .footer { font-size: 12px; color: #4b5563; text-align: center; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo-container">
          <span class="logo">⚡ MESHX</span>
        </div>
        <div class="heading">Security Verification Code</div>
        <div class="subtext">Hello ${recipientName},<br>Use the 6-digit verification code below to authorize your account action.</div>
        <div class="otp-container">${otpCode}</div>
        <div class="notice">⚠️ This code will expire in <strong>10 minutes</strong>. Do not share this code with anyone.</div>
        <div class="divider"></div>
        <div class="footer">If you did not request this code, please ignore this email.<br>&copy; ${new Date().getFullYear()} MeshX Inc. All rights reserved.</div>
      </div>
    </body>
    </html>
  `;

  console.log(`\n==================================================`);
  console.log(`[Brevo Email Service] OTP Generated for ${toEmail}: ${otpCode}`);
  console.log(`==================================================\n`);

  if (!apiKey || apiKey.includes('your_brevo') || apiKey.includes('your-brevo')) {
    console.warn(`[Brevo Email Service] BREVO_API_KEY is not configured or using default template. Logged OTP code directly above.`);
    return true;
  }

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

    console.log(`[Brevo Email Service] Email successfully sent to ${toEmail}. Message ID: ${response.data.messageId}`);
    return true;
  } catch (error: any) {
    const errorMessage = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
    console.error(`[Brevo Email Service Error] Failed to send email to ${toEmail}:`, errorMessage);
    throw new Error(`Brevo API Email Error: ${errorMessage}`);
  }
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 40px 16px; }
        .card { max-width: 480px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px; text-align: center; }
        .logo { font-size: 26px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .heading { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 16px; margin-bottom: 12px; }
        .subtext { font-size: 15px; color: #9ca3af; line-height: 1.6; margin-bottom: 28px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); }
        .footer { font-size: 12px; color: #4b5563; margin-top: 32px; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="logo">⚡ MESHX</span>
        <div class="heading">You're Invited!</div>
        <div class="subtext"><strong>${inviterName}</strong> wants to connect with you on MeshX, the fast, secure real-time messaging app.</div>
        <a href="https://meshx.app" class="btn">Join MeshX Now</a>
        <div class="footer">&copy; ${new Date().getFullYear()} MeshX Inc. All rights reserved.</div>
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
