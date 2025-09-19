import passport from 'passport';
import User from '../models/user.js';
import { createAuthResponse } from '../utils/jwt.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

/**
 * desc    Google OAuth login
 * route   GET /api/auth/google
 * access  Public
 */
export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

/**
 * desc    Google OAuth callback
 * route   GET /api/auth/google/callback
 * access  Public
 */
export const googleCallback = asyncHandler(async (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) {
      console.error('Google OAuth error:', err);
      return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_error&message=Authentication failed`);
    }
    
    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed&message=Authentication failed`);
    }
    
    // Generate tokens
    const authResponse = createAuthResponse(user);
    
    // Encode the response for URL
    const encodedData = encodeURIComponent(JSON.stringify({
      success: true,
      user: authResponse.data.user,
      tokens: authResponse.data.tokens,
    }));
    
    // Redirect to frontend with tokens
    res.redirect(`${process.env.CLIENT_URL}/auth-success?data=${encodedData}`);
  })(req, res, next);
});

/**
 * desc    Facebook OAuth login
 * route   GET /api/auth/facebook
 * access  Public
 */
export const facebookAuth = passport.authenticate('facebook', {
  scope: ['email'],
});

/**
 * desc    Facebook OAuth callback
 * route   GET /api/auth/facebook/callback
 * access  Public
 */
export const facebookCallback = asyncHandler(async (req, res, next) => {
  passport.authenticate('facebook', { session: false }, (err, user, info) => {
    if (err) {
      console.error('Facebook OAuth error:', err);
      return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_error&message=Authentication failed`);
    }
    
    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed&message=Authentication failed`);
    }
    
    // Generate tokens
    const authResponse = createAuthResponse(user);
    
    // Encode the response for URL
    const encodedData = encodeURIComponent(JSON.stringify({
      success: true,
      user: authResponse.data.user,
      tokens: authResponse.data.tokens,
    }));
    
    // Redirect to frontend with tokens
    res.redirect(`${process.env.CLIENT_URL}/auth-success?data=${encodedData}`);
  })(req, res, next);
});

/**
 * esc    Link Google account to existing user
 * route   POST /api/auth/link-google
 * access  Private
 */
export const linkGoogleAccount = asyncHandler(async (req, res) => {
  // This would initiate the linking process
  // The user is already authenticated via JWT
  const userId = req.user.id;
  
  // Store the user ID in session or temporary storage
  req.session.linkUserId = userId;
  
  res.json({
    success: true,
    message: 'Ready to link Google account',
    redirectUrl: `/api/auth/google?link=true&userId=${userId}`,
  });
});

/**
 * desc    Link Facebook account to existing user
 * route   POST /api/auth/link-facebook
 * access  Private
 */
export const linkFacebookAccount = asyncHandler(async (req, res) => {
  // This would initiate the linking process
  // The user is already authenticated via JWT
  const userId = req.user.id;
  
  // Store the user ID in session or temporary storage
  req.session.linkUserId = userId;
  
  res.json({
    success: true,
    message: 'Ready to link Facebook account',
    redirectUrl: `/api/auth/facebook?link=true&userId=${userId}`,
  });
});

/**
 * desc    Unlink Google account
 * route   DELETE /api/auth/unlink-google
 * access  Private
 */
export const unlinkGoogleAccount = asyncHandler(async (req, res) => {
  const user = req.user;
  
  // Check if user has a password or Facebook account
  if (!user.password && !user.facebookId) {
    return res.status(400).json({
      success: false,
      message: 'Cannot unlink Google account. Please set a password or link another social account first.',
    });
  }
  
  // Remove Google ID
  user.googleId = undefined;
  await user.save();
  
  res.json({
    success: true,
    message: 'Google account unlinked successfully',
  });
});

/**
 * desc    Unlink Facebook account
 * route   DELETE /api/auth/unlink-facebook
 * access  Private
 */
export const unlinkFacebookAccount = asyncHandler(async (req, res) => {
  const user = req.user;
  
  // Check if user has a password or Google account
  if (!user.password && !user.googleId) {
    return res.status(400).json({
      success: false,
      message: 'Cannot unlink Facebook account. Please set a password or link another social account first.',
    });
  }
  
  // Remove Facebook ID
  user.facebookId = undefined;
  await user.save();
  
  res.json({
    success: true,
    message: 'Facebook account unlinked successfully',
  });
});