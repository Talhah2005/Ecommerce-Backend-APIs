import crypto from 'crypto';
import User from '../models/user.js';
import { createAuthResponse, generateToken, verifyToken } from '../utils/jwt.js';
import { 
  sendWelcomeEmail, 
  sendPasswordResetEmail, 
  sendPasswordChangeConfirmation,
  sendVerificationCode,
} from '../utils/email.js';
import { asyncHandler, AppError, sendSuccessResponse } from '../middleware/errorMiddleware.js';

/**
 * desc    Register user
 * route   POST /api/auth/register
 * access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, acceptedTerms, acceptedPrivacy, marketingEmails } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ 
    $or: [{ email }, { phone }] 
  });

  if (existingUser) {
    throw new AppError('User with this email or phone already exists', 400);
  }

  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    password,
    acceptedTerms: acceptedTerms === 'true',
    acceptedPrivacy: acceptedPrivacy === 'true',
    marketingEmails: marketingEmails === 'true',
  });

  // Generate email verification token
  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send welcome email with verification link
  try {
    await sendWelcomeEmail(user, verificationToken);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't throw error, user is still created
  }

  // Generate auth response
  const authResponse = createAuthResponse(user);

  res.status(201).json({
    ...authResponse,
    message: 'Registration successful! Please check your email to verify your account.',
  });
});

/**
 * desc    Login user
 * route   POST /api/auth/login
 * access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  // Find user and include password for comparison
  const user = await User.findByCredentials(email, password);

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate auth response
  const authResponse = createAuthResponse(user);

  // Adjust token expiry if "Remember Me" is checked
  if (rememberMe) {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };
    
    // Generate longer-lived token (30 days)
    const longLivedToken = generateToken(payload, '30d');
    authResponse.data.tokens.accessToken = longLivedToken;
    authResponse.data.tokens.expiresIn = '30d';
  }

  res.json({
    ...authResponse,
    message: user.isVerified 
      ? 'Login successful!' 
      : 'Login successful! Please verify your email for full access.',
  });
});

/**
 * desc    Logout user
 * route   POST /api/auth/logout
 * access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  // In JWT implementation, logout is handled client-side
    
  sendSuccessResponse(res, 200, 'Logout successful');
});

/**
 * desc    Get current user
 * route   GET /api/auth/me
 * access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = req.user;

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        marketingEmails: user.marketingEmails,
      },
    },
  });
});

/**
 * desc    Verify email
 * route   POST /api/auth/verify-email
 * access  Public
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new AppError('Verification token is required', 400);
  }

  // Hash token and find user
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError('Invalid or expired verification token', 400);
  }

  // Update user
  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();

  // Generate auth response
  const authResponse = createAuthResponse(user);

  res.json({
    ...authResponse,
    message: 'Email verified successfully!',
  });
});

/**
 * desc    Resend email verification
 * route   POST /api/auth/resend-verification
 * access  Public
 */
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.isVerified) {
    throw new AppError('Email is already verified', 400);
  }

  // Generate new verification token
  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email
  try {
    await sendWelcomeEmail(user, verificationToken);
    
    sendSuccessResponse(
      res, 
      200, 
      'Verification email sent successfully! Please check your inbox.'
    );
  } catch (error) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    throw new AppError('Failed to send verification email', 500);
  }
});

/**
 * desc    Forgot password
 * route   POST /api/auth/forgot-password
 * access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user, resetToken);
    
    sendSuccessResponse(
      res, 
      200, 
      'Password reset email sent! Please check your inbox.'
    );
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    throw new AppError('Failed to send password reset email', 500);
  }
});

/**
 * desc    Reset password
 * route   POST /api/auth/reset-password
 * access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // Hash token and find user
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  // Update password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.loginAttempts = 0; // Reset login attempts
  user.lockUntil = undefined; // Unlock account if locked
  await user.save();

  // Send confirmation email
  try {
    await sendPasswordChangeConfirmation(user);
  } catch (error) {
    console.error('Failed to send password change confirmation:', error);
  }

  // Generate auth response
  const authResponse = createAuthResponse(user);

  res.json({
    ...authResponse,
    message: 'Password reset successful!',
  });
});

/**
 * desc    Change password
 * route   PUT /api/auth/change-password
 * access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, password } = req.body;

  // Get user with password
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isCurrentPasswordCorrect = await user.matchPassword(currentPassword);

  if (!isCurrentPasswordCorrect) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Update password
  user.password = password;
  await user.save();

  // Send confirmation email
  try {
    await sendPasswordChangeConfirmation(user);
  } catch (error) {
    console.error('Failed to send password change confirmation:', error);
  }

  sendSuccessResponse(res, 200, 'Password changed successfully!');
});

/**
 * desc    Update user profile
 * route   PUT /api/auth/profile
 * access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, marketingEmails } = req.body;

  const user = await User.findById(req.user.id);

  // Update fields
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (marketingEmails !== undefined) user.marketingEmails = marketingEmails;

  // If email is being changed, require re-verification
  if (email && email !== user.email) {
    user.email = email;
    user.isVerified = false;
    
    // Generate new verification token
    const verificationToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    try {
      await sendWelcomeEmail(user, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }

    return res.json({
      success: true,
      message: 'Profile updated! Please verify your new email address.',
      data: { user },
    });
  }

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully!',
    data: { user },
  });
});

/**
 * desc    Refresh access token
 * route   POST /api/auth/refresh-token
 * access  Public
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  try {
    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    
    // Get user
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    // Generate new tokens
    const authResponse = createAuthResponse(user);

    res.json({
      ...authResponse,
      message: 'Token refreshed successfully!',
    });
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
});

/**
 * desc    Send verification code
 * route   POST /api/auth/send-verification-code
 * access  Private
 */
export const sendVerificationCodeEmail = asyncHandler(async (req, res) => {
  const user = req.user;
  
  // Generate 6-digit code
  const code = User.generateVerificationCode();
  
  // Store code temporarily (you might want to use Redis for this)
  // For now, we'll use a field in the user model
  user.emailVerificationToken = crypto.createHash('sha256').update(code).digest('hex');
  user.emailVerificationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save({ validateBeforeSave: false });

  try {
    await sendVerificationCode(user, code);
    
    sendSuccessResponse(
      res, 
      200, 
      'Verification code sent to your email!'
    );
  } catch (error) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    throw new AppError('Failed to send verification code', 500);
  }
});

/**
 * desc    Verify code
 * route   POST /api/auth/verify-code
 * access  Private
 */
export const verifyCode = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const user = req.user;

  if (!code) {
    throw new AppError('Verification code is required', 400);
  }

  // Hash the provided code
  const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

  // Check if code matches and is not expired
  if (
    user.emailVerificationToken !== hashedCode ||
    user.emailVerificationExpire < Date.now()
  ) {
    throw new AppError('Invalid or expired verification code', 400);
  }

  // Clear verification fields
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  user.isVerified = true;
  await user.save();

  sendSuccessResponse(res, 200, 'Verification code validated successfully!');
});