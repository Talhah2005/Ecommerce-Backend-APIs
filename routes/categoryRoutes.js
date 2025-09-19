// routes/categoryRoutes.js
import express from 'express';
import CategoryController from '../controllers/categoryController.js';
import { protect, authorize } from '../middleware/auth.js';
import { 
  validateObjectId, 
  validateCategory 
} from '../middleware/productValidation.js';
import { 
  uploadCategoryImage, 
  handleUploadError 
} from '../middleware/upload.js';
import { sanitizeInput } from '../middleware/security.js';

const router = express.Router();

// desc    Get all categories
// route   GET /api/categories
// access  Public
router.get('/', 
  sanitizeInput,
  CategoryController.getAllCategories
);

// desc    Get single category
// route   GET /api/categories/:id
// access  Public
router.get('/:id', 
  validateObjectId('id'),
  CategoryController.getSingleCategory
);

// desc    Create category
// route   POST /api/categories
// access  Private/Admin
router.post('/', 
  protect,
  authorize('admin'),
  sanitizeInput,
  uploadCategoryImage.single('icon'),
  validateCategory,
  handleUploadError,
  CategoryController.createCategory
);

// desc    Update category
// route   PUT /api/categories/:id
// access  Private/Admin
router.put('/:id', 
  protect,
  authorize('admin'),
  validateObjectId('id'),
  sanitizeInput,
  uploadCategoryImage.single('icon'),
  validateCategory,
  handleUploadError,
  CategoryController.updateCategory
);

// desc    Delete category
// route   DELETE /api/categories/:id
// access  Private/Admin
router.delete('/:id', 
  protect,
  authorize('admin'),
  validateObjectId('id'),
  CategoryController.deleteCategory
);

export default router;