import crypto from 'crypto';
import { promisify } from 'util';

/**
 * Generate a secure random string
 * param {number} length - Length of the string
 * returns {string} Random string
 */
export const generateSecureRandom = (length = 32) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

/**
 * Hash a string using SHA-256
 * param {string} data - Data to hash
 * returns {string} Hashed string
 */
export const hashString = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate a secure OTP (One-Time Password)
 * param {number} length - Length of OTP (default 6)
 * returns {string} OTP
 */
export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    otp += digits[randomIndex];
  }
  
  return otp;
};

/**
 * Validate email format
 * Param {string} email - Email to validate
 * Returns {boolean} Is valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 * param {string} phone - Phone number to validate
 * returns {boolean} Is valid phone number
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate password strength
 * param {string} password - Password to validate
 * returns {Object} Validation result
 */
export const validatePasswordStrength = (password) => {
  const result = {
    isValid: false,
    score: 0,
    issues: [],
    suggestions: [],
  };

  if (!password || password.length < 8) {
    result.issues.push('Password must be at least 8 characters long');
    result.suggestions.push('Use at least 8 characters');
  } else {
    result.score += 1;
  }

  if (!/[a-z]/.test(password)) {
    result.issues.push('Password must contain lowercase letters');
    result.suggestions.push('Include lowercase letters (a-z)');
  } else {
    result.score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    result.issues.push('Password must contain uppercase letters');
    result.suggestions.push('Include uppercase letters (A-Z)');
  } else {
    result.score += 1;
  }

  if (!/\d/.test(password)) {
    result.issues.push('Password must contain numbers');
    result.suggestions.push('Include numbers (0-9)');
  } else {
    result.score += 1;
  }

  if (!/[@$!%*?&]/.test(password)) {
    result.issues.push('Password must contain special characters');
    result.suggestions.push('Include special characters (@$!%*?&)');
  } else {
    result.score += 1;
  }

  // Check for common patterns
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
  ];

  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
  if (hasCommonPattern) {
    result.issues.push('Password contains common patterns');
    result.suggestions.push('Avoid common patterns like "123456" or "password"');
    result.score = Math.max(0, result.score - 1);
  }

  result.isValid = result.score >= 4 && result.issues.length === 0;

  return result;
};

/**
 * Sanitize user input
 *param {string} input - Input to sanitize
 *returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '') // Remove event handlers
    .replace(/on\w+\s*=\s*'[^']*'/gi, '') // Remove event handlers
    .trim();
};

/**
 * Format phone number for display
 * param {string} phone - Phone number to format
 * returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone; // Return original if can't format
};

/**
 * Calculate time until expiration
 * param {Date} expirationDate - Expiration date
 * returns {Object} Time remaining
 */
export const getTimeUntilExpiration = (expirationDate) => {
  const now = new Date();
  const expiry = new Date(expirationDate);
  const diffMs = expiry - now;
  
  if (diffMs <= 0) {
    return { expired: true, timeRemaining: null };
  }
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return {
    expired: false,
    totalMs: diffMs,
    minutes: diffMinutes,
    hours: diffHours,
    days: diffDays,
    timeRemaining: diffDays > 0 ? `${diffDays} days` :
                   diffHours > 0 ? `${diffHours} hours` :
                   `${diffMinutes} minutes`,
  };
};

/**
 * Create a slug from text
 * param {string} text - Text to slugify
 * returns {string} Slug
 */
export const createSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Debounce function
 * param {Function} func - Function to debounce
 * param {number} wait - Wait time in milliseconds
 * returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 * param {Function} func - Function to throttle
 * param {number} limit - Limit in milliseconds
 * returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Deep clone an object
 * param {Object} obj - Object to clone
 * returns {Object} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * Check if object is empty
 * param {Object} obj - Object to check
 * returns {boolean} Is empty
 */
export const isEmpty = (obj) => {
  if (obj == null) return true;
  if (typeof obj === 'string' || Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

/**
 * Convert bytes to human readable format
 * param {number} bytes - Bytes to convert
 * param {number} decimals - Number of decimal places
 * returns {string} Human readable size
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Get client IP from request
 * param {Object} req - Express request object
 * returns {string} Client IP address
 */
export const getClientIP = (req) => {
  return req.ip ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.connection?.socket?.remoteAddress ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         'unknown';
};

/**
 * Get user agent info
 * param {Object} req - Express request object
 * returns {Object} User agent info
 */
export const getUserAgentInfo = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  
  return {
    raw: userAgent,
    isMobile: /Mobile|Android|iP(hone|od|ad)|BlackBerry|IEMobile|Silk/.test(userAgent),
    isTablet: /Tablet|iPad/.test(userAgent),
    isDesktop: !/Mobile|Android|iP(hone|od|ad)|BlackBerry|IEMobile|Silk|Tablet/.test(userAgent),
    browser: getBrowserFromUserAgent(userAgent),
    os: getOSFromUserAgent(userAgent),
  };
};

/**
 * Extract browser from user agent
 * param {string} userAgent - User agent string
 * returns {string} Browser name
 */
const getBrowserFromUserAgent = (userAgent) => {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
};

/**
 * Extract OS from user agent
 * param {string} userAgent - User agent string
 * returns {string} Operating system
 */
const getOSFromUserAgent = (userAgent) => {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
};

/**
 * Sleep/delay function
 * param {number} ms - Milliseconds to sleep
 * returns {Promise} Promise that resolves after delay
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry async function
 * param {Function} fn - Async function to retry
 * param {number} retries - Number of retries
 * param {number} delay - Delay between retries
 * returns {Promise} Promise that resolves with function result
 */
export const retryAsync = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await sleep(delay);
      return retryAsync(fn, retries - 1, delay);
    }
    throw error;
  }
};

/**
 * Generate API key
 * param {number} length - Length of API key
 * returns {string} API key
 */
export const generateAPIKey = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    result += chars[randomIndex];
  }
  
  return result;
};