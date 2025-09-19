// middleware/security.js
export const sanitizeInput = (req, res, next) => {
  // Remove any HTML tags from string inputs
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/<[^>]*>/g, '').trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };
  
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  
  next();
};

// Resource ownership middleware for orders
export const checkOrderOwnership = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return next();
    }
    
    const Order = (await import('../models/order.js')).default;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own orders.'
      });
    }
    
    req.order = order;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error checking order ownership'
    });
  }
};

// Stock validation middleware
export const validateStockAvailability = async (req, res, next) => {
  try {
    const { orderItems } = req.body;
    
    if (!orderItems || !Array.isArray(orderItems)) {
      return next();
    }
    
    const Product = (await import('../models/product.js')).default;
    
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.product} not found`
        });
      }
      
      if (product.countInStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.countInStock}, Requested: ${item.quantity}`
        });
      }
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating stock availability'
    });
  }
};

// Admin role middleware (alias for your existing authorize)
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};