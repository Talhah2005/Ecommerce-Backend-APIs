import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send email utility
 * param {Object} options - Email options
 * param {string} options.to - Recipient email
 * param {string} options.subject - Email subject
 * param {string} options.text - Plain text content
 * param {string} options.html - HTML content
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'E-Commerce App'}" <${process.env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent:', info.messageId);
    
    return info;
  } catch (error) {
    console.error('❌ Email send error:', error);
    throw new Error('Failed to send email');
  }
};

/**
 * Send welcome email
 * param {Object} user - User object
 * param {string} verificationToken - Email verification token
 */
export const sendWelcomeEmail = async (user, verificationToken) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Our E-Commerce Platform</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Our Platform!</h1>
          <p>Thank you for joining our e-commerce community</p>
        </div>
        <div class="content">
          <h2>Hi ${user.name}! 👋</h2>
          <p>We're excited to have you on board! To get started, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
          
          <p><strong>Note:</strong> This verification link will expire in 24 hours.</p>
        </div>
        <div class="footer">
          <p>If you didn't create this account, please ignore this email.</p>
          <p>&copy; ${new Date().getFullYear()} E-Commerce Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Welcome to Our E-Commerce Platform!
    
    Hi ${user.name},
    
    Thank you for joining our community! Please verify your email address by visiting:
    ${verificationUrl}
    
    This link will expire in 24 hours.
    
    If you didn't create this account, please ignore this email.
  `;
  
  await sendEmail({
    to: user.email,
    subject: '🎉 Welcome! Please verify your email',
    text,
    html,
  });
};

/**
 * Send password reset email
 * param {Object} user - User object
 * param {string} resetToken - Password reset token
 */
export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f44336; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #f44336; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: bold; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Password Reset Request</h1>
          <p>We received a request to reset your password</p>
        </div>
        <div class="content">
          <h2>Hi ${user.name},</h2>
          <p>You requested to reset your password. Click the button below to create a new password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <ul>
              <li>This link will expire in 10 minutes</li>
              <li>If you didn't request this, please ignore this email</li>
              <li>Your current password will remain unchanged until you create a new one</li>
            </ul>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${resetUrl}</p>
        </div>
        <div class="footer">
          <p>If you have any concerns about your account security, please contact our support team immediately.</p>
          <p>&copy; ${new Date().getFullYear()} E-Commerce Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Password Reset Request
    
    Hi ${user.name},
    
    You requested to reset your password. Visit this link to create a new password:
    ${resetUrl}
    
    This link will expire in 10 minutes.
    
    If you didn't request this, please ignore this email.
    Your current password will remain unchanged.
  `;
  
  await sendEmail({
    to: user.email,
    subject: '🔒 Reset Your Password',
    text,
    html,
  });
};

/**
 * Send password change confirmation email
 * param {Object} user - User object
 */
export const sendPasswordChangeConfirmation = async (user) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Changed Successfully</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4caf50; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .footer { text-align: center; margin-top: 30px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Password Changed</h1>
          <p>Your password has been successfully updated</p>
        </div>
        <div class="content">
          <h2>Hi ${user.name},</h2>
          <p>This is to confirm that your password has been successfully changed on ${new Date().toLocaleString()}.</p>
          
          <p><strong>If you made this change:</strong> No further action is required.</p>
          
          <p><strong>If you didn't make this change:</strong> Please contact our support team immediately as your account may have been compromised.</p>
        </div>
        <div class="footer">
          <p>For security reasons, please keep your login credentials confidential.</p>
          <p>&copy; ${new Date().getFullYear()} E-Commerce Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Password Changed Successfully
    
    Hi ${user.name},
    
    This is to confirm that your password has been successfully changed on ${new Date().toLocaleString()}.
    
    If you made this change: No further action is required.
    If you didn't make this change: Please contact our support team immediately.
  `;
  
  await sendEmail({
    to: user.email,
    subject: '✅ Password Changed Successfully',
    text,
    html,
  });
};

/**
 * Send verification code email (for 2FA or additional security)
 * param {Object} user - User object
 * param {string} code - Verification code
 */
export const sendVerificationCode = async (user, code) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Verification Code</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; text-align: center; }
        .code { background: #667eea; color: white; padding: 20px; font-size: 32px; letter-spacing: 8px; border-radius: 10px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Verification Code</h1>
          <p>Your security code is ready</p>
        </div>
        <div class="content">
          <h2>Hi ${user.name},</h2>
          <p>Here's your verification code:</p>
          
          <div class="code">${code}</div>
          
          <p>Enter this code to complete your verification.</p>
          <p><strong>This code will expire in 10 minutes.</strong></p>
        </div>
        <div class="footer">
          <p>If you didn't request this code, please ignore this email.</p>
          <p>&copy; ${new Date().getFullYear()} E-Commerce Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Your Verification Code
    
    Hi ${user.name},
    
    Your verification code is: ${code}
    
    Enter this code to complete your verification.
    This code will expire in 10 minutes.
    
    If you didn't request this code, please ignore this email.
  `;
  
  await sendEmail({
    to: user.email,
    subject: '🔐 Your Verification Code',
    text,
    html,
  });
};