import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/MovieDetail.css";
import Loading from "../components/Loading";
import { API_ENDPOINTS } from "../config/api";
import { AuthContext } from "../context/AuthContext";
import { FaPlay, FaStar, FaMapMarkerAlt, FaClock, FaUser } from "react-icons/fa";

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          API_ENDPOINTS.MOVIES.GET_BY_ID(id)
        );
        const data = await response.json();

        if (data.success) {
          setMovie(data.data.movie);
        } else {
          setError(data.message || "Không tìm thấy phim");
        }
      } catch (err) {
        setError("Lỗi khi tải thông tin phim");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  // Fetch showtimes
  useEffect(() => {
    const fetchShowtimes = async () => {
      if (!id) return;
      try {
        const today = new Date().toISOString().split("T")[0];
        const response = await fetch(
          `${API_ENDPOINTS.SHOWTIMES.GET_BY_MOVIE(id)}?date=${today}`
        );
        const data = await response.json();
        if (data.success) {
          setShowtimes(data.data.showtimes || []);
          // Set selected date to today
          setSelectedDate(today);
        }
      } catch (err) {
        console.error("Lỗi khi lấy lịch chiếu:", err);
      }
    };

    fetchShowtimes();
  }, [id]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      try {
        setReviewLoading(true);
        const response = await fetch(
          API_ENDPOINTS.REVIEWS.GET_BY_MOVIE(id)
        );
        const data = await response.json();
        if (data.success) {
          setReviews(data.data.reviews || []);
          setReviewStats(data.data.stats || null);
        }
      } catch (err) {
        console.error("Lỗi khi lấy đánh giá:", err);
      } finally {
        setReviewLoading(false);
      }
    };

    fetchReviews();
  }, [id]);

  // Lấy wishlist của user để biết phim hiện tại đã được lưu hay chưa
  useEffect(() => {
    const fetchWishlistStatus = async () => {
      if (!user) {
        setIsInWishlist(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(API_ENDPOINTS.WISHLIST.GET, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        if (
          data.success &&
          data.data &&
          Array.isArray(data.data.movies) &&
          movie
        ) {
          const exists = data.data.movies.some(
            (m) => m._id === movie._id
          );
          setIsInWishlist(exists);
        }
      } catch (err) {
        console.error("Lỗi khi lấy wishlist:", err);
      }
    };

    if (movie) {
      fetchWishlistStatus();
    }
  }, [user, movie]);

  const handleToggleWishlist = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setWishlistLoading(true);
      const token = localStorage.getItem("token");
      if (!token || !movie) return;

      if (!isInWishlist) {
        // Thêm vào wishlist
        const response = await fetch(API_ENDPOINTS.WISHLIST.ADD, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ movieId: movie._id }),
        });

        const data = await response.json();
        if (data.success) {
          setIsInWishlist(true);
        }
      } else {
        // Xóa khỏi wishlist
        const response = await fetch(
          API_ENDPOINTS.WISHLIST.REMOVE(movie._id),
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();
        if (data.success) {
          setIsInWishlist(false);
        }
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật wishlist:", err);
    } finally {
      setWishlistLoading(false);
    }
  };

  // Lấy video ID từ YouTube URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const monthNames = [
      "tháng 1",
      "tháng 2",
      "tháng 3",
      "tháng 4",
      "tháng 5",
      "tháng 6",
      "tháng 7",
      "tháng 8",
      "tháng 9",
      "tháng 10",
      "tháng 11",
      "tháng 12",
    ];
    return `${day} ${monthNames[month - 1]}, ${year}`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString.substring(0, 5); // HH:MM
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day}/${month}`;
  };

  const handleDateChange = async (date) => {
    setSelectedDate(date);
    try {
      const response = await fetch(
        `${API_ENDPOINTS.SHOWTIMES.GET_BY_MOVIE(id)}?date=${date}`
      );
      const data = await response.json();
      if (data.success) {
        setShowtimes(data.data.showtimes || []);
      }
    } catch (err) {
      console.error("Lỗi khi lấy lịch chiếu:", err);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(API_ENDPOINTS.REVIEWS.CREATE(id), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Refresh reviews
        const reviewsResponse = await fetch(
          API_ENDPOINTS.REVIEWS.GET_BY_MOVIE(id)
        );
        const reviewsData = await reviewsResponse.json();
        if (reviewsData.success) {
          setReviews(reviewsData.data.reviews || []);
          setReviewStats(reviewsData.data.stats || null);
        }
        setShowReviewForm(false);
        setReviewComment("");
        setReviewRating(5);
      } else {
        alert(data.message || "Lỗi khi gửi đánh giá");
      }
    } catch (err) {
      console.error("Lỗi khi gửi đánh giá:", err);
      alert("Lỗi khi gửi đánh giá");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(API_ENDPOINTS.REVIEWS.DELETE(reviewId), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success) {
        // Refresh reviews
        const reviewsResponse = await fetch(
          API_ENDPOINTS.REVIEWS.GET_BY_MOVIE(id)
        );
        const reviewsData = await reviewsResponse.json();
        if (reviewsData.success) {
          setReviews(reviewsData.data.reviews || []);
          setReviewStats(reviewsData.data.stats || null);
        }
      }
    } catch (err) {
      console.error("Lỗi khi xóa đánh giá:", err);
    }
  };

  // Generate date options (next 7 days)
  const getDateOptions = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  };

  if (loading) {
    return <Loading />;
  }

  if (error || !movie) {
    return (
      <div className="movie-detail-container">
        <div className="error-message">
          <h2>{error || "Không tìm thấy phim"}</h2>
          <button onClick={() => navigate("/")} className="btn-primary">
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const trailerVideoId = getYouTubeVideoId(movie.trailer);
  const embedUrl = trailerVideoId
    ? `https://www.youtube.com/embed/${trailerVideoId}?autoplay=1`
    : null;

  // Use real review stats if available, otherwise use movie rating
  const ratingData = reviewStats
    ? {
        average: parseFloat(reviewStats.averageRating) || movie.rating || 0,
        total: reviewStats.totalReviews || 0,
        distribution: reviewStats.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      }
    : {
        average: movie.rating || 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
  const productionDirector =
    String(movie.director || "").trim() ||
    (Array.isArray(movie.cast)
      ? movie.cast
          .filter((c) => c.role === "Director" || c.role === "Đạo diễn")
          .map((c) => c.name)
          .join(", ")
      : "") ||
    "N/A";
  const productionLanguage = String(movie.language || "").trim() || "N/A";

  return (
    <div className="movie-detail-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span onClick={() => navigate("/")}>Trang chủ</span>
        <span className="separator">/</span>
        <span>Phim đang chiếu</span>
        <span className="separator">/</span>
        <span className="current">{movie.title}</span>
      </div>

      {/* Main Content */}
      <div className="movie-main-content">
        <div className="movie-left-section">
          {/* Poster - Clickable */}
          <div
            className="movie-poster-wrapper"
            onClick={() => setShowTrailer(true)}
          >
            <img src={movie.poster} alt={movie.title} className="movie-poster" />
            <div className="poster-overlay">
              <div className="play-button">
                <FaPlay />
              </div>
              <p>Xem Trailer</p>
            </div>
            <span className={`age-rating ${movie.ageRating.toLowerCase()}`}>
              {movie.ageRating}
            </span>
          </div>

          {/* Production Info Box */}
          <div className="production-info-box">
            <h3>THÔNG TIN SẢN XUẤT</h3>
            <div className="info-item">
              <span className="info-label">ĐẠO DIỄN</span>
              <span className="info-value">{productionDirector}</span>
            </div>
            <div className="info-item">
              <span className="info-label">KHỞI CHIẾU</span>
              <span className="info-value">{formatDate(movie.releaseDate)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">NGÔN NGỮ</span>
              <span className="info-value">{productionLanguage}</span>
            </div>
            <div className="movie-detail-actions">
              <button className="btn-book-ticket">ĐẶT VÉ NGAY</button>
              <button
                className={`btn-wishlist ${isInWishlist ? "active" : ""}`}
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
              >
                {isInWishlist ? "Đã lưu" : "Lưu xem sau"}
              </button>
            </div>
          </div>
        </div>

        <div className="movie-right-section">
          {/* Genre, Duration, Age Rating */}
          <div className="movie-tags">
            <span className="age-tag">{movie.ageRating}</span>
            <span className="genre-duration">
              {Array.isArray(movie.genre) ? movie.genre.join(", ") : movie.genre} • {formatDuration(movie.duration)}
            </span>
          </div>

          {/* Title */}
          <h1 className="movie-title-large">{movie.title.toUpperCase()}</h1>

          {/* Synopsis */}
          <div className="synopsis-section">
            <h2 className="section-heading">NỘI DUNG PHIM</h2>
            <p className="synopsis-text">{movie.description}</p>
          </div>

          {/* Cast Section */}
          {movie.cast && movie.cast.length > 0 && (
            <div className="cast-section">
              <h2 className="section-heading">DÀN DIỄN VIÊN</h2>
              <div className="cast-scroll-container">
                <div className="cast-list">
                  {movie.cast
                    .filter((c) => c.role !== "Director" && c.role !== "Đạo diễn")
                    .slice(0, 10)
                    .map((person, index) => (
                      <div key={index} className="cast-item">
                        <div className="cast-details">
                          <h4 className="cast-name">{person.name}</h4>
                          <p className="cast-role">{person.role}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Showtimes Section */}
      <div className="showtimes-section">
        <h2 className="section-heading-large">LỊCH CHIẾU</h2>
        
        {/* Date selector */}
        <div className="date-selector">
          {getDateOptions().map((date) => (
            <button
              key={date}
              className={`date-btn ${selectedDate === date ? "active" : ""}`}
              onClick={() => handleDateChange(date)}
            >
              <span className="date-day">
                {new Date(date).toLocaleDateString("vi-VN", { weekday: "short" })}
              </span>
              <span className="date-number">{formatDateShort(date)}</span>
            </button>
          ))}
        </div>

        {/* Showtimes by theater */}
        {showtimes.length > 0 ? (
          <div className="showtimes-list">
            {showtimes.map((theaterGroup, index) => (
              <div key={index} className="theater-showtime-group">
                <div className="theater-header">
                  <h3 className="theater-name">
                    <FaMapMarkerAlt /> {theaterGroup.theater.name}
                  </h3>
                  <p className="theater-address">{theaterGroup.theater.address}</p>
                </div>
                <div className="showtime-slots">
                  {theaterGroup.showtimes.map((showtime) => (
                    <button
                      key={showtime._id}
                      className="showtime-slot"
                      onClick={() => {
                        const today = new Date().toISOString().split("T")[0];
                        const dateParam = selectedDate || today;
                        navigate(
                          `/booking/${id}?date=${dateParam}&showtimeId=${showtime._id}`
                        );
                      }}
                    >
                      <span className="showtime-time">
                        <FaClock /> {formatTime(showtime.time)}
                      </span>
                      <span className="showtime-price">
                        {showtime.price.toLocaleString("vi-VN")}đ
                      </span>
                      <span className="showtime-seats">
                        {showtime.availableSeats}/{showtime.totalSeats} ghế
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-showtimes">
            <p>Chưa có lịch chiếu cho ngày đã chọn.</p>
          </div>
        )}
      </div>

      {/* Rating & Reviews Section */}
      <div className="rating-section">
        <div className="rating-header">
          <h2 className="rating-title">Đánh giá từ khán giả</h2>
          {user && (
            <button
              className="btn-add-review"
              onClick={() => setShowReviewForm(!showReviewForm)}
            >
              {showReviewForm ? "Hủy" : "Viết đánh giá"}
            </button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <form className="review-form" onSubmit={handleSubmitReview}>
            <div className="review-form-rating">
              <label>Đánh giá của bạn:</label>
              <div className="star-rating-input">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${reviewRating >= star ? "active" : ""}`}
                    onClick={() => setReviewRating(star)}
                  >
                    <FaStar />
                  </button>
                ))}
              </div>
            </div>
            <div className="review-form-comment">
              <label>Bình luận:</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Chia sẻ cảm nhận của bạn về bộ phim..."
                rows="4"
              />
            </div>
            <button type="submit" className="btn-submit-review">
              Gửi đánh giá
            </button>
          </form>
        )}

        {reviewLoading ? (
          <div className="loading-reviews">Đang tải đánh giá...</div>
        ) : (
          <>
            <div className="rating-content">
              <div className="rating-average">
                <div className="rating-number">
                  {ratingData.average > 0 ? ratingData.average.toFixed(1) : "N/A"}
                </div>
                <div className="rating-stars">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`star ${
                        i < Math.round(ratingData.average) ? "filled" : ""
                      }`}
                    >
                      <FaStar />
                    </span>
                  ))}
                </div>
                <div className="rating-count">
                  {ratingData.total > 0
                    ? `${ratingData.total.toLocaleString()} đánh giá`
                    : "Chưa có đánh giá"}
                </div>
              </div>
              {ratingData.total > 0 && (
                <div className="rating-distribution">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="rating-bar-item">
                      <span className="star-label">{star} sao</span>
                      <div className="rating-bar">
                        <div
                          className="rating-bar-fill"
                          style={{
                            width: `${
                              ratingData.distribution[star] || 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="star-percentage">
                        {ratingData.distribution[star] || 0}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews List */}
            <div className="reviews-list">
              <h3 className="reviews-list-title">Bình luận ({reviews.length})</h3>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review._id} className="review-item">
                    <div className="review-header">
                      <div className="review-user">
                        <FaUser className="user-icon" />
                        <div>
                          <div className="review-user-name">
                            {review.user?.fullName || "Người dùng"}
                          </div>
                          <div className="review-date">
                            {new Date(review.createdAt).toLocaleDateString("vi-VN", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="review-rating">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`star ${
                              i < review.rating ? "filled" : ""
                            }`}
                          >
                            <FaStar />
                          </span>
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <div className="review-comment">{review.comment}</div>
                    )}
                    {user && review.user?._id === user._id && (
                      <button
                        className="btn-delete-review"
                        onClick={() => handleDeleteReview(review._id)}
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-reviews">
                  <p>Chưa có bình luận nào. Hãy là người đầu tiên đánh giá!</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Trailer Modal */}
      {showTrailer && embedUrl && (
        <div className="trailer-modal" onClick={() => setShowTrailer(false)}>
          <div className="trailer-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="trailer-modal-close"
              onClick={() => setShowTrailer(false)}
            >
              ×
            </button>
            <div className="trailer-wrapper">
              <iframe
                src={embedUrl}
                title={`${movie.title} Trailer`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="trailer-iframe"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetail;
