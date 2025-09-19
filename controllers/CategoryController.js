    // controllers/CategoryController.js
import Category from '../models/category.js';
import asyncHandler from 'express-async-handler';

class CategoryController {
  // desc    Get all categories
  // route   GET /api/categories
  // access  Public
  static getAllCategories = asyncHandler(async (req, res) => {
    const { active, search } = req.query;
    
    // Build filter
    const filter = {};
    if (active !== undefined) filter.isActive = active === 'true';
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    
    const categories = await Category.find(filter)
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  });

  // desc    Get single category
  // route   GET /api/categories/:id
  // access  Public
  static getSingleCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  });

  // desc    Create category
  // route   POST /api/categories
  // access  Private/Admin
  static createCategory = asyncHandler(async (req, res) => {
    const { name, description, color, isActive } = req.body;
    
    // Handle icon upload
    let iconUrl = '';
    if (req.file) {
      iconUrl = `/uploads/categories/${req.file.filename}`;
    }
    
    const category = await Category.create({
      name,
      description,
      color,
      icon: iconUrl,
      isActive
    });
    
    res.status(201).json({
      success: true,
      data: category
    });
  });

  // desc    Update category
  // route   PUT /api/categories/:id
  // access  Private/Admin
  static updateCategory = asyncHandler(async (req, res) => {
    const { name, description, color, isActive } = req.body;
    
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Handle icon upload
    let iconUrl = category.icon;
    if (req.file) {
      iconUrl = `/uploads/categories/${req.file.filename}`;
    }
    
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: name || category.name,
        description: description || category.description,
        color: color || category.color,
        icon: iconUrl,
        isActive: isActive !== undefined ? isActive : category.isActive
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedCategory
    });
  });

  // desc    Delete category
  // route   DELETE /api/categories/:id
  // access  Private/Admin
  static deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if category has products
    const Product = (await import('../models/product.js')).default;
    const productsCount = await Product.countDocuments({ category: req.params.id });
    
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category that has products. Please reassign or delete products first.'
      });
    }
    
    await Category.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  });
}

export default CategoryController;