// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import dotenv from 'dotenv';
import passport from 'passport';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/database.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
// import orderRoutes from './routes/orderRoutes.js';
import subCategoryRoutes from './routes/subCategoryRoutes.js';

// Import models
import User from './models/user.js';

// Import middleware
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { handleUploadError } from './middleware/upload.js';
import './config/passport.js';

// Load environment variables
dotenv.config();

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy in production for rate limiting
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow images from different origins
}));

// Rate limiting configurations
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs for auth routes
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // higher limit for API operations
  message: {
    success: false,
    message: 'Too many API requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting
app.use(generalLimiter);

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL?.split(',') || ['https://yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Data sanitization against NoSQL query injection
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.query) mongoSanitize.sanitize(req.query);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});

// Data sanitization against XSS
// app.use(xss());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Passport middleware
app.use(passport.initialize());

// API Routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/categories', apiLimiter, categoryRoutes);
app.use('/api/products', apiLimiter, productRoutes);
// app.use('/api/orders', apiLimiter, orderRoutes);
app.use('/api/subcategories', subCategoryRoutes);

// API versioning support
// app.use('/api/v1/auth', authLimiter, authRoutes);
// app.use('/api/v1/categories', apiLimiter, categoryRoutes);
// app.use('/api/v1/products', apiLimiter, productRoutes);
// app.use('/api/v1/orders', apiLimiter, orderRoutes);


// API information endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'E-commerce API',
    version: '1.0.0',
    endpoints: {
      auth: {
        base: '/api/auth',
        routes: [
          'POST /api/auth/register',
          'POST /api/auth/login', 
          'POST /api/auth/logout',
          'POST /api/auth/forgot-password',
          'POST /api/auth/reset-password',
          'POST /api/auth/verify-email',
          'GET /api/auth/profile',
          'PUT /api/auth/profile'
        ]
      },
      categories: {
        base: '/api/categories',
        routes: [
          'GET /api/categories',
          'GET /api/categories/:id',
          'POST /api/categories (Admin)',
          'PUT /api/categories/:id (Admin)',
          'DELETE /api/categories/:id (Admin)'
        ]
      },
      products: {
        base: '/api/products',
        routes: [
          'GET /api/products',
          'GET /api/products/:id',
          'POST /api/products (Admin)',
          'PUT /api/products/:id (Admin)',
          'DELETE /api/products/:id (Admin)',
          'PUT /api/products/:id/gallery (Admin)',
          'GET /api/products/featured/:count',
          'GET /api/products/stats/count',
          'GET /api/products/category/:categoryId'
        ]
      }
    },
    features: [
      'JWT Authentication',
      'Role-based Access Control',
      'File Upload Support', 
      'Advanced Filtering & Search',
      'Pagination',
      'Rate Limiting',
      'Input Validation & Sanitization',
      'Stock Management',
      'Order Processing'
    ]
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to E-commerce API',
    documentation: '/api',
    // health: '/health'
  });
});

// Error handling middleware (order matters - these should be last)
app.use(handleUploadError); // Handle multer upload errors
app.use(notFound); // Handle 404 errors - this will catch all undefined routes
app.use(errorHandler); // Handle all other errors

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Database connected successfully');

    // Create default admin user if needed
    const createDefaultAdmin = async () => {
      try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists && process.env.CREATE_DEFAULT_ADMIN === 'true') {
          const adminUser = await User.create({
            name: process.env.ADMIN_NAME ,
            email: process.env.ADMIN_EMAIL,
            phone: process.env.ADMIN_PHONE ,
            password: process.env.ADMIN_PASSWORD,
            role: 'admin',
            isVerified: true,
            isActive: true
          });
          
          console.log('Default admin user created:', adminUser.name);
        }
      } catch (error) {
        console.error('Error creating default admin:', error.message);
      }
    };

    // Create admin user
    await createDefaultAdmin();

    // Create upload directories if they don't exist
    const fs = await import('fs');
    const uploadDirs = [
      'public/uploads/products',
      'public/uploads/categories'
    ];
    
    uploadDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created upload directory: ${dir}`);
      }
    });

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}` );
        // {
        // environment: process.env.NODE_ENV || 'development',
        // port: PORT,
        // endpoints: {
          // api: `http://localhost:${PORT}/api`,
          // products: `http://localhost:${PORT}/api/products`,
          // categories: `http://localhost:${PORT}/api/categories`,
          // orders: `http://localhost:${PORT}/api/orders`,
          // auth: `http://localhost:${PORT}/api/auth`
        // }
      // }
    });

    // Graceful shutdown handlers
    const gracefulShutdown = (signal) => {
      console.log(`${signal} received. Shutting down`);
      
      server.close(async () => {
        console.log('HTTP server closed');
        
        // Close database connection
        try {
          const { disconnectDB } = await import('./config/database.js');
          await disconnectDB();
          console.log('Database connection closed');
        } catch (error) {
          console.error('Error closing database connection:', error);
        }
        
        process.exit(0);
      });

      // Force close server after 30 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    // Handle different termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error?.stack || error?.message || error);
    process.exit(1);
  }
};

// Export app for testing
export default app;

// Start server if this file is run directly
startServer();