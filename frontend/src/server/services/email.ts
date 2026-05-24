import nodemailer from 'nodemailer';

// Double configuration mapping to support both SMTP_ and MAIL_ prefixed variables
const SMTP_HOST = process.env.SMTP_HOST || process.env.MAIL_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || process.env.MAIL_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || process.env.MAIL_USER || 'sumitgorai839@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || process.env.MAIL_PASSWORD || 'rdcj itas seki bsaw';
const EMAIL_FROM = process.env.EMAIL_FROM || process.env.MAIL_FROM || 'F1 Live <sumitgorai839@gmail.com>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Config transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

export class EmailService {
  /**
   * Generates F1 themed HTML template for verification
   */
  private static getVerificationTemplate(fullName: string, username: string, verificationLink: string, favouriteTeam: string): string {
    const teamColors: Record<string, string> = {
      'Red Bull': '#3671C6',
      'McLaren': '#FF8000',
      'Ferrari': '#E8002D',
      'Mercedes': '#27F4D2',
      'Aston Martin': '#229971',
      'Alpine': '#FF87BC',
      'Haas': '#B6BABD',
      'VCARB': '#6692FF',
      'Kick Sauber': '#52E252',
      'Williams': '#64C4FF',
    };

    const teamColor = teamColors[favouriteTeam] || '#E10600';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your F1 Live Account</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #0D0D14;
            color: #F5F5F5;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #15151E;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          }
          .email-header {
            background: linear-gradient(135deg, #1E1E2E 0%, #0D0D14 100%);
            padding: 30px;
            text-align: center;
            border-bottom: 3px solid ${teamColor};
            position: relative;
          }
          .f1-badge {
            display: inline-block;
            background: linear-gradient(135deg, #E10600 0%, #B30500 100%);
            color: #FFFFFF;
            font-weight: 900;
            font-size: 24px;
            padding: 8px 16px;
            border-radius: 6px;
            letter-spacing: 1px;
            box-shadow: 0 4px 10px rgba(225, 6, 0, 0.3);
          }
          .email-body {
            padding: 40px 30px;
          }
          h1 {
            font-size: 24px;
            font-weight: 700;
            color: #FFFFFF;
            margin-top: 0;
            margin-bottom: 20px;
            letter-spacing: 0.5px;
          }
          p {
            font-size: 15px;
            line-height: 1.6;
            color: #6B6B8D;
            margin-bottom: 25px;
          }
          .highlight {
            color: #FFFFFF;
            font-weight: 600;
          }
          .btn-container {
            text-align: center;
            margin: 35px 0;
          }
          .verify-btn {
            display: inline-block;
            background: linear-gradient(135deg, #E10600 0%, #B30500 100%);
            color: #FFFFFF !important;
            font-weight: bold;
            font-size: 16px;
            text-decoration: none;
            padding: 14px 35px;
            border-radius: 8px;
            box-shadow: 0 0 15px rgba(225, 6, 0, 0.4);
            transition: all 0.3s ease;
          }
          .team-tag {
            display: inline-block;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            border-radius: 20px;
            background-color: ${teamColor}22;
            color: ${teamColor};
            border: 1px solid ${teamColor}44;
            margin-top: 5px;
          }
          .email-footer {
            background-color: #0D0D14;
            padding: 25px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }
          .footer-text {
            font-size: 12px;
            color: #4A4A65;
            line-height: 1.5;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <div class="f1-badge">F1 LIVE</div>
            <div>
              <span class="team-tag">${favouriteTeam} Fan Portal</span>
            </div>
          </div>
          <div class="email-body">
            <h1>Start Your Engines, ${fullName}!</h1>
            <p>Welcome to <span class="highlight">F1 Live</span>, your ultimate Formula 1 command center. You're just one lap away from unlocking real-time race simulations, customizable telemetry, and constructor standings dashboards.</p>
            <p>To finalize your registration and verify your email (<span class="highlight">${username}</span>), please click the button below:</p>
            
            <div class="btn-container">
              <a href="${verificationLink}" class="verify-btn" target="_blank">VERIFY EMAIL</a>
            </div>

            <p style="font-size: 13px; color: #4A4A65;">If the button above does not work, copy and paste the following link into your web browser:<br>
            <a href="${verificationLink}" style="color: #E10600; text-decoration: none;">${verificationLink}</a></p>
            
            <p>We'll see you on the grid!</p>
          </div>
          <div class="email-footer">
            <p class="footer-text">
              F1 Live Dashboard &copy; 2026. All rights reserved.<br>
              This is an automated system email, please do not reply.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generates F1 themed HTML template for password recovery
   */
  private static getResetPasswordTemplate(fullName: string, resetLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset your F1 Live Password</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #0D0D14;
            color: #F5F5F5;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #15151E;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          }
          .email-header {
            background: linear-gradient(135deg, #1E1E2E 0%, #0D0D14 100%);
            padding: 30px;
            text-align: center;
            border-bottom: 3px solid #E10600;
          }
          .f1-badge {
            display: inline-block;
            background: linear-gradient(135deg, #E10600 0%, #B30500 100%);
            color: #FFFFFF;
            font-weight: 900;
            font-size: 24px;
            padding: 8px 16px;
            border-radius: 6px;
            letter-spacing: 1px;
            box-shadow: 0 4px 10px rgba(225, 6, 0, 0.3);
          }
          .email-body {
            padding: 40px 30px;
          }
          h1 {
            font-size: 24px;
            font-weight: 700;
            color: #FFFFFF;
            margin-top: 0;
            margin-bottom: 20px;
            letter-spacing: 0.5px;
          }
          p {
            font-size: 15px;
            line-height: 1.6;
            color: #6B6B8D;
            margin-bottom: 25px;
          }
          .btn-container {
            text-align: center;
            margin: 35px 0;
          }
          .reset-btn {
            display: inline-block;
            background: linear-gradient(135deg, #E10600 0%, #B30500 100%);
            color: #FFFFFF !important;
            font-weight: bold;
            font-size: 16px;
            text-decoration: none;
            padding: 14px 35px;
            border-radius: 8px;
            box-shadow: 0 0 15px rgba(225, 6, 0, 0.4);
            transition: all 0.3s ease;
          }
          .email-footer {
            background-color: #0D0D14;
            padding: 25px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }
          .footer-text {
            font-size: 12px;
            color: #4A4A65;
            line-height: 1.5;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <div class="f1-badge">F1 LIVE</div>
          </div>
          <div class="email-body">
            <h1>Reset Your Password, ${fullName}</h1>
            <p>You are receiving this email because we received a request to reset the password associated with your <strong>F1 Live</strong> driver account.</p>
            <p>To configure a new password and get back on the grid, please click the button below:</p>
            
            <div class="btn-container">
              <a href="${resetLink}" class="reset-btn" target="_blank">RESET PASSWORD</a>
            </div>

            <p style="font-size: 13px; color: #4A4A65;">If the button above does not work, copy and paste the following link into your web browser:<br>
            <a href="${resetLink}" style="color: #E10600; text-decoration: none;">${resetLink}</a></p>
            
            <p style="font-size: 13px; color: #6B6B8D; font-style: italic;">Note: This reset link remains active for exactly 1 hour. If you did not make this request, please ignore this email or contact support to secure your garage credentials.</p>
          </div>
          <div class="email-footer">
            <p class="footer-text">
              F1 Live Dashboard &copy; 2026. All rights reserved.<br>
              This is an automated system email, please do not reply.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Sends email verification link
   */
  static async sendVerificationEmail(
    toEmail: string,
    fullName: string,
    username: string,
    token: string,
    favouriteTeam: string
  ): Promise<boolean> {
    const verificationLink = `${FRONTEND_URL}/verify-email?token=${token}`;

    console.log('\n🏎️ 🏎️ 🏎️ [F1 MAIL SERVICE] 🏎️ 🏎️ 🏎️');
    console.log(`To: ${toEmail} (${fullName})`);
    console.log(`Verification Token: ${token}`);
    console.log(`Link: ${verificationLink}\n`);

    try {
      const htmlContent = this.getVerificationTemplate(fullName, username, verificationLink, favouriteTeam);

      await transporter.sendMail({
        from: EMAIL_FROM,
        to: toEmail,
        subject: '🏎️ Verify your F1 Live Account',
        html: htmlContent,
      });

      console.log('[F1 MAIL SERVICE] Verification email successfully sent!');
      return true;
    } catch (error) {
      console.warn('[F1 MAIL SERVICE WARNING] Failed to send email via SMTP. Falling back to terminal display.');
      console.error(error);
      return false;
    }
  }

  /**
   * Sends password reset recovery link
   */
  static async sendResetPasswordEmail(
    toEmail: string,
    fullName: string,
    token: string
  ): Promise<boolean> {
    const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

    console.log('\n🔐 🔐 🔐 [F1 PASSWORD RECOVERY] 🔐 🔐 🔐');
    console.log(`To: ${toEmail} (${fullName})`);
    console.log(`Reset Token: ${token}`);
    console.log(`Link: ${resetLink}\n`);

    try {
      const htmlContent = this.getResetPasswordTemplate(fullName, resetLink);

      await transporter.sendMail({
        from: EMAIL_FROM,
        to: toEmail,
        subject: '🔒 Reset your F1 Live Password',
        html: htmlContent,
      });

      console.log('[F1 MAIL SERVICE] Recovery email successfully sent!');
      return true;
    } catch (error) {
      console.warn('[F1 MAIL SERVICE WARNING] Failed to send recovery email via SMTP. Falling back to terminal display.');
      console.error(error);
      return false;
    }
  }
}
