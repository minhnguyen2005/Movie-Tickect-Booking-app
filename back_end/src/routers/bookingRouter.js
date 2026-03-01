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

router.use(authenticate);
router.post("/", createBooking);
router.get("/my-bookings", getMyBookings);
router.get("/stats", getUserStats);
router.get("/:bookingId", getBookingById);
router.put("/:bookingId/payment", updateBookingPayment);
router.delete("/:bookingId", cancelBooking);

export default router;
