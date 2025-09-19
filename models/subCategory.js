// models/SubCategory.js
import mongoose from 'mongoose';

const subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subcategory name is required'],
    trim: true,
    minlength: [2, 'Subcategory name must be at least 2 characters'],
    maxlength: [50, 'Subcategory name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Parent category is required']
  },
  icon: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0,
    min: [0, 'Sort order cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for id
subCategorySchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Compound index for unique subcategory name within a category
subCategorySchema.index({ name: 1, category: 1 }, { unique: true });

// Other indexes for performance
subCategorySchema.index({ category: 1 });
subCategorySchema.index({ isActive: 1 });
subCategorySchema.index({ sortOrder: 1 });
subCategorySchema.index({ name: 'text' }); // For text search

// Instance methods
subCategorySchema.methods.toJSON = function() {
  const subCategory = this.toObject();
  delete subCategory._id;
  delete subCategory.__v;
  return subCategory;
};

// Static methods
subCategorySchema.statics.findByCategory = function(categoryId, options = {}) {
  const filter = { category: categoryId };
  if (options.active !== undefined) {
    filter.isActive = options.active;
  }
  
  return this.find(filter)
    .populate('category', 'name icon color')
    .sort({ sortOrder: 1, name: 1 });
};

subCategorySchema.statics.search = function(searchTerm, options = {}) {
  const filter = {
    name: { $regex: searchTerm, $options: 'i' }
  };
  
  if (options.category) {
    filter.category = options.category;
  }
  
  if (options.active !== undefined) {
    filter.isActive = options.active;
  }
  
  return this.find(filter)
    .populate('category', 'name icon color')
    .sort({ category: 1, sortOrder: 1, name: 1 });
};

// Handle duplicate key errors
subCategorySchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    if (field === 'name') {
      next(new Error('Subcategory name already exists in this category'));
    } else {
      next(error);
    }
  } else {
    next(error);
  }
});

subCategorySchema.post('findOneAndUpdate', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    if (field === 'name') {
      next(new Error('Subcategory name already exists in this category'));
    } else {
      next(error);
    }
  } else {
    next(error);
  }
});

export default mongoose.model('SubCategory', subCategorySchema);