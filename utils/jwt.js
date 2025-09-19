import jwt from 'jsonwebtoken';

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @returns {String} JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
    issuer: 'ecommerce-api',
    subject: payload.id.toString(),
  });
};

/**
 * Generate refresh token (longer expiry)
 * param {Object} payload - Token payload
 * returns {String} Refresh token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d', // 7 days for refresh token
    issuer: 'ecommerce-api',
    subject: payload.id.toString(),
  });
};

/**
 * Verify JWT token
 * param {String} token - JWT token
 * returns {Object} Decoded payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'ecommerce-api',
  });
};

/**
 * Decode token without verification (for expired tokens)
 * param {String} token - JWT token
 * returns {Object} Decoded payload
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Get token from request headers
 * param {Object} req - Express request object
 * returns {String|null} Token or null
 */
export const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
};

/**
 * Create authentication response with tokens
 * param {Object} user - User object
 * returns {Object} Authentication response
 */
export const createAuthResponse = (user) => {
  const tokenPayload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };
  
  const accessToken = generateToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);
  
  return {
    success: true,
    message: 'Authentication successful',
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
      },
      tokens: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: process.env.JWT_EXPIRE,
      },
    },
  };
};

/**
 * Extract user info from token
 * param {String} token - JWT token
 * returns {Object} User info from token
 */
export const extractUserFromToken = (token) => {
  try {
    const decoded = verifyToken(token);
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
};