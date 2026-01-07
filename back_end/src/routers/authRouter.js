import express from "express";
import {
  register,
  login,
  getCurrentUser,
  forgotPassword,
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// Đăng ký
router.post("/register", register);

// Đăng nhập
router.post("/login", login);

// Lấy thông tin user hiện tại (cần authenticate)
router.get("/me", authenticate, getCurrentUser);

// Quên mật khẩu
router.post("/forgot-password", forgotPassword);

export default router;
