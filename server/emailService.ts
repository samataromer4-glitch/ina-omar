import nodemailer from "nodemailer";

interface SendInvitationEmailParams {
  toEmail: string;
  teacherName: string;
  schoolName: string;
  activationLink: string;
  expiresInDays?: number;
}

interface SendVerificationEmailParams {
  toEmail: string;
  userName?: string;
  verificationCode: string;
  verificationLink?: string;
  schoolName?: string;
}

interface SendPasswordResetEmailParams {
  toEmail: string;
  userName?: string;
  resetLink: string;
  schoolName?: string;
  expiresInMinutes?: number;
}

let cachedTransporter: nodemailer.Transporter | null = null;

function getEmailTransporter(): nodemailer.Transporter | null {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  try {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });
    return cachedTransporter;
  } catch (err) {
    console.error("[Email Service] Failed to initialize email transporter:", err);
    return null;
  }
}

function getSenderAddress(schoolName: string = "DUGSI PRO 2026"): string {
  let rawFrom = (process.env.SMTP_FROM || process.env.SMTP_USER || "").trim();
  if (rawFrom && !rawFrom.includes("@")) {
    const smtpUser = (process.env.SMTP_USER || "").trim();
    if (smtpUser && smtpUser.includes("@")) {
      rawFrom = smtpUser;
    } else {
      rawFrom = `${rawFrom}@gmail.com`;
    }
  }
  const fromEmail = rawFrom || "no-reply@dugsigapro.edu";
  return `"${schoolName}" <${fromEmail}>`;
}

/* =========================================================================
   1. TEACHER INVITATION EMAIL
   ========================================================================= */
export async function sendTeacherInvitationEmail({
  toEmail,
  teacherName,
  schoolName,
  activationLink,
  expiresInDays = 7
}: SendInvitationEmailParams): Promise<{ success: boolean; error?: string; simulated?: boolean }> {
  const fromAddress = getSenderAddress(schoolName);
  const cleanEmail = toEmail.trim().toLowerCase();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Casuumaad: Ku soo dhowow ${schoolName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #0f172a; padding: 28px 24px; text-align: center; border-bottom: 4px solid #7c3aed; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .greeting { font-size: 17px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
    .btn { display: inline-block; background-color: #7c3aed; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 15px; font-weight: 600; }
    .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${schoolName}</h1>
      <p style="color: #94a3b8; margin: 4px 0 0;">Nidaamka DUGSI PRO 2026</p>
    </div>
    <div class="content">
      <div class="greeting">Ku soo dhowow, Macallin ${teacherName}!</div>
      <p>Maamulka dugsiga <strong>${schoolName}</strong> ayaa kugu soo daray nidaamka adigoo ah <strong>Macallin (Teacher)</strong>.</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${activationLink}" class="btn" target="_blank">Dhaqaaji Akoonkaaga (Activate Account)</a>
      </div>
      <p style="font-size: 12px; color: #64748b;">Link-gani wuxuu dhacayaa ${expiresInDays} maalmood gudahood.</p>
    </div>
    <div class="footer">DUGSI PRO 2026 School Management System</div>
  </div>
</body>
</html>`;

  const textContent = `Ku soo dhowow ${schoolName}, Macallin ${teacherName}!\n\nRiix link-gan si aad u dhaqaajiso akoonkaaga:\n${activationLink}\n\nLink-gani wuxuu dhacayaa ${expiresInDays} maalmood gudahood.`;

  const transporter = getEmailTransporter();
  if (!transporter) {
    console.log(`[Email Service Notice] SMTP not configured. Simulating invitation email to ${cleanEmail}`);
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: cleanEmail,
      subject: `Casuumaad Macallin: Ku soo dhowow ${schoolName}`,
      text: textContent,
      html: htmlContent
    });
    return { success: true };
  } catch (err: any) {
    console.error(`[Email Service Error] Failed to send email to ${cleanEmail}:`, err?.message || err);
    return { success: false, error: err?.message || "Email sending failed" };
  }
}

/* =========================================================================
   2. EMAIL VERIFICATION
   ========================================================================= */
export async function sendVerificationEmail({
  toEmail,
  userName = "Isticmaale",
  verificationCode,
  verificationLink,
  schoolName = "DUGSI PRO 2026"
}: SendVerificationEmailParams): Promise<{ success: boolean; error?: string; simulated?: boolean }> {
  const fromAddress = getSenderAddress(schoolName);
  const cleanEmail = toEmail.trim().toLowerCase();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Xaqiiji Email-kaaga - ${schoolName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #0f172a; padding: 24px; text-align: center; border-bottom: 4px solid #2563eb; }
    .header h1 { color: #ffffff; margin: 0; font-size: 20px; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .code-box { font-size: 32px; font-weight: 700; letter-spacing: 6px; text-align: center; padding: 18px; margin: 24px 0; background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 8px; color: #1d4ed8; }
    .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${schoolName}</h1>
      <p style="color: #94a3b8; margin: 4px 0 0;">Xaqiijinta Akoonka Cusub</p>
    </div>
    <div class="content">
      <p>Ku soo dhowow <strong>${schoolName}</strong>, ${userName}!</p>
      <p>Fadlan isticmaal koodhkan xaqiijinta si aad u hawlgeliso akoonkaaga maamulka:</p>
      <div class="code-box">${verificationCode}</div>
      <p style="font-size: 12px; color: #64748b;">Koodhkani wuxuu dhacayaa 24 saacadood gudahood. Haddii aadan adigu diiwaangelin akoonkan, fadlan iska indhatir email-kan.</p>
    </div>
    <div class="footer">DUGSI PRO 2026 System • Xaqiijin Amni</div>
  </div>
</body>
</html>`;

  const textContent = `Ku soo dhowow ${schoolName}!\n\nKoodhkaaga xaqiijinta waa: ${verificationCode}\n\nKoodhkani wuxuu dhacayaa 24 saac gudahood.`;

  const transporter = getEmailTransporter();
  if (!transporter) {
    console.log(`[Email Service Notice] SMTP not configured. Simulating verification email to ${cleanEmail}`);
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: cleanEmail,
      subject: `Xaqiijinta Akoonkaaga: ${verificationCode} - ${schoolName}`,
      text: textContent,
      html: htmlContent
    });
    return { success: true };
  } catch (err: any) {
    console.error(`[Email Service Error] Failed to send verification email to ${cleanEmail}:`, err?.message || err);
    return { success: false, error: err?.message || "Email sending failed" };
  }
}

