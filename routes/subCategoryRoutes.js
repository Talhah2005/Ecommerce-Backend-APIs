// routes/subCategoryRoutes.js
import express from 'express';
import SubCategoryController from '../controllers/SubCategoryController.js';
import { 
  validateCreateSubCategory, 
  validateUpdateSubCategory, 
  handleValidationErrors,
  checkSubCategoryExists,
  validateObjectId
} from '../middleware/subCategoryValidation.js';
import { protect, authorize } from '../middleware/auth.js'; // Assuming you have auth middleware
import { uploadSubCategoryImages, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', SubCategoryController.getAllSubCategories);
router.get('/stats/count', SubCategoryController.getSubCategoryCount);
router.get('/category/:categoryId', 
  validateObjectId('categoryId'), 
  SubCategoryController.getSubCategoriesByCategory
);
router.get('/:id', 
  validateObjectId('id'), 
  SubCategoryController.getSingleSubCategory
);

// Protected routes (Admin only)
router.post('/', 
  protect, 
  authorize('admin'),
  uploadSubCategoryImages.fields([
    { name: 'icon', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]),
  handleUploadError,
  validateCreateSubCategory,
  handleValidationErrors,
  SubCategoryController.createSubCategory
);

router.put('/:id', 
  protect, 
  authorize('admin'),
  validateObjectId('id'),
  checkSubCategoryExists,
  uploadSubCategoryImages.fields([
    { name: 'icon', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]),
  handleUploadError,
  validateUpdateSubCategory,
  handleValidationErrors,
  SubCategoryController.updateSubCategory
);

router.delete('/:id', 
  protect, 
  authorize('admin'),
  validateObjectId('id'),
  checkSubCategoryExists,
  SubCategoryController.deleteSubCategory
);

export default router;