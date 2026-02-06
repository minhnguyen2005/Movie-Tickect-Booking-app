import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    showtime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Showtime",
      required: true,
    },
    seats: {
      type: [String], // Ví dụ: ["A1", "A2", "B5"]
      required: true,
    },
    ticketType: {
      type: String,
      enum: ["standard", "vip", "premium"],
      default: "standard",
    },
    combo: {
      popcorn: {
        type: Number,
        default: 0,
        min: 0,
      },
      drink: {
        type: Number,
        default: 0,
        min: 0,
      },
      comboPrice: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled", "completed"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "banking", "momo", "zalopay"],
      default: "cash",
    },
    paymentInfo: {
      type: mongoose.Schema.Types.Mixed, // Lưu thông tin thanh toán
      default: {},
    },
    bookingCode: {
      type: String,
      unique: true,
      required: true,
    },
    pointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    pointsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;

