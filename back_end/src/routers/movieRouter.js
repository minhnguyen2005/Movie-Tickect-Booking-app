import express from "express";
import {
  getAllMovies,
  getMovieById,
  searchMovies,
  getAllTheaters,
  getTopMovies,
} from "../controllers/movieController.js";

const router = express.Router();

// Lấy tất cả rạp
router.get("/theaters", getAllTheaters);

// Lấy top phim
router.get("/top", getTopMovies);

// Tìm kiếm phim
router.get("/search", searchMovies);

// Lấy tất cả phim
router.get("/", getAllMovies);

// Lấy chi tiết phim theo ID
router.get("/:id", getMovieById);

export default router;

