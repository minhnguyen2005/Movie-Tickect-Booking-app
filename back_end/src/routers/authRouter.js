import express from "express";
import {
  register,
  login,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  updateProfile,
  createAdmin,
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// Đăng ký
router.post("/register", register);

// Tạo tài khoản admin (dùng secret trong body, không dùng cho user thường)
router.post("/create-admin", createAdmin);

// Đăng nhập
router.post("/login", login);

// Lấy thông tin user hiện tại (cần authenticate)
router.get("/me", authenticate, getCurrentUser);

// Cập nhật profile (cần authenticate)
router.put("/profile", authenticate, updateProfile);

// Wishlist - danh sách phim muốn xem trong tương lai
router.get("/wishlist", authenticate, getWishlist);
router.post("/wishlist", authenticate, addToWishlist);
router.delete("/wishlist/:movieId", authenticate, removeFromWishlist);

// Quên mật khẩu
router.post("/forgot-password", forgotPassword);

// Reset mật khẩu
router.post("/reset-password", resetPassword);

export default router;
