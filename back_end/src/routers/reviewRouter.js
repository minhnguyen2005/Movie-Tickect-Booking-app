import express from "express";
import {
  getReviewsByMovie,
  createReview,
  deleteReview,
} from "../controllers/reviewController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// Lấy đánh giá theo phim (public)
router.get("/movie/:movieId", getReviewsByMovie);

// Tạo đánh giá mới (cần đăng nhập)
router.post("/movie/:movieId", authenticate, createReview);

// Xóa đánh giá (cần đăng nhập)
router.delete("/:reviewId", authenticate, deleteReview);

export default router;

