import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    trailer: {
      type: String,
      required: true, // YouTube URL hoặc video URL
    },
    cast: [
      {
        name: {
          type: String,
          required: true,
        },
        role: {
          type: String,
          required: true, // Ví dụ: "Đạo diễn", "Diễn viên", "Nhà sản xuất"
        },
        image: {
          type: String,
          default: "",
        },
      },
    ],
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
      default: 0,
    },
    poster: {
      type: String,
      required: true, // URL ảnh poster
    },
    bannerImage: {
      type: String,
      default: "", // URL ảnh banner riêng (khác với poster)
    },
    genre: [
      {
        type: String,
        required: true,
      },
    ],
    duration: {
      type: Number,
      required: true, // Thời lượng phim tính bằng phút
    },
    ageRating: {
      type: String,
      required: true,
      enum: ["K", "T13", "T16", "T18"],
      default: "K",
    },
    releaseDate: {
      type: Date,
      required: true,
    },
    isShowing: {
      type: Boolean,
      default: true,
    },
    theaters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Theater",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Movie = mongoose.model("Movie", movieSchema);

export default Movie;

