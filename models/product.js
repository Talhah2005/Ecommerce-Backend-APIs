// models/Product.js
import mongoose from 'mongoose';

// Sub-schema for product variants
const variantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  additionalPrice: {
    type: Number,
    default: 0,
    min: [0, 'Additional price cannot be negative']
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  sku: {
    type: String,
    trim: true,
    uppercase: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Sub-schema for color/material choices
const colorMaterialSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['color', 'material', 'finish'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String, // hex code for colors, material name for materials
    required: true,
    trim: true
  },
  additionalPrice: {
    type: Number,
    default: 0,
    min: [0, 'Additional price cannot be negative']
  },
  image: {
    type: String,
    default: ''
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
});

// Sub-schema for additional services
const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Service price cannot be negative']
  },
  duration: {
    type: String, // e.g., "1-2 business days"
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Sub-schema for tax information
const taxSchema = new mongoose.Schema({
  taxable: {
    type: Boolean,
    default: true
  },
  taxRate: {
    type: Number,
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot exceed 100%']
  },
  taxClass: {
    type: String,
    enum: ['standard', 'reduced', 'exempt', 'zero'],
    default: 'standard'
  },
  taxCategory: {
    type: String,
    trim: true
  }
});

// Sub-schema for media
const mediaSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['image', 'video', '360view', 'document'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  richDescription: {
    type: String,
    default: '',
    maxlength: [5000, 'Rich description cannot exceed 5000 characters']
  },
  image: {
    type: String,
    default: ''
  },
  images: [{
    type: String
  }],
  // New media field for enhanced media support
  media: [mediaSchema],
  
  brand: {
    type: String,
    default: '',
    trim: true,
    maxlength: [50, 'Brand name cannot exceed 50 characters']
  },
  
  // Enhanced pricing structure
  price: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price cannot be negative']
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative'],
    validate: {
      validator: function(v) {
        return !v || v < this.price;
      },
      message: 'Discount price must be less than regular price'
    }
  },
  
  // Tax information
  taxInfo: taxSchema,
  
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  
  // New subcategory field
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory'
  },
  
  // Enhanced stock management
  countInStock: {
    type: Number,
    required: [true, 'Stock count is required'],
    min: [0, 'Stock cannot be negative'],
    max: [99999, 'Stock cannot exceed 99999']
  },
  
  // Availability status
  availabilityStatus: {
    type: String,
    enum: ['in_stock', 'out_of_stock', 'low_stock', 'preorder', 'discontinued', 'coming_soon'],
    default: function() {
      if (this.countInStock > 10) return 'in_stock';
      if (this.countInStock > 0) return 'low_stock';
      return 'out_of_stock';
    }
  },
  
  // Stock threshold for low stock warnings
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: [0, 'Low stock threshold cannot be negative']
  },
  
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  numReviews: {
    type: Number,
    default: 0,
    min: [0, 'Number of reviews cannot be negative']
  },
  
  // Wishlist count
  wishlistCount: {
    type: Number,
    default: 0,
    min: [0, 'Wishlist count cannot be negative']
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },
  
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative']
  },
  dimensions: {
    length: { 
      type: Number, 
      min: [0, 'Length cannot be negative'] 
    },
    width: { 
      type: Number, 
      min: [0, 'Width cannot be negative'] 
    },
    height: { 
      type: Number, 
      min: [0, 'Height cannot be negative'] 
    }
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  manufacturer: {
    type: String,
    trim: true
  },
  warrantyPeriod: {
    type: Number, // in months
    min: [0, 'Warranty period cannot be negative']
  },
  
  // New fields for enhanced product management
  
  // Product type/variants
  productType: {
    type: String,
    enum: ['simple', 'variable', 'grouped', 'external'],
    default: 'simple'
  },
  
  // Variants (sizes, colors, etc.)
  variants: [variantSchema],
  
  // Color and material choices
  colorMaterialOptions: [colorMaterialSchema],
  
  // Additional services
  additionalServices: [serviceSchema],
  
  // Product versions
  versions: [{
    version: {
      type: String,
      required: true,
      trim: true
    },
    releaseDate: {
      type: Date
    },
    changelog: {
      type: String,
      maxlength: [1000, 'Changelog cannot exceed 1000 characters']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    additionalPrice: {
      type: Number,
      default: 0,
      min: [0, 'Additional price cannot be negative']
    }
  }],
  
  // SEO and meta information
  seo: {
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title cannot exceed 60 characters']
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters']
    },
    keywords: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true
    }
  },
  
  // Shipping information
  shipping: {
    weight: {
      type: Number,
      min: [0, 'Shipping weight cannot be negative']
    },
    dimensions: {
      length: { type: Number, min: [0, 'Length cannot be negative'] },
      width: { type: Number, min: [0, 'Width cannot be negative'] },
      height: { type: Number, min: [0, 'Height cannot be negative'] }
    },
    shippingClass: {
      type: String,
      trim: true
    },
    freeShipping: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for id
productSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Virtual for final price (discounted price if available, otherwise regular price)
productSchema.virtual('finalPrice').get(function () {
  return this.discountPrice || this.price;
});

// Virtual to check if product is on sale
productSchema.virtual('isOnSale').get(function () {
  return !!this.discountPrice && this.discountPrice < this.price;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function () {
  if (!this.discountPrice || this.discountPrice >= this.price) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

// Enhanced stock status virtual
productSchema.virtual('stockStatus').get(function () {
  if (this.availabilityStatus === 'out_of_stock' || this.countInStock === 0) return 'Out of Stock';
  if (this.availabilityStatus === 'low_stock' || this.countInStock <= this.lowStockThreshold) return 'Low Stock';
  if (this.availabilityStatus === 'preorder') return 'Pre-order';
  if (this.availabilityStatus === 'coming_soon') return 'Coming Soon';
  if (this.availabilityStatus === 'discontinued') return 'Discontinued';
  return 'In Stock';
});

// Virtual for average rating display
productSchema.virtual('averageRating').get(function () {
  return this.numReviews > 0 ? parseFloat(this.rating.toFixed(1)) : 0;
});

// Virtual for total variant stock
productSchema.virtual('totalVariantStock').get(function () {
  if (!this.variants || this.variants.length === 0) return this.countInStock;
  return this.variants.reduce((total, variant) => total + (variant.stock || 0), 0);
});

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ subCategory: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ brand: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ availabilityStatus: 1 });
productSchema.index({ wishlistCount: -1 });
// Note: seo.slug index is already defined in the schema field with unique: true

// Pre-save middleware
productSchema.pre('save', function(next) {
  // Ensure SKU is uppercase if provided
  if (this.sku) {
    this.sku = this.sku.toUpperCase();
  }
  
  // Auto-generate slug if not provided
  if (!this.seo?.slug && this.name) {
    this.seo = this.seo || {};
    this.seo.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Update availability status based on stock
  if (this.isModified('countInStock') || this.isNew) {
    if (this.countInStock === 0) {
      this.availabilityStatus = 'out_of_stock';
    } else if (this.countInStock <= this.lowStockThreshold) {
      this.availabilityStatus = 'low_stock';
    } else {
      this.availabilityStatus = 'in_stock';
    }
  }
  
  // Validate discount price
  if (this.discountPrice && this.discountPrice >= this.price) {
    const error = new Error('Discount price must be less than regular price');
    return next(error);
  }
  
  // Ensure only one primary media item
  if (this.media && this.media.length > 0) {
    const primaryMedia = this.media.filter(m => m.isPrimary);
    if (primaryMedia.length > 1) {
      // Keep only the first primary media, set others to false
      let foundFirst = false;
      this.media.forEach(m => {
        if (m.isPrimary && foundFirst) {
          m.isPrimary = false;
        } else if (m.isPrimary && !foundFirst) {
          foundFirst = true;
        }
      });
    }
  }
  
  next();
});

// Static methods
productSchema.statics.findByCategory = function(categoryId) {
  return this.find({ category: categoryId, isActive: true });
};

productSchema.statics.findFeatured = function(limit = 10) {
  return this.find({ isFeatured: true, isActive: true }).limit(limit);
};

productSchema.statics.findByAvailability = function(status) {
  return this.find({ availabilityStatus: status, isActive: true });
};

// Instance methods
productSchema.methods.updateStock = function(quantity) {
  this.countInStock = Math.max(0, this.countInStock + quantity);
  return this.save();
};

productSchema.methods.addToWishlist = function() {
  this.wishlistCount += 1;
  return this.save();
};

productSchema.methods.removeFromWishlist = function() {
  this.wishlistCount = Math.max(0, this.wishlistCount - 1);
  return this.save();
};

productSchema.methods.updateRating = function(newRating) {
  const totalRating = this.rating * this.numReviews + newRating;
  this.numReviews += 1;
  this.rating = totalRating / this.numReviews;
  return this.save();
};

export default mongoose.model('Product', productSchema);