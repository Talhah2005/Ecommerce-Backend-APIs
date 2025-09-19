// middleware/productValidation.js
import { body, param, query, validationResult } from 'express-validator';
import Category from '../models/category.js';
import SubCategory from '../models/subcategory.js';
import Product from '../models/product.js';
import mongoose from 'mongoose';

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

// MongoDB ObjectId validation
export const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .custom((value) => {
      if (!mongoose.isValidObjectId(value)) {
        throw new Error(`Invalid ${paramName} format`);
      }
      return true;
    }),
  handleValidationErrors,
];

// Order validation (temporary - should be moved to separate file)
export const validateOrder = [
  body('orderItems')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
    
  body('orderItems.*.product')
    .custom(async (value) => {
      if (!mongoose.isValidObjectId(value)) {
        throw new Error('Invalid product ID format');
      }
      const product = await Product.findById(value);
      if (!product) {
        throw new Error('Product does not exist');
      }
      if (!product.isActive) {
        throw new Error('Product is not active');
      }
      return true;
    }),
    
  body('orderItems.*.quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100'),
    
  body('shippingAddress.street')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Street address must be between 5 and 100 characters'),
    
  body('shippingAddress.city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
    
  body('shippingAddress.postalCode')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Postal code must be between 3 and 20 characters'),
    
  body('shippingAddress.country')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters'),
    
  body('phone')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
    
  body('paymentMethod')
    .optional()
    .isIn(['Credit Card', 'Debit Card', 'PayPal', 'Stripe', 'Cash on Delivery', 'Bank Transfer'])
    .withMessage('Invalid payment method'),
    
  handleValidationErrors,
];

// Order status update validation
export const validateOrderStatus = [
  body('status')
    .isIn(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'])
    .withMessage('Invalid order status'),
    
  handleValidationErrors,
];

// Payment status update validation
export const validatePaymentStatus = [
  body('paymentStatus')
    .isIn(['Pending', 'Processing', 'Paid', 'Failed', 'Refunded', 'Partially Refunded'])
    .withMessage('Invalid payment status'),
    
  handleValidationErrors,
];

// Category validation
export const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s&-]+$/)
    .withMessage('Category name can only contain letters, numbers, spaces, & and -'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
    
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color code'),
    
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Icon name cannot exceed 100 characters'),
    
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
    
  handleValidationErrors,
];

// Subcategory validation
export const validateSubCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Subcategory name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s&-]+$/)
    .withMessage('Subcategory name can only contain letters, numbers, spaces, & and -'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
    
  body('category')
    .custom(async (value) => {
      if (!mongoose.isValidObjectId(value)) {
        throw new Error('Invalid category ID format');
      }
      const category = await Category.findById(value);
      if (!category) {
        throw new Error('Parent category does not exist');
      }
      if (!category.isActive) {
        throw new Error('Parent category is not active');
      }
      return true;
    }),
    
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
    
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a positive integer'),
    
  handleValidationErrors,
];

