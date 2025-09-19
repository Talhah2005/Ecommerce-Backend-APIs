// middleware/validation.js
import { body, validationResult } from 'express-validator';
import User from '../models/user.js';

// Utility function to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errorMessages,
    });
  }
  next();
};

// Password validation helper
const passwordValidation = () => {
  return body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character');
};

// Registration validation
export const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
    
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .custom(async (email) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('Email already in use');
      }
      return true;
    }),
    
  body('phone')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
    .custom(async (phone) => {
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        throw new Error('Phone number already in use');
      }
      return true;
    }),
    
  passwordValidation(),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
    
  body('acceptedTerms')
    .equals('true')
    .withMessage('You must accept the terms and conditions'),
    
  body('acceptedPrivacy')
    .equals('true')
    .withMessage('You must accept the privacy policy'),
    
  handleValidationErrors,
];

// Login validation
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
    
  handleValidationErrors,
];

// Forgot password validation
export const validateForgotPassword = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  handleValidationErrors,
];

// Reset password validation
export const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
    
  passwordValidation(),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
    
  handleValidationErrors,
];

// Verify email validation
export const validateVerifyEmail = [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required'),
    
  handleValidationErrors,
];

// Resend verification validation
export const validateResendVerification = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  handleValidationErrors,
];

// Change password validation
export const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
    
  passwordValidation(),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('New passwords do not match');
      }
      return true;
    }),
    
  handleValidationErrors,
];

// Update profile validation
export const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
    
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .custom(async (email, { req }) => {
      if (email) {
        const existingUser = await User.findOne({ 
          email, 
          _id: { $ne: req.user.id } 
        });
        if (existingUser) {
          throw new Error('Email already in use');
        }
      }
      return true;
    }),
    
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
    .custom(async (phone, { req }) => {
      if (phone) {
        const existingUser = await User.findOne({ 
          phone, 
          _id: { $ne: req.user.id } 
        });
        if (existingUser) {
          throw new Error('Phone number already in use');
        }
      }
      return true;
    }),
    
  handleValidationErrors,
];

// Verification code validation (6 digits)
export const validateVerificationCode = [
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be exactly 6 digits')
    .isNumeric()
    .withMessage('Verification code must contain only numbers'),
    
  handleValidationErrors,
];