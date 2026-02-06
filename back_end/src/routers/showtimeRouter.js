import express from "express";
import {
  getShowtimesByMovie,
  createShowtime,
} from "../controllers/showtimeController.js";

const router = express.Router();

// Lấy lịch chiếu theo phim
router.get("/movie/:movieId", getShowtimesByMovie);

// Tạo lịch chiếu mới (có thể thêm auth middleware sau)
router.post("/", createShowtime);

export default router;

