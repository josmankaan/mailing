const nodemailer = require('nodemailer');

const sendVerificationEmail = async (email, username, token) => {
  let transporter;

  // If we don't have credentials in .env, use a test Ethereal account
  if (!process.env.SMTP_USER) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('--- TEST EMAIL MODE ---');
    console.log('User:', testAccount.user);
    console.log('Pass:', testAccount.pass);
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // SSL/HTTPS zorlaması ile güvenli backend rotası oluşturuluyor
  const baseUrl = process.env.API_URL || 'https://api.atlasdatamining.com';
  const secureBaseUrl = baseUrl.startsWith('http://') ? baseUrl.replace('http://', 'https://') : baseUrl;
  const verificationUrl = `${secureBaseUrl}/verify-email/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Atlas Data Mining <noreply@atlasdatamining.com>',
    to: email,
    subject: 'Mining Expedition: Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb; text-align: center;">Welcome to Atlas Data Mining</h2>
        <p>Hello <strong>${username}</strong>,</p>
        <p>You're one step away from starting your mining expedition. Please verify your email address to activate your account and claim your <strong>50 mining credits</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `
  };

  const info = await transporter.sendMail(mailOptions);
  
  if (!process.env.SMTP_USER) {
    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }

  return info;
};

module.exports = {
  sendVerificationEmail
};
