import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    mysqlMovieId: {
      type: Number,
      default: null,
      index: true,
    },
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
      default: "",
    },
    director: {
      type: String,
      default: "",
      trim: true,
    },
    language: {
      type: String,
      default: "",
      trim: true,
    },
    cast: [
      {
        name: {
          type: String,
          required: true,
        },
        role: {
          type: String,
          required: true,
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
      default: "",
    },
    bannerImage: {
      type: String,
      default: "",
    },
    genre: [
      {
        type: String,
        required: true,
      },
    ],
    duration: {
      type: Number,
      required: true,
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