// Enhanced Product validation
export const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
    
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
    
  body('richDescription')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Rich description cannot exceed 5000 characters'),
    
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Brand name cannot exceed 50 characters'),
    
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
    
  body('discountPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount price must be a positive number')
    .custom((value, { req }) => {
      if (value && req.body.price && parseFloat(value) >= parseFloat(req.body.price)) {
        throw new Error('Discount price must be less than regular price');
      }
      return true;
    }),
    
  body('category')
    .custom(async (value) => {
      if (!mongoose.isValidObjectId(value)) {
        throw new Error('Invalid category ID format');
      }
      const category = await Category.findById(value);
      if (!category) {
        throw new Error('Category does not exist');
      }
      if (!category.isActive) {
        throw new Error('Category is not active');
      }
      return true;
    }),
    
  // New: Subcategory validation
  body('subCategory')
    .optional()
    .custom(async (value, { req }) => {
      if (value) {
        if (!mongoose.isValidObjectId(value)) {
          throw new Error('Invalid subcategory ID format');
        }
        const subCategory = await SubCategory.findById(value);
        if (!subCategory) {
          throw new Error('Subcategory does not exist');
        }
        if (!subCategory.isActive) {
          throw new Error('Subcategory is not active');
        }
        // Check if subcategory belongs to the selected category
        if (req.body.category && subCategory.category.toString() !== req.body.category) {
          throw new Error('Subcategory does not belong to the selected category');
        }
      }
      return true;
    }),
    
  body('countInStock')
    .isInt({ min: 0, max: 99999 })
    .withMessage('Stock count must be between 0 and 99999'),
    
  // New: Enhanced stock management
  body('lowStockThreshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Low stock threshold must be a positive integer'),
    
  body('availabilityStatus')
    .optional()
    .isIn(['in_stock', 'out_of_stock', 'low_stock', 'preorder', 'discontinued', 'coming_soon'])
    .withMessage('Invalid availability status'),
    
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
    
  body('numReviews')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Number of reviews must be a positive integer'),
    
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean value'),
    
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
    
  body('sku')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('SKU cannot exceed 50 characters')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('SKU can only contain uppercase letters, numbers, and hyphens')
    .custom(async (value, { req }) => {
      if (value) {
        const existingProduct = await Product.findOne({ 
          sku: value,
          _id: { $ne: req.params.id } // Exclude current product when updating
        });
        if (existingProduct) {
          throw new Error('SKU already exists');
        }
      }
      return true;
    }),
    
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weight must be a positive number'),
    
  body('dimensions')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (parsed.length && parsed.length < 0) throw new Error('Length must be positive');
          if (parsed.width && parsed.width < 0) throw new Error('Width must be positive');
          if (parsed.height && parsed.height < 0) throw new Error('Height must be positive');
        } catch (e) {
          throw new Error('Dimensions must be valid JSON with positive values');
        }
      }
      return true;
    }),
    
  body('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) {
            throw new Error('Tags must be an array');
          }
          if (parsed.length > 10) {
            throw new Error('Maximum 10 tags allowed');
          }
          if (parsed.some(tag => typeof tag !== 'string' || tag.length > 30)) {
            throw new Error('Each tag must be a string with max 30 characters');
          }
        } catch (e) {
          throw new Error('Tags must be valid JSON array');
        }
      }
      return true;
    }),
    
  body('manufacturer')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Manufacturer name cannot exceed 100 characters'),
    
  body('warrantyPeriod')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Warranty period must be a positive integer'),
    
  // New: Product type validation
  body('productType')
    .optional()
    .isIn(['simple', 'variable', 'grouped', 'external'])
    .withMessage('Invalid product type'),
    
  // New: Complex field validations
  body('variants')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const variants = JSON.parse(value);
          if (variants && Array.isArray(variants)) {
            for (const variant of variants) {
              if (!variant.name || !variant.value) {
                throw new Error('Each variant must have name and value');
              }
              if (variant.additionalPrice !== undefined && (typeof variant.additionalPrice !== 'number' || variant.additionalPrice < 0)) {
                throw new Error('Variant additional price must be a positive number');
              }
              if (variant.stock !== undefined && (typeof variant.stock !== 'number' || variant.stock < 0)) {
                throw new Error('Variant stock must be a positive number');
              }
            }
          }
        } catch (e) {
          throw new Error('Invalid variants format');
        }
      }
      return true;
    }),
    
  body('colorMaterialOptions')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const options = JSON.parse(value);
          if (options && Array.isArray(options)) {
            for (const option of options) {
              if (!option.type || !option.name || !option.value) {
                throw new Error('Each color/material option must have type, name, and value');
              }
              if (!['color', 'material', 'finish'].includes(option.type)) {
                throw new Error('Option type must be color, material, or finish');
              }
              if (option.additionalPrice !== undefined && (typeof option.additionalPrice !== 'number' || option.additionalPrice < 0)) {
                throw new Error('Option additional price must be a positive number');
              }
            }
          }
        } catch (e) {
          throw new Error('Invalid color/material options format');
        }
      }
      return true;
    }),
    
  body('additionalServices')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const services = JSON.parse(value);
          if (services && Array.isArray(services)) {
            for (const service of services) {
              if (!service.name || service.price === undefined) {
                throw new Error('Each service must have name and price');
              }
              if (typeof service.price !== 'number' || service.price < 0) {
                throw new Error('Service price must be a positive number');
              }
            }
          }
        } catch (e) {
          throw new Error('Invalid additional services format');
        }
      }
      return true;
    }),
    
  body('versions')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const versions = JSON.parse(value);
          if (versions && Array.isArray(versions)) {
            for (const version of versions) {
              if (!version.version) {
                throw new Error('Each version must have a version number/name');
              }
              if (version.additionalPrice !== undefined && (typeof version.additionalPrice !== 'number' || version.additionalPrice < 0)) {
                throw new Error('Version additional price must be a positive number');
              }
            }
          }
        } catch (e) {
          throw new Error('Invalid versions format');
        }
      }
      return true;
    }),
    
  body('taxInfo')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const taxInfo = JSON.parse(value);
          if (taxInfo) {
            if (taxInfo.taxRate !== undefined && (typeof taxInfo.taxRate !== 'number' || taxInfo.taxRate < 0 || taxInfo.taxRate > 100)) {
              throw new Error('Tax rate must be between 0 and 100');
            }
            if (taxInfo.taxClass !== undefined && !['standard', 'reduced', 'exempt', 'zero'].includes(taxInfo.taxClass)) {
              throw new Error('Invalid tax class');
            }
          }
        } catch (e) {
          throw new Error('Invalid tax info format');
        }
      }
      return true;
    }),
    
  body('media')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const media = JSON.parse(value);
          if (media && Array.isArray(media)) {
            for (const item of media) {
              if (!item.type || !item.url) {
                throw new Error('Each media item must have type and url');
              }
              if (!['image', 'video', '360view', 'document'].includes(item.type)) {
                throw new Error('Media type must be image, video, 360view, or document');
              }
            }
          }
        } catch (e) {
          throw new Error('Invalid media format');
        }
      }
      return true;
    }),
    
  body('seo')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const seo = JSON.parse(value);
          if (seo) {
            if (seo.metaTitle && seo.metaTitle.length > 60) {
              throw new Error('Meta title cannot exceed 60 characters');
            }
            if (seo.metaDescription && seo.metaDescription.length > 160) {
              throw new Error('Meta description cannot exceed 160 characters');
            }
            if (seo.keywords && (!Array.isArray(seo.keywords) || seo.keywords.length > 20)) {
              throw new Error('Keywords must be an array with max 20 items');
            }
          }
        } catch (e) {
          throw new Error('Invalid SEO format');
        }
      }
      return true;
    }),
    
  body('shipping')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const shipping = JSON.parse(value);
          if (shipping) {
            if (shipping.weight !== undefined && (typeof shipping.weight !== 'number' || shipping.weight < 0)) {
              throw new Error('Shipping weight must be a positive number');
            }
            if (shipping.dimensions) {
              const { length, width, height } = shipping.dimensions;
              if (length !== undefined && (typeof length !== 'number' || length < 0)) {
                throw new Error('Shipping length must be a positive number');
              }
              if (width !== undefined && (typeof width !== 'number' || width < 0)) {
                throw new Error('Shipping width must be a positive number');
              }
              if (height !== undefined && (typeof height !== 'number' || height < 0)) {
                throw new Error('Shipping height must be a positive number');
              }
            }
          }
        } catch (e) {
          throw new Error('Invalid shipping format');
        }
      }
      return true;
    }),
    
  handleValidationErrors,
];

