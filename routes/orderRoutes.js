// routes/orderRoutes.js
import express from "express";
import OrderController from "../controllers/OrderController.js";
import { protect, authorize } from "../middleware/auth.js";
import { 
  validateOrder, 
  validateOrderStatus, 
  validatePaymentStatus,
  validateObjectId 
} from '../middleware/orderValidation.js';
import {
  checkOrderOwnership,
  validateStockAvailability,
} from "../middleware/security.js";
import { sanitizeInput } from "../middleware/security.js";

const router = express.Router();

// desc    Get all orders (Admin) or user's orders
// route   GET /api/orders
// access  Private/Admin
router.get(
  "/",
  protect,
  authorize("admin"),
  sanitizeInput,
  OrderController.getAllOrders
);

// desc    Get single order
// route   GET /api/orders/:id
// access  Private (Own orders) or Admin
router.get(
  "/:id",
  protect,
  validateObjectId("id"),
  checkOrderOwnership,
  OrderController.getSingleOrder
);

// desc    Create new order
// route   POST /api/orders
// access  Private
router.post(
  "/",
  protect,
  sanitizeInput,
  validateOrder,
  validateStockAvailability,
  OrderController.createOrder
);

// desc    Update order status
// route   PUT /api/orders/:id/status
// access  Private/Admin
router.put(
  "/:id/status",
  protect,
  authorize("admin"),
  validateObjectId("id"),
  sanitizeInput,
  validateOrderStatus,
  OrderController.updateOrderStatus
);

// desc    Update payment status
// route   PUT /api/orders/:id/payment
// access  Private/Admin
router.put(
  "/:id/payment",
  protect,
  authorize("admin"),
  validateObjectId("id"),
  sanitizeInput,
  validatePaymentStatus,
  OrderController.updatePaymentStatus
);

// desc    Cancel order (User can cancel their own pending orders)
// route   PUT /api/orders/:id/cancel
// access  Private
router.put(
  "/:id/cancel",
  protect,
  validateObjectId("id"),
  OrderController.cancelOrder
);

// desc    Get user's orders
// route   GET /api/orders/my-orders
// access  Private
router.get(
  "/my-orders",
  protect,
  sanitizeInput,
  OrderController.getUserOrders
);

// desc    Get order statistics
// route   GET /api/orders/stats/overview
// access  Private/Admin
router.get(
  "/stats/overview",
  protect,
  authorize("admin"),
  OrderController.getOrderStats
);

// desc    Get order by order number
// route   GET /api/orders/order-number/:orderNumber
// access  Private (Own orders) or Admin
router.get(
  "/order-number/:orderNumber",
  protect,
  OrderController.getOrderByNumber
);

export default router;