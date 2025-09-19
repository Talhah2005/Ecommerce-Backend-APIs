import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters'],
    minlength: [2, 'Name must be at least 2 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email',
    ],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number'],
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId && !this.facebookId;
    },
    minlength: [8, 'Password must be at least 8 characters'],
    select: false, // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'seller'],
    default: 'customer',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  avatar: {
    type: String,
    default: null,
  },
  // Social login fields
  googleId: {
    type: String,
    sparse: true,
  },
  facebookId: {
    type: String,
    sparse: true,
  },
  // Email verification
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  // Password reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  // Login attempts and account locking
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: Date,
  // Last login tracking
  lastLogin: Date,
  // Terms and privacy
  acceptedTerms: {
    type: Boolean,
    default: false,
  },
  acceptedPrivacy: {
    type: Boolean,
    default: false,
  },
  // Marketing preferences
  marketingEmails: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpire;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpire;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes for performance
// userSchema.index({ email: 1 });
// userSchema.index({ phone: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcryptjs.genSalt(12);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to set email verification token for new users
userSchema.pre('save', function(next) {
  if (this.isNew && !this.isVerified && !this.googleId && !this.facebookId) {
    this.emailVerificationToken = this.createEmailVerificationToken();
  }
  next();
});

// Instance method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcryptjs.compare(enteredPassword, this.password);
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  const payload = {
    id: this._id,
    email: this.email,
    role: this.role,
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
    issuer: 'ecommerce-api',
    subject: this._id.toString(),
  });
};

// Instance method to create email verification token
userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(20).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Instance method to create password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Instance method to handle failed login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // If we're at max attempts and not locked, lock account for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: Date.now() },
  });
};

// Static method to find user by credentials
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email }).select('+password');
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  // Check if account is locked
  if (user.isLocked) {
    await user.incLoginAttempts();
    throw new Error('Account temporarily locked due to too many failed login attempts');
  }
  
  const isPasswordMatch = await user.matchPassword(password);
  
  if (!isPasswordMatch) {
    await user.incLoginAttempts();
    throw new Error('Invalid credentials');
  }
  
  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }
  
  return user;
};

// Static method to create verification code (6 digits)
userSchema.statics.generateVerificationCode = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export default mongoose.model('User', userSchema);