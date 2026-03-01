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

router.post("/register", register);
router.post("/create-admin", createAdmin);
router.post("/login", login);
router.get("/me", authenticate, getCurrentUser);
router.put("/profile", authenticate, updateProfile);
router.get("/wishlist", authenticate, getWishlist);
router.post("/wishlist", authenticate, addToWishlist);
router.delete("/wishlist/:movieId", authenticate, removeFromWishlist);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
