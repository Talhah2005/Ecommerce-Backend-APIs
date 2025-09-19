import express from "express";
import {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
  refreshToken,
  sendVerificationCodeEmail,
  verifyCode,
} from "../controllers/authController.js";

import {
  googleAuth,
  googleCallback,
  facebookAuth,
  facebookCallback,
  linkGoogleAccount,
  linkFacebookAccount,
  unlinkGoogleAccount,
  unlinkFacebookAccount,
} from "../controllers/socialAuthController.js";

import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyEmail,
  validateResendVerification,
  validateChangePassword,
  validateUpdateProfile,
  validateVerificationCode,
} from "../middleware/User-Validation.js";

import { protect, requireVerification, authorize } from "../middleware/auth.js";

const router = express.Router();

// Public routes - Authentication
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/logout", logout);

// Public routes - Password Reset
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.post("/reset-password", validateResetPassword, resetPassword);

// Public routes - Email Verification
router.post("/verify-email", validateVerifyEmail, verifyEmail);
router.post(
  "/resend-verification",
  validateResendVerification,
  resendVerification
);

// Public routes - Token Management
router.post("/refresh-token", refreshToken);

// Protected routes - User Profile
router.get("/me", protect, getMe);
router.put("/profile", protect, validateUpdateProfile, updateProfile);
router.put("/change-password", protect, validateChangePassword, changePassword);

// Protected routes - Additional Verification
router.post("/send-verification-code", protect, sendVerificationCodeEmail);
router.post("/verify-code", protect, validateVerificationCode, verifyCode);

// Social Authentication Routes - Google
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

// Social Authentication Routes - Facebook
router.get("/facebook", facebookAuth);
router.get("/facebook/callback", facebookCallback);

// Protected Social Account Management
router.post("/link-google", protect, linkGoogleAccount);
router.post("/link-facebook", protect, linkFacebookAccount);
router.delete("/unlink-google", protect, unlinkGoogleAccount);
router.delete("/unlink-facebook", protect, unlinkFacebookAccount);

// Admin routes (example)
router.get("/admin/users", protect, authorize("admin"), async (req, res) => {
  // This would be in a separate admin controller
  res.json({ message: "Admin users endpoint" });
});

// Health check for auth service
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Auth service is healthy",
    timestamp: new Date().toISOString(),
  });
});

export default router;