// Rating validation
export const validateRating = [
  body('rating')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
    
  handleValidationErrors,
];

// Enhanced query parameter validation for products
export const validateProductQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('sort')
    .optional()
    .isIn(['price_asc', 'price_desc', 'rating', 'newest', 'oldest', 'name', 'popularity'])
    .withMessage('Invalid sort option'),
    
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be positive'),
    
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be positive')
    .custom((value, { req }) => {
      if (value && req.query.minPrice && parseFloat(value) <= parseFloat(req.query.minPrice)) {
        throw new Error('Maximum price must be greater than minimum price');
      }
      return true;
    }),
    
  query('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
    
  query('category')
    .optional()
    .custom((value) => {
      const categories = value.split(',');
      for (const cat of categories) {
        if (!mongoose.isValidObjectId(cat.trim())) {
          throw new Error('Invalid category ID format');
        }
      }
      return true;
    }),
    
  // New: Subcategory query validation
  query('subCategory')
    .optional()
    .custom((value) => {
      const subCategories = value.split(',');
      for (const subCat of subCategories) {
        if (!mongoose.isValidObjectId(subCat.trim())) {
          throw new Error('Invalid subcategory ID format');
        }
      }
      return true;
    }),
    
  // New: Availability status validation
  query('availability')
    .optional()
    .custom((value) => {
      const statuses = value.split(',');
      const validStatuses = ['in_stock', 'out_of_stock', 'low_stock', 'preorder', 'discontinued', 'coming_soon'];
      for (const status of statuses) {
        if (!validStatuses.includes(status.trim())) {
          throw new Error('Invalid availability status');
        }
      }
      return true;
    }),
    
  // New: Product type validation
  query('productType')
    .optional()
    .isIn(['simple', 'variable', 'grouped', 'external'])
    .withMessage('Invalid product type'),
    
  query('brand')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Brand name cannot exceed 50 characters'),
    
  query('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be boolean'),
    
  query('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be boolean'),
    
  query('tags')
    .optional()
    .custom((value) => {
      const tags = value.split(',');
      for (const tag of tags) {
        if (tag.trim().length > 30) {
          throw new Error('Each tag must be max 30 characters');
        }
      }
      return true;
    }),
    
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
    
  handleValidationErrors,
];