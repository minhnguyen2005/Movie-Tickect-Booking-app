import express from "express";
import {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingPayment,
  cancelBooking,
  getUserStats,
} from "../controllers/bookingController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// Tất cả routes đều cần authenticate
router.use(authenticate);

// Tạo booking mới
router.post("/", createBooking);

// Lấy danh sách booking của user
router.get("/my-bookings", getMyBookings);

// Lấy thống kê của user (số phim đã xem, điểm tích lũy, vé sắp tới)
router.get("/stats", getUserStats);

// Lấy chi tiết booking
router.get("/:bookingId", getBookingById);

// Cập nhật thanh toán
router.put("/:bookingId/payment", updateBookingPayment);

// Hủy booking
router.delete("/:bookingId", cancelBooking);

export default router;

