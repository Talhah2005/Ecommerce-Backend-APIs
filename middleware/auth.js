//middleware/auth.js
import { getTokenFromHeader, verifyToken } from '../utils/jwt.js';
import User from '../models/user.js';

/**
 * Protect routes - require authentication
 */
export const protect = async (req, res, next) => {
  try {
    // Get token from header
    const token = getTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from token
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalid. User not found.',
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated.',
      });
    }
    
    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
    });
  }
};

/**
 * Require email verification
 */
export const requireVerification = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address to access this resource.',
    });
  }
  next();
};

/**
 * Authorize specific roles
 * @param {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }
    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);
    
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    console.log('Optional auth failed:', error.message);
  }
  
  next();
};

/**
 * Check if user is the owner of the resource
 * @param {string} userIdParam - Parameter name containing user ID
 */
export const checkOwnership = (userIdParam = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = req.params[userIdParam];
    
    if (req.user.role !== 'admin' && req.user.id !== resourceUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.',
      });
    }
    
    next();
  };
};