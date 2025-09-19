// middleware/subCategoryValidation.js
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Category from '../models/category.js';
import SubCategory from '../models/subcategory.js';

// Validation rules for creating subcategory
export const validateCreateSubCategory = [
  // Name validation
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Subcategory name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Subcategory name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s&-]+$/)
    .withMessage('Subcategory name can only contain letters, numbers, spaces, & and -')
    .custom(async (value, { req }) => {
      // Check for duplicate name within the same category
      if (req.body.category && mongoose.isValidObjectId(req.body.category)) {
        const existingSubCategory = await SubCategory.findOne({
          name: { $regex: new RegExp(`^${value.trim()}$`, 'i') },
          category: req.body.category
        });
        
        if (existingSubCategory) {
          throw new Error('Subcategory name already exists in this category');
        }
      }
      return true;
    }),

  // Description validation
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  // Category validation
  body('category')
    .notEmpty()
    .withMessage('Parent category is required')
    .custom((value) => {
      if (!mongoose.isValidObjectId(value)) {
        throw new Error('Invalid category ID format');
      }
      return true;
    })
    .custom(async (value) => {
      const category = await Category.findById(value);
      if (!category) {
        throw new Error('Parent category not found');
      }
      if (!category.isActive) {
        throw new Error('Cannot create subcategory under inactive category');
      }
      return true;
    }),

  // isActive validation
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),

  // sortOrder validation
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer')
];

// Validation rules for updating subcategory
export const validateUpdateSubCategory = [
  // Name validation (optional for update)
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Subcategory name cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('Subcategory name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s&-]+$/)
    .withMessage('Subcategory name can only contain letters, numbers, spaces, & and -')
    .custom(async (value, { req }) => {
      // Check for duplicate name within the same category (excluding current subcategory)
      const subCategoryId = req.params.id;
      const categoryId = req.body.category;
      
      if (value && categoryId && mongoose.isValidObjectId(categoryId)) {
        const existingSubCategory = await SubCategory.findOne({
          name: { $regex: new RegExp(`^${value.trim()}$`, 'i') },
          category: categoryId,
          _id: { $ne: subCategoryId }
        });
        
        if (existingSubCategory) {
          throw new Error('Subcategory name already exists in this category');
        }
      }
      return true;
    }),

  // Description validation
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  // Category validation (optional for update)
  body('category')
    .optional()
    .custom((value) => {
      if (value && !mongoose.isValidObjectId(value)) {
        throw new Error('Invalid category ID format');
      }
      return true;
    })
    .custom(async (value) => {
      if (value) {
        const category = await Category.findById(value);
        if (!category) {
          throw new Error('Parent category not found');
        }
        if (!category.isActive) {
          throw new Error('Cannot assign subcategory to inactive category');
        }
      }
      return true;
    }),

  // isActive validation
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),

  // sortOrder validation
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer')
];

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: formattedErrors
    });
  }
  
  next();
};

// Middleware to check if subcategory exists (for update/delete operations)
export const checkSubCategoryExists = async (req, res, next) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id);
    
    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }
    
    req.subCategory = subCategory;
    next();
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid subcategory ID format'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error while checking subcategory'
    });
  }
};

// Middleware to validate ObjectId parameters
export const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }
    
    next();
  };
  
};