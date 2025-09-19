// middleware/upload.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

// Create upload directories (using your existing structure)
const createUploadDirs = () => {
  const dirs = [
    'public/uploads/products',
    'public/uploads/categories',
    'public/uploads/subcategories',
    'public/uploads/temp'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// File type validation (keeping your existing structure)
const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp'
};

// Extended file types for media uploads
const ALLOWED_MEDIA_TYPES = {
  // Images
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  // Videos
  'video/mp4': 'mp4',
  'video/mpeg': 'mpeg',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
  'video/x-ms-wmv': 'wmv',
  // Documents
  'application/pdf': 'pdf',
  'text/plain': 'txt'
};

// Storage configuration (keeping your existing pattern)
const createStorage = (destination) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, destination);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = ALLOWED_IMAGE_TYPES[file.mimetype] || ALLOWED_MEDIA_TYPES[file.mimetype];
      const filename = `${file.fieldname}-${uniqueSuffix}.${ext}`;
      cb(null, filename);
    }
  });
};

// File filters
const fileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

const mediaFileFilter = (req, file, cb) => {
  if (ALLOWED_MEDIA_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed. Only images, videos, and documents are permitted.'), false);
  }
};

// Upload configurations (keeping your existing structure and expanding)
export const uploadProductImage = multer({
  storage: createStorage('public/uploads/products'),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  }
});

export const uploadProductGallery = multer({
  storage: createStorage('public/uploads/products'),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10 // Max 10 files
  }
});

// New: Enhanced media upload for videos, documents, etc.
export const uploadProductMedia = multer({
  storage: createStorage('public/uploads/products'),
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for videos, will validate per type
    files: 15 // Max 15 files
  }
});

export const uploadCategoryImage = multer({
  storage: createStorage('public/uploads/categories'),
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1
  }
});

// New: Subcategory uploads
export const uploadSubCategoryImages = multer({
  storage: createStorage('public/uploads/subcategories'),
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 2 // icon and image
  }
});

// Image processing middleware (keeping your existing logic and enhancing)
export const processProductImage = async (req, res, next) => {
  if (!req.file) return next();
  
  try {
    const filename = req.file.filename;
    const inputPath = req.file.path;
    const outputPath = path.join('public/uploads/products', `processed-${filename}`);
    
    // Enhanced processing with WebP conversion for better optimization
    await sharp(inputPath)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 85 }) // Convert to WebP for better compression
      .toFile(outputPath.replace(/\.[^/.]+$/, '.webp')); // Change extension to .webp
    
    // Update file info
    req.file.filename = `processed-${filename}`.replace(/\.[^/.]+$/, '.webp');
    req.file.path = outputPath.replace(/\.[^/.]+$/, '.webp');
    
    // Delete original file
    fs.unlinkSync(inputPath);
    
    next();
  } catch (error) {
    console.error('Image processing error:', error);
    // Keep your existing behavior - continue even if processing fails
    next();
  }
};

// Gallery image processing (enhanced from your existing logic)
export const processGalleryImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();
  
  try {
    const processedFiles = [];
    
    for (const file of req.files) {
      const filename = file.filename;
      const inputPath = file.path;
      const outputPath = path.join('public/uploads/products', `processed-${filename}`);
      
      // Enhanced processing with WebP
      await sharp(inputPath)
        .resize(1200, 1200, { // Slightly larger for gallery
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 85 })
        .toFile(outputPath.replace(/\.[^/.]+$/, '.webp'));
      
      processedFiles.push({
        ...file,
        filename: `processed-${filename}`.replace(/\.[^/.]+$/, '.webp'),
        path: outputPath.replace(/\.[^/.]+$/, '.webp')
      });
      
      // Delete original file
      fs.unlinkSync(inputPath);
    }
    
    req.files = processedFiles;
    next();
  } catch (error) {
    console.error('Gallery processing error:', error);
    next(); // Continue even if processing fails
  }
};

// New: Enhanced media processing for different file types
export const processMediaFiles = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();
  
  try {
    const processedFiles = [];
    
    for (const file of req.files) {
      // Only process images, leave videos and documents as-is
      if (file.mimetype.startsWith('image/')) {
        const filename = file.filename;
        const inputPath = file.path;
        const outputPath = path.join('public/uploads/products', `processed-${filename}`);
        
        // Process images
        await sharp(inputPath)
          .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 85 })
          .toFile(outputPath.replace(/\.[^/.]+$/, '.webp'));
        
        processedFiles.push({
          ...file,
          filename: `processed-${filename}`.replace(/\.[^/.]+$/, '.webp'),
          path: outputPath.replace(/\.[^/.]+$/, '.webp')
        });
        
        // Delete original file
        fs.unlinkSync(inputPath);
      } else {
        // Keep videos and documents as-is
        processedFiles.push(file);
      }
    }
    
    req.files = processedFiles;
    next();
  } catch (error) {
    console.error('Media processing error:', error);
    next(); // Continue even if processing fails
  }
};

// Error handling middleware for multer (keeping your existing logic and expanding)
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB for products and 2MB for categories.'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed for gallery, 15 for media.'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name for file upload.'
      });
    }

    // Handle other multer errors
    return res.status(400).json({
      success: false,
      message: error.message || 'File upload error'
    });
  }
  
  if (error.message.includes('Invalid file type') || 
      error.message.includes('File type not allowed') ||
      error.message.includes('Only image files')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  // Pass other errors to the next error handler
  next(error);
};