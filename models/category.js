// models/Category.js
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters'],
    unique: true
  },
  icon: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Color must be a valid hex color code'
    }
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for id
categorySchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Indexes for better performance (removed duplicate name index since it's unique)
categorySchema.index({ isActive: 1 });

// Pre-save middleware to check for duplicate names (case-insensitive)
categorySchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    const existingCategory = await this.constructor.findOne({
      name: { $regex: new RegExp(`^${this.name}`, 'i') },
      _id: { $ne: this._id }
    });
    
    if (existingCategory) {
      const error = new Error('Category name already exists');
      error.code = 11000;
      return next(error);
    }
  }
  next();
});

export default mongoose.model('Category', categorySchema);

      