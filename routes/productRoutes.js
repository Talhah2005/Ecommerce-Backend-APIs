// routes/productRoutes.js
import express from 'express';
import ProductController from '../controllers/productController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import { 
  validateObjectId, 
  validateProduct,
  validateProductQuery,
  validateRating 
} from '../middleware/productValidation.js';
import { 
  uploadProductImage, 
  uploadProductGallery,
  uploadProductMedia,
  processProductImage,
  processGalleryImages,
  processMediaFiles,
  handleUploadError 
} from '../middleware/upload.js';
import { sanitizeInput } from '../middleware/security.js';

const router = express.Router();

// desc    Get all products with filtering, sorting, pagination
// route   GET /api/products
// access  Public
router.get('/', 
  optionalAuth,
  sanitizeInput,
  validateProductQuery,
  ProductController.getAllProducts
);

// desc    Get single product
// route   GET /api/products/:id
// access  Public
router.get('/:id', 
  optionalAuth,
  validateObjectId('id'),
  ProductController.getSingleProduct
);

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
router.post('/', 
  protect,
  authorize('admin'),
  sanitizeInput,
  uploadProductImage.single('image'),
  processProductImage,
  validateProduct,
  handleUploadError,
  ProductController.createProduct
);

// desc    Update product
// route   PUT /api/products/:id
// access  Private/Admin
router.put('/:id', 
  protect,
  authorize('admin'),
  validateObjectId('id'),
  sanitizeInput,
  uploadProductImage.single('image'),
  processProductImage,
  validateProduct,
  handleUploadError,
  ProductController.updateProduct
);

// desc    Upload product gallery images
// route   PUT /api/products/:id/gallery
// access  Private/Admin
router.put('/:id/gallery', 
  protect,
  authorize('admin'),
  validateObjectId('id'),
  uploadProductGallery.array('images', 10),
  processGalleryImages,
  handleUploadError,
  ProductController.uploadGalleryImages
);

// desc    Upload product media (images/videos)
// route   PUT /api/products/:id/media
// access  Private/Admin
router.put('/:id/media', 
  protect,
  authorize('admin'),
  validateObjectId('id'),
  uploadProductMedia.array('media', 15),
  processMediaFiles,
  handleUploadError,
  ProductController.uploadProductMedia
);

// desc    Add product to wishlist
// route   PUT /api/products/:id/wishlist
// access  Private
router.put('/:id/wishlist', 
  protect,
  validateObjectId('id'),
  ProductController.addToWishlist
);

// desc    Remove product from wishlist
// route   DELETE /api/products/:id/wishlist
// access  Private
router.delete('/:id/wishlist', 
  protect,
  validateObjectId('id'),
  ProductController.removeFromWishlist
);

// desc    Update product rating
// route   PUT /api/products/:id/rating
// access  Private
router.put('/:id/rating', 
  protect,
  validateObjectId('id'),
  validateRating,
  ProductController.updateProductRating
);

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
router.delete('/:id', 
  protect,
  authorize('admin'),
  validateObjectId('id'),
  ProductController.deleteProduct
);

// Statistics and Analytics Routes
// desc    Get product count
// route   GET /api/products/stats/count
// access  Public
router.get('/stats/count', 
  optionalAuth,
  ProductController.getProductCount
);

// desc    Get product statistics overview
// route   GET /api/products/stats/overview
// access  Private/Admin
router.get('/stats/overview', 
  protect,
  authorize('admin'),
  ProductController.getProductStats
);

// desc    Get featured products
// route   GET /api/products/featured/:count
// access  Public
router.get('/featured/:count', 
  optionalAuth,
  ProductController.getFeaturedProducts
);

// desc    Get products by category
// route   GET /api/products/category/:categoryId
// access  Public
router.get('/category/:categoryId', 
  optionalAuth,
  validateObjectId('categoryId'),
  validateProductQuery,
  ProductController.getProductsByCategory
);

// desc    Get products by availability status
// route   GET /api/products/availability/:status
// access  Public
router.get('/availability/:status', 
  optionalAuth,
  validateProductQuery,
  ProductController.getProductsByAvailability
);

// Bulk Operations Routes
// desc    Bulk update product availability
// route   PUT /api/products/bulk/availability
// access  Private/Admin
router.put('/bulk/availability', 
  protect,
  authorize('admin'),
  sanitizeInput,
  ProductController.bulkUpdateAvailability
);

export default router;