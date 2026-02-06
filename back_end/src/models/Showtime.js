import mongoose from "mongoose";

const showtimeSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    theater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theater",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true, 
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    availableSeats: {
      type: Number,
      required: true,
      default: 0,
    },
    totalSeats: {
      type: Number,
      required: true,
      default: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Lưu id suất chiếu gốc trong MySQL (nếu có), dùng để map ghế đã đặt
    mysqlId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Showtime = mongoose.model("Showtime", showtimeSchema);

export default Showtime;

