// controllers/ProductController.js
import Product from "../models/product.js";
import Category from "../models/category.js";
import asyncHandler from "express-async-handler";

class ProductController {
  // @desc    Get all products with filtering, sorting, pagination
  // @route   GET /api/products
  // @access  Public
  static getAllProducts = asyncHandler(async (req, res) => {
    const {
      category,
      subCategory,
      featured,
      search,
      minPrice,
      maxPrice,
      brand,
      rating,
      sort,
      page = 1,
      limit = 12,
      active,
      availability,
      productType,
      tags,
    } = req.query;

    // Build filter object
    const filter = {};

    // Admin can see inactive products, public cannot
    if (req.user?.role === "admin") {
      if (active !== undefined) filter.isActive = active === "true";
    } else {
      filter.isActive = true;
    }

    if (category) filter.category = { $in: category.split(",") };
    if (subCategory) filter.subCategory = { $in: subCategory.split(",") };
    if (featured !== undefined) filter.isFeatured = featured === "true";
    if (brand) filter.brand = { $regex: brand, $options: "i" };
    if (rating) filter.rating = { $gte: Number(rating) };
    if (availability) filter.availabilityStatus = { $in: availability.split(",") };
    if (productType) filter.productType = productType;
    if (tags) filter.tags = { $in: tags.split(",") };

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Search filter
    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case "price_asc":
        sortObj = { price: 1 };
        break;
      case "price_desc":
        sortObj = { price: -1 };
        break;
      case "rating":
        sortObj = { rating: -1 };
        break;
      case "newest":
        sortObj = { createdAt: -1 };
        break;
      case "oldest":
        sortObj = { createdAt: 1 };
        break;
      case "name":
        sortObj = { name: 1 };
        break;
      case "popularity":
        sortObj = { wishlistCount: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const products = await Product.find(filter)
      .populate("category", "name icon color")
      .populate("subCategory", "name description")
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: products,
    });
  });

  // @desc    Get single product
  // @route   GET /api/products/:id
  // @access  Public
  static getSingleProduct = asyncHandler(async (req, res) => {
    const filter = { _id: req.params.id };

    // Non-admin users can only see active products
    if (!req.user || req.user.role !== "admin") {
      filter.isActive = true;
    }

    const product = await Product.findOne(filter)
      .populate("category", "name icon color description")
      .populate("subCategory", "name description");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  });

  // @desc    Create product
  // @route   POST /api/products
  // @access  Private/Admin
  static createProduct = asyncHandler(async (req, res) => {
    const {
      name,
      description,
      richDescription,
      brand,
      price,
      discountPrice,
      category,
      subCategory,
      countInStock,
      lowStockThreshold,
      availabilityStatus,
      isFeatured,
      sku,
      weight,
      dimensions,
      tags,
      manufacturer,
      warrantyPeriod,
      // New fields
      productType,
      variants,
      colorMaterialOptions,
      additionalServices,
      versions,
      taxInfo,
      media,
      seo,
      shipping
    } = req.body;

    // Handle main image upload
    let imageUrl = "";
    if (req.file) {
      imageUrl = `/uploads/products/${req.file.filename}`;
    }

    // Parse JSON strings if they come as strings
    const parsedDimensions = typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions;
    const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
    const parsedColorMaterialOptions = typeof colorMaterialOptions === 'string' ? JSON.parse(colorMaterialOptions) : colorMaterialOptions;
    const parsedAdditionalServices = typeof additionalServices === 'string' ? JSON.parse(additionalServices) : additionalServices;
    const parsedVersions = typeof versions === 'string' ? JSON.parse(versions) : versions;
    const parsedTaxInfo = typeof taxInfo === 'string' ? JSON.parse(taxInfo) : taxInfo;
    const parsedMedia = typeof media === 'string' ? JSON.parse(media) : media;
    const parsedSeo = typeof seo === 'string' ? JSON.parse(seo) : seo;
    const parsedShipping = typeof shipping === 'string' ? JSON.parse(shipping) : shipping;

    // Create product data object
    const productData = {
      name,
      description,
      richDescription,
      image: imageUrl,
      brand,
      price,
      discountPrice,
      category,
      countInStock,
      isFeatured: isFeatured || false,
      sku,
      weight,
      dimensions: parsedDimensions,
      tags: parsedTags,
      manufacturer,
      warrantyPeriod,
      // New fields with defaults
      productType: productType || 'simple',
      lowStockThreshold: lowStockThreshold || 10,
      availabilityStatus: availabilityStatus || undefined, // Let the model set default
      wishlistCount: 0
    };

    // Add optional fields only if provided
    if (subCategory) productData.subCategory = subCategory;
    if (parsedVariants && parsedVariants.length > 0) productData.variants = parsedVariants;
    if (parsedColorMaterialOptions && parsedColorMaterialOptions.length > 0) productData.colorMaterialOptions = parsedColorMaterialOptions;
    if (parsedAdditionalServices && parsedAdditionalServices.length > 0) productData.additionalServices = parsedAdditionalServices;
    if (parsedVersions && parsedVersions.length > 0) productData.versions = parsedVersions;
    if (parsedTaxInfo) productData.taxInfo = parsedTaxInfo;
    if (parsedMedia && parsedMedia.length > 0) productData.media = parsedMedia;
    if (parsedSeo) productData.seo = parsedSeo;
    if (parsedShipping) productData.shipping = parsedShipping;

    const product = await Product.create(productData);

    const populatedProduct = await Product.findById(product._id)
      .populate("category", "name icon color")
      .populate("subCategory", "name description");

    res.status(201).json({
      success: true,
      data: populatedProduct,
    });
  });

  // desc    Update product
  // route   PUT /api/products/:id
  // access  Private/Admin
  static updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Handle image upload
    if (req.file) {
      product.image = `/uploads/products/${req.file.filename}`;
    }

    // Update all possible fields
    const fieldsToUpdate = [
      "name",
      "description",
      "richDescription",
      "brand",
      "price",
      "discountPrice",
      "category",
      "subCategory",
      "countInStock",
      "lowStockThreshold",
      "availabilityStatus",
      "isFeatured",
      "isActive",
      "sku",
      "weight",
      "dimensions",
      "tags",
      "manufacturer",
      "warrantyPeriod",
      "productType",
      "variants",
      "colorMaterialOptions",
      "additionalServices",
      "versions",
      "taxInfo",
      "media",
      "seo",
      "shipping"
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        // Parse JSON strings for complex fields
        if (['dimensions', 'tags', 'variants', 'colorMaterialOptions', 'additionalServices', 'versions', 'taxInfo', 'media', 'seo', 'shipping'].includes(field)) {
          try {
            product[field] = typeof req.body[field] === 'string' ? JSON.parse(req.body[field]) : req.body[field];
          } catch (error) {
            product[field] = req.body[field];
          }
        } else {
          product[field] = req.body[field];
        }
      }
    });

    await product.save();
    await product.populate("category", "name icon color");
    await product.populate("subCategory", "name description");

    res.status(200).json({
      success: true,
      data: product,
    });
  });

  // desc    Upload product gallery images
  // route   PUT /api/products/:id/gallery
  // access  Private/Admin
  static uploadGalleryImages = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded",
      });
    }

    const imagePaths = req.files.map(
      (file) => `/uploads/products/${file.filename}`
    );

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { images: imagePaths },
      { new: true }
    ).populate("category", "name icon color")
     .populate("subCategory", "name description");

    res.status(200).json({
      success: true,
      data: updatedProduct,
    });
  });

  // desc    Upload product media (images/videos)
  // route   PUT /api/products/:id/media
  // access  Private/Admin
  static uploadProductMedia = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No media files uploaded",
      });
    }

    // Process uploaded files and create media objects
    const mediaItems = req.files.map((file, index) => ({
      type: file.mimetype.startsWith('video/') ? 'video' : 'image',
      url: `/uploads/products/${file.filename}`,
      alt: req.body[`alt_${index}`] || '',
      title: req.body[`title_${index}`] || '',
      isPrimary: req.body[`isPrimary_${index}`] === 'true' || false,
      order: parseInt(req.body[`order_${index}`]) || index
    }));

    // Add to existing media or replace
    const replaceExisting = req.body.replaceExisting === 'true';
    if (replaceExisting) {
      product.media = mediaItems;
    } else {
      product.media = [...(product.media || []), ...mediaItems];
    }

    await product.save();
    await product.populate("category", "name icon color");
    await product.populate("subCategory", "name description");

    res.status(200).json({
      success: true,
      data: product,
    });
  });

  // desc    Add product to wishlist
  // route   PUT /api/products/:id/wishlist
  // access  Private
  static addToWishlist = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.addToWishlist();

    res.status(200).json({
      success: true,
      message: "Product added to wishlist",
      data: { wishlistCount: product.wishlistCount },
    });
  });

  // desc    Remove product from wishlist
  // route   DELETE /api/products/:id/wishlist
  // access  Private
  static removeFromWishlist = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.removeFromWishlist();

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      data: { wishlistCount: product.wishlistCount },
    });
  });

  // desc    Delete product
  // route   DELETE /api/products/:id
  // access  Private/Admin
  static deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if product is in any pending orders
    const Order = (await import("../models/order.js")).default;
    const OrderItem = (await import("../models/OrderItem.js")).default;

    const orderItems = await OrderItem.find({ product: req.params.id });
    if (orderItems.length > 0) {
      const orderIds = orderItems.map((item) => item._id);
      const pendingOrders = await Order.find({
        orderItems: { $in: orderIds },
        status: { $in: ["Pending", "Processing", "Shipped"] },
      });

      if (pendingOrders.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete product with pending orders. Please complete or cancel orders first.",
        });
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  });

  // desc    Get product count
  // route   GET /api/products/stats/count
  // access  Public
  static getProductCount = asyncHandler(async (req, res) => {
    const filter = {};

    // Non-admin users only see active products
    if (!req.user || req.user.role !== "admin") {
      filter.isActive = true;
    }

    const productCount = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: { productCount },
    });
  });

  // desc    Get product statistics
  // route   GET /api/products/stats/overview
  // access  Private/Admin
  static getProductStats = asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      outOfStockProducts,
      lowStockProducts,
      featuredProducts,
      totalWishlistCount,
      avgRating
    ] = await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: false }),
      Product.countDocuments({ availabilityStatus: 'out_of_stock' }),
      Product.countDocuments({ availabilityStatus: 'low_stock' }),
      Product.countDocuments({ isFeatured: true }),
      Product.aggregate([{ $group: { _id: null, total: { $sum: '$wishlistCount' } } }]),
      Product.aggregate([{ $group: { _id: null, avgRating: { $avg: '$rating' } } }])
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        inactiveProducts,
        outOfStockProducts,
        lowStockProducts,
        featuredProducts,
        totalWishlistCount: totalWishlistCount[0]?.total || 0,
        averageRating: parseFloat((avgRating[0]?.avgRating || 0).toFixed(2))
      },
    });
  });

  // desc    Get featured products
  // route   GET /api/products/featured/:count
  // access  Public
  static getFeaturedProducts = asyncHandler(async (req, res) => {
    const count = parseInt(req.params.count) || 8;

    const filter = { isFeatured: true };

    // Non-admin users only see active products
    if (!req.user || req.user.role !== "admin") {
      filter.isActive = true;
    }

    const products = await Product.find(filter)
      .populate("category", "name icon color")
      .populate("subCategory", "name description")
      .limit(count)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  });

  // desc    Get products by category
  // route   GET /api/products/category/:categoryId
  // access  Public
  static getProductsByCategory = asyncHandler(async (req, res) => {
    const { page = 1, limit = 12, sort, subCategory } = req.query;

    const filter = { category: req.params.categoryId };

    // Non-admin users only see active products
    if (!req.user || req.user.role !== "admin") {
      filter.isActive = true;
    }

    if (subCategory) {
      filter.subCategory = subCategory;
    }

    // Build sort object
    let sortObj = { createdAt: -1 };
    if (sort) {
      switch (sort) {
        case "price_asc":
          sortObj = { price: 1 };
          break;
        case "price_desc":
          sortObj = { price: -1 };
          break;
        case "rating":
          sortObj = { rating: -1 };
          break;
        case "name":
          sortObj = { name: 1 };
          break;
        case "popularity":
          sortObj = { wishlistCount: -1 };
          break;
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(filter)
      .populate("category", "name icon color")
      .populate("subCategory", "name description")
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: products,
    });
  });

  // desc    Get products by availability status
  // route   GET /api/products/availability/:status
  // access  Public
  static getProductsByAvailability = asyncHandler(async (req, res) => {
    const { page = 1, limit = 12, sort } = req.query;
    const { status } = req.params;

    const validStatuses = ['in_stock', 'out_of_stock', 'low_stock', 'preorder', 'discontinued', 'coming_soon'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability status",
      });
    }

    const filter = { availabilityStatus: status };

    // Non-admin users only see active products
    if (!req.user || req.user.role !== "admin") {
      filter.isActive = true;
    }

    // Build sort object
    let sortObj = { createdAt: -1 };
    if (sort) {
      switch (sort) {
        case "price_asc":
          sortObj = { price: 1 };
          break;
        case "price_desc":
          sortObj = { price: -1 };
          break;
        case "rating":
          sortObj = { rating: -1 };
          break;
        case "name":
          sortObj = { name: 1 };
          break;
        case "popularity":
          sortObj = { wishlistCount: -1 };
          break;
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(filter)
      .populate("category", "name icon color")
      .populate("subCategory", "name description")
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: products,
    });
  });

  // desc    Update product rating
  // route   PUT /api/products/:id/rating
  // access  Private
  static updateProductRating = asyncHandler(async (req, res) => {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.updateRating(rating);

    res.status(200).json({
      success: true,
      message: "Product rating updated",
      data: { 
        rating: product.rating, 
        numReviews: product.numReviews 
      },
    });
  });

  // desc    Bulk update product availability
  // route   PUT /api/products/bulk/availability
  // access  Private/Admin
  static bulkUpdateAvailability = asyncHandler(async (req, res) => {
    const { productIds, availabilityStatus } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product IDs array is required",
      });
    }

    const validStatuses = ['in_stock', 'out_of_stock', 'low_stock', 'preorder', 'discontinued', 'coming_soon'];
    
    if (!validStatuses.includes(availabilityStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability status",
      });
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { availabilityStatus }
    );

    res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} products`,
      data: { 
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount 
      },
    });
  });
}

export default ProductController;