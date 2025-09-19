// Not found middleware
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Error handler middleware
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;
  let errors = [];

  // Log error for debugging
  console.error('❌ Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : '🥞',
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
    
    errors = [{
      field,
      message,
      value,
    }];
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message,
      value: error.value,
    }));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Rate limit error
  if (err.status === 429) {
    statusCode = 429;
    message = 'Too many requests, please try again later';
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large';
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field';
  }

  // Custom application errors
  if (err.name === 'AppError') {
    statusCode = err.statusCode || 400;
    message = err.message;
    errors = err.errors || [];
  }

  const response = {
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err,
    }),
  };

  res.status(statusCode).json(response);
};

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode = 400, errors = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error handler wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Error response helper
export const sendErrorResponse = (res, statusCode, message, errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
  });
};

// Success response helper
export const sendSuccessResponse = (res, statusCode = 200, message, data = null) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};