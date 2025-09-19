// controllers/SubCategoryController.js
import SubCategory from '../models/subcategory.js';
import Category from '../models/category.js';
import asyncHandler from 'express-async-handler';

class SubCategoryController {
  // desc    Get all subcategories
  // route   GET /api/subcategories
  // access  Public
  static getAllSubCategories = asyncHandler(async (req, res) => {
    const { active, search, category } = req.query;

    // Build filter
    const filter = {};
    if (active !== undefined) filter.isActive = active === 'true';
    if (category) filter.category = category;
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const subCategories = await SubCategory.find(filter)
      .populate('category', 'name icon color')
      .sort({ category: 1, sortOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: subCategories.length,
      data: subCategories
    });
  });

  // desc    Get subcategories by category
  // route   GET /api/subcategories/category/:categoryId
  // access  Public
  static getSubCategoriesByCategory = asyncHandler(async (req, res) => {
    const { active } = req.query;
    
    const filter = { category: req.params.categoryId };
    if (active !== undefined) filter.isActive = active === 'true';

    const subCategories = await SubCategory.find(filter)
      .populate('category', 'name icon color')
      .sort({ sortOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: subCategories.length,
      data: subCategories
    });
  });

  // desc    Get single subcategory
  // route   GET /api/subcategories/:id
  // access  Public
  static getSingleSubCategory = asyncHandler(async (req, res) => {
    const subCategory = await SubCategory.findById(req.params.id)
      .populate('category', 'name icon color description');

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    res.status(200).json({
      success: true,
      data: subCategory
    });
  });

  // desc    Create subcategory
  // route   POST /api/subcategories
  // access  Private/Admin
  static createSubCategory = asyncHandler(async (req, res) => {
    const { name, description, category, isActive, sortOrder } = req.body;

    // Check if parent category exists
    const parentCategory = await Category.findById(category);
    if (!parentCategory) {
      return res.status(404).json({
        success: false,
        message: 'Parent category not found'
      });
    }

    // Handle image upload
    let iconUrl = '';
    let imageUrl = '';
    
    if (req.files) {
      if (req.files.icon && req.files.icon[0]) {
        iconUrl = `/uploads/subcategories/${req.files.icon[0].filename}`;
      }
      if (req.files.image && req.files.image[0]) {
        imageUrl = `/uploads/subcategories/${req.files.image[0].filename}`;
      }
    }

    const subCategory = await SubCategory.create({
      name,
      description,
      category,
      icon: iconUrl,
      image: imageUrl,
      isActive,
      sortOrder
    });

    const populatedSubCategory = await SubCategory.findById(subCategory._id)
      .populate('category', 'name icon color');

    res.status(201).json({
      success: true,
      data: populatedSubCategory
    });
  });

  // desc    Update subcategory
  // route   PUT /api/subcategories/:id
  // access  Private/Admin
  static updateSubCategory = asyncHandler(async (req, res) => {
    const { name, description, category, isActive, sortOrder } = req.body;

    const subCategory = await SubCategory.findById(req.params.id);

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    // Check if new parent category exists (if being changed)
    if (category && category !== subCategory.category.toString()) {
      const parentCategory = await Category.findById(category);
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }

    // Handle image uploads
    let iconUrl = subCategory.icon;
    let imageUrl = subCategory.image;
    
    if (req.files) {
      if (req.files.icon && req.files.icon[0]) {
        iconUrl = `/uploads/subcategories/${req.files.icon[0].filename}`;
      }
      if (req.files.image && req.files.image[0]) {
        imageUrl = `/uploads/subcategories/${req.files.image[0].filename}`;
      }
    }

    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      {
        name: name || subCategory.name,
        description: description || subCategory.description,
        category: category || subCategory.category,
        icon: iconUrl,
        image: imageUrl,
        isActive: isActive !== undefined ? isActive : subCategory.isActive,
        sortOrder: sortOrder !== undefined ? sortOrder : subCategory.sortOrder
      },
      { new: true, runValidators: true }
    ).populate('category', 'name icon color');

    res.status(200).json({
      success: true,
      data: updatedSubCategory
    });
  });

  // desc    Delete subcategory
  // route   DELETE /api/subcategories/:id
  // access  Private/Admin
  static deleteSubCategory = asyncHandler(async (req, res) => {
    const subCategory = await SubCategory.findById(req.params.id);

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    // Check if subcategory has products
    const Product = (await import('../models/product.js')).default;
    const productsCount = await Product.countDocuments({ subCategory: req.params.id });

    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete subcategory that has products. Please reassign or delete products first.'
      });
    }

    await SubCategory.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Subcategory deleted successfully'
    });
  });

  // desc    Get subcategory count
  // route   GET /api/subcategories/stats/count
  // access  Public
  static getSubCategoryCount = asyncHandler(async (req, res) => {
    const { category } = req.query;
    
    const filter = {};
    if (category) filter.category = category;
    
    const subCategoryCount = await SubCategory.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: { subCategoryCount }
    });
  });
}

export default SubCategoryController;