/* =========================================================================
   3. PASSWORD RESET EMAIL
   ========================================================================= */
export async function sendPasswordResetEmail({
  toEmail,
  userName = "Isticmaale",
  resetLink,
  schoolName = "DUGSI PRO 2026",
  expiresInMinutes = 60
}: SendPasswordResetEmailParams): Promise<{ success: boolean; error?: string; simulated?: boolean }> {
  const fromAddress = getSenderAddress(schoolName);
  const cleanEmail = toEmail.trim().toLowerCase();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Dib-u-dejinta Furaha Sirta ah - ${schoolName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #0f172a; padding: 24px; text-align: center; border-bottom: 4px solid #ef4444; }
    .header h1 { color: #ffffff; margin: 0; font-size: 20px; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .btn { display: inline-block; background-color: #ef4444; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 15px; font-weight: 600; }
    .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${schoolName}</h1>
      <p style="color: #94a3b8; margin: 4px 0 0;">Dib-u-dejinta Furaha Sirta ah (Password Reset)</p>
    </div>
    <div class="content">
      <p>Asc ${userName},</p>
      <p>Waxaa nala soo gaarsiiyay codsi dib loogu dejinayo furahaaga sirta ah (password). Fadlan riix batoonka hoose si aad u samaysato password cusub:</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetLink}" class="btn" target="_blank">Beddel Password-kaaga</a>
      </div>
      <p style="font-size: 12px; color: #64748b;">Link-gani wuxuu shaqeynayaa <strong>${expiresInMinutes} daqiiqo</strong> oo kaliya. Haddii aadan adigu codsan, fadlan iska indhatir oo password-kaagu ma beddelmi doono.</p>
    </div>
    <div class="footer">DUGSI PRO 2026 • Nidaamka Amniga</div>
  </div>
</body>
</html>`;

  const textContent = `Dib-u-dejinta Password-ka (${schoolName}):\n\nRiix link-gan si aad u beddesho password-kaaga:\n${resetLink}\n\nLink-gani wuxuu dhacayaa ${expiresInMinutes} daqiiqo gudahood.`;

  const transporter = getEmailTransporter();
  if (!transporter) {
    console.log(`[Email Service Notice] SMTP not configured. Simulating password reset email to ${cleanEmail}`);
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: cleanEmail,
      subject: `Dib-u-dejinta Password-ka - ${schoolName}`,
      text: textContent,
      html: htmlContent
    });
    return { success: true };
  } catch (err: any) {
    console.error(`[Email Service Error] Failed to send password reset email to ${cleanEmail}:`, err?.message || err);
    return { success: false, error: err?.message || "Email sending failed" };
  }
}
