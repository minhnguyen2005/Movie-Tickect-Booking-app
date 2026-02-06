import Review from "../models/Review.js";
import Movie from "../models/Movie.js";
import User from "../models/User.js";

// Lấy tất cả đánh giá của một phim
export const getReviewsByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({
      movie: movieId,
      isApproved: true,
    })
      .populate("user", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({
      movie: movieId,
      isApproved: true,
    });

    // Tính rating trung bình
    const ratingStats = await Review.aggregate([
      { $match: { movie: movieId, isApproved: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: "$rating",
          },
        },
      },
    ]);

    let stats = {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };

    if (ratingStats.length > 0) {
      const stat = ratingStats[0];
      stats.averageRating = stat.averageRating.toFixed(1);
      stats.totalReviews = stat.totalReviews;

      // Tính phân bố rating
      stat.ratingDistribution.forEach((rating) => {
        if (rating >= 1 && rating <= 5) {
          stats.distribution[Math.round(rating)]++;
        }
      });

      // Chuyển sang phần trăm
      Object.keys(stats.distribution).forEach((key) => {
        stats.distribution[key] = Math.round(
          (stats.distribution[key] / stats.totalReviews) * 100
        );
      });
    }

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
        stats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi lấy đánh giá",
    });
  }
};

// Tạo đánh giá mới
export const createReview = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user?._id; // Từ middleware auth

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập để đánh giá",
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating phải từ 1 đến 5 sao",
      });
    }

    // Kiểm tra phim có tồn tại không
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phim",
      });
    }

    // Kiểm tra user đã đánh giá chưa (có thể cho phép đánh giá lại)
    const existingReview = await Review.findOne({
      movie: movieId,
      user: userId,
    });

    let review;
    if (existingReview) {
      // Cập nhật đánh giá cũ
      existingReview.rating = rating;
      existingReview.comment = comment || "";
      await existingReview.save();
      review = existingReview;
    } else {
      // Tạo đánh giá mới
      review = new Review({
        movie: movieId,
        user: userId,
        rating,
        comment: comment || "",
      });
      await review.save();
    }

    await review.populate("user", "fullName email");

    res.status(201).json({
      success: true,
      data: {
        review,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi tạo đánh giá",
    });
  }
};

// Xóa đánh giá (chỉ user tạo hoặc admin)
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập",
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá",
      });
    }

    // Chỉ cho phép xóa nếu là chủ sở hữu (có thể thêm admin check sau)
    if (review.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa đánh giá này",
      });
    }

    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({
      success: true,
      message: "Đã xóa đánh giá",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi xóa đánh giá",
    });
  }
};

