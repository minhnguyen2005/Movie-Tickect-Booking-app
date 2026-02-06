import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import Loading from "../components/Loading";
import { API_ENDPOINTS } from "../config/api";
import {
  FaTicketAlt,
  FaChevronRight,
  FaHeart,
  FaInfoCircle,
} from "react-icons/fa";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const autoPlayIntervalRef = useRef(null);
  const [theaters, setTheaters] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState("");
  const [selectedTheater, setSelectedTheater] = useState("");
  const [activeTab, setActiveTab] = useState("now-showing");
  const [topMovies, setTopMovies] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState({});

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch(
          `${API_ENDPOINTS.MOVIES.GET_ALL}?isShowing=true`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Kiểm tra content-type trước khi parse JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Response is not JSON");
        }

        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error("Lỗi khi parse JSON:", jsonError);
          throw new Error("Invalid JSON response");
        }

        if (
          data &&
          data.success &&
          data.data &&
          Array.isArray(data.data.movies)
        ) {
          const moviesList = data.data.movies;
          setMovies(moviesList);
          // Lấy 5 phim đầu tiên làm featured movies cho slider
          if (moviesList.length > 0) {
            const featured = moviesList.slice(0, 5);
            setFeaturedMovies(featured);
            console.log("Featured movies set:", featured.length);
          } else {
            setFeaturedMovies([]);
          }
        } else {
          setMovies([]);
          setFeaturedMovies([]);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách phim:", error);
        setMovies([]);
        setFeaturedMovies([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchTheaters = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.MOVIES.THEATERS);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Kiểm tra content-type trước khi parse JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Response is not JSON");
        }

        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error("Lỗi khi parse JSON:", jsonError);
          throw new Error("Invalid JSON response");
        }

        if (
          data &&
          data.success &&
          data.data &&
          Array.isArray(data.data.theaters)
        ) {
          setTheaters(data.data.theaters);
        } else {
          setTheaters([]);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách rạp:", error);
        setTheaters([]);
      }
    };

    fetchMovies();
    fetchTheaters();
  }, []);

  // Fetch top movies
  useEffect(() => {
    const fetchTopMovies = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.MOVIES.GET_TOP(10));
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Response is not JSON");
        }

        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error("Lỗi khi parse JSON:", jsonError);
          throw new Error("Invalid JSON response");
        }

        if (
          data &&
          data.success &&
          data.data &&
          Array.isArray(data.data.movies)
        ) {
          setTopMovies(data.data.movies);
        } else {
          setTopMovies([]);
        }
      } catch (error) {
        console.error("Lỗi khi tải top phim:", error);
        setTopMovies([]);
      }
    };

    fetchTopMovies();
  }, []);

  // Auto-play slider
  useEffect(() => {
    // Clear existing interval
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
    }

    if (featuredMovies.length > 1) {
      autoPlayIntervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % featuredMovies.length);
      }, 15000); // Chuyển slide mỗi 5 giây
    }

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, [featuredMovies.length]);

  const goToSlide = (index) => {
    // Dừng auto-play khi user click
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
      autoPlayIntervalRef.current = null;
    }

    // Set slide mới
    setCurrentSlide(index);

    // Resume auto-play sau 8 giây
    setTimeout(() => {
      if (featuredMovies.length > 1) {
        autoPlayIntervalRef.current = setInterval(() => {
          setCurrentSlide((prev) => (prev + 1) % featuredMovies.length);
        }, 15000);
      }
    }, 15000);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredMovies.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length
    );
  };

  const handleQuickSearch = () => {
    const params = new URLSearchParams();
    if (selectedMovie) params.append("title", selectedMovie);
    if (selectedTheater) params.append("theater", selectedTheater);
    navigate(`/search?${params.toString()}`);
  };

  // Fetch wishlist
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) {
        setWishlist([]);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(API_ENDPOINTS.WISHLIST.GET, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.movies) {
            setWishlist(data.data.movies.map((m) => m._id || m));
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải wishlist:", error);
      }
    };

    fetchWishlist();
  }, [user]);

  const isInWishlist = (movieId) => {
    return wishlist.includes(movieId);
  };

  const handleToggleWishlist = async (movieId, e) => {
    e.stopPropagation();

    if (!user) {
      alert("Vui lòng đăng nhập để lưu phim yêu thích");
      navigate("/login");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Vui lòng đăng nhập để lưu phim yêu thích");
      navigate("/login");
      return;
    }

    const isCurrentlyInWishlist = isInWishlist(movieId);
    setWishlistLoading((prev) => ({ ...prev, [movieId]: true }));

    try {
      if (!isCurrentlyInWishlist) {
        // Thêm vào wishlist
        const response = await fetch(API_ENDPOINTS.WISHLIST.ADD, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ movieId }),
        });

        if (response.ok) {
          setWishlist((prev) => [...prev, movieId]);
        } else {
          const data = await response.json();
          alert(data.message || "Không thể thêm vào yêu thích");
        }
      } else {
        // Xóa khỏi wishlist
        const response = await fetch(API_ENDPOINTS.WISHLIST.REMOVE(movieId), {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setWishlist((prev) => prev.filter((id) => id !== movieId));
        } else {
          const data = await response.json();
          alert(data.message || "Không thể xóa khỏi yêu thích");
        }
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật wishlist:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setWishlistLoading((prev) => ({ ...prev, [movieId]: false }));
    }
  };

  const getAgeTagClass = (ageRating) => {
    const rating = ageRating.toLowerCase();
    if (rating === "k") return "k";
    if (rating === "t13") return "t13";
    if (rating === "t16") return "t16";
    if (rating === "t18") return "t18";
    return "k";
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="home-container">
      {/* Hero Banner Slider */}
      {featuredMovies.length > 0 && (
        <div className="hero-slider">
          <div className="hero-slides-container">
            <div
              className="hero-slides"
              style={{
                transform: `translateX(-${currentSlide * 100}%)`,
              }}
            >
              {featuredMovies.map((movie) => {
                const formatDuration = (minutes) => {
                  const hours = Math.floor(minutes / 60);
                  const mins = minutes % 60;
                  if (hours > 0) {
                    return `${hours}h ${mins}m`;
                  }
                  return `${mins}m`;
                };
                return (
                  <div
                    key={movie._id}
                    className="hero-slide"
                    style={{
                      background: "var(--bg-dark)",
                    }}
                  >
                    <div className="hero-slide-content">
                      <div className="hero-left">
                        <h1 className="hero-title-large">
                          {movie.title.toUpperCase()}
                        </h1>
                        <p className="hero-title-original">{movie.title}</p>

                        <div className="hero-meta-tags">
                          <span className="meta-tag imdb">
                            IMDb{" "}
                            {movie.rating ? movie.rating.toFixed(1) : "7.4"}
                          </span>
                          <span
                            className={`meta-tag rating ${getAgeTagClass(
                              movie.ageRating
                            )}`}
                          >
                            {movie.ageRating || "T13"}
                          </span>
                          <span className="meta-tag year">
                            {new Date(movie.releaseDate).getFullYear()}
                          </span>
                          <span className="meta-tag duration">
                            {movie.duration
                              ? formatDuration(movie.duration)
                              : "2h 0m"}
                          </span>
                        </div>

                        <div className="hero-genres">
                          {movie.genre &&
                            movie.genre.slice(0, 6).map((genre, idx) => (
                              <span key={idx} className="genre-tag">
                                {genre}
                              </span>
                            ))}
                        </div>

                        <p className="hero-description">{movie.description}</p>

                        <div className="hero-action-buttons">
                          <button
                            className="btn-play-large"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/booking/${movie._id}`);
                            }}
                          >
                            <FaTicketAlt />
                            <span>Đặt vé</span>
                          </button>
                          <button
                            className={`btn-heart ${
                              isInWishlist(movie._id) ? "active" : ""
                            }`}
                            onClick={(e) => handleToggleWishlist(movie._id, e)}
                            disabled={wishlistLoading[movie._id]}
                            title={
                              isInWishlist(movie._id)
                                ? "Bỏ yêu thích"
                                : "Thêm vào yêu thích"
                            }
                          >
                            <FaHeart />
                          </button>
                          <button
                            className="btn-info"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/movie/${movie._id}`);
                            }}
                          >
                            <FaInfoCircle />
                          </button>
                        </div>
                      </div>

                      <div className="hero-right">
                        <div className="hero-poster-large">
                          <img
                            src={movie.bannerImage || movie.poster}
                            alt={movie.title}
                            onError={(e) => {
                              e.target.src =
                                "https://via.placeholder.com/800x1200?text=Movie+Banner";
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Thumbnail Navigation */}
          {featuredMovies.length > 1 && (
            <div className="hero-thumbnails-container">
              <div className="hero-thumbnails">
                {featuredMovies.map((movie, index) => (
                  <div
                    key={movie._id}
                    className={`hero-thumbnail ${
                      index === currentSlide ? "active" : ""
                    }`}
                    onClick={() => goToSlide(index)}
                  >
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/200x300?text=Poster";
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Movies Section */}
      {topMovies.length > 0 && (
        <section className="top-movies-section">
          <div className="section-header-left">
            <h2 className="section-title">Top 10 phim lẻ hôm nay</h2>
          </div>
          <div className="top-movies-grid">
            {topMovies.slice(0, 10).map((movie, index) => {
              const formatDuration = (minutes) => {
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                if (hours > 0) {
                  return `${hours}h ${mins}m`;
                }
                return `${mins}m`;
              };
              return (
                <div
                  key={movie._id}
                  className="top-movie-card"
                  onClick={() => navigate(`/movie/${movie._id}`)}
                >
                  <div className="top-movie-poster">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/300x450?text=Movie+Poster";
                      }}
                    />
                    <span
                      className={`top-movie-age-tag ${getAgeTagClass(
                        movie.ageRating
                      )}`}
                    >
                      {movie.ageRating || "K"}
                    </span>
                  </div>
                  <div className="top-movie-content">
                    <div className="top-movie-rank">{index + 1}</div>
                    <h3 className="top-movie-title-vi">{movie.title}</h3>
                    <p className="top-movie-title-en">
                      {movie.genre && movie.genre.length > 0
                        ? movie.genre[0]
                        : movie.title}
                    </p>
                    <div className="top-movie-details">
                      <span className="top-movie-rating">
                        {movie.ageRating || "K"}
                      </span>
                      <span className="top-movie-year">
                        {new Date(movie.releaseDate).getFullYear()}
                      </span>
                      <span className="top-movie-duration">
                        {formatDuration(movie.duration)}
                      </span>
                    </div>
                    <div className="top-movie-labels">
                      <span className="label-pde">P.Đề</span>
                      {movie.rating > 8 && (
                        <span className="label-tminh">T.Minh</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Movie List */}
      <section className="section-movies">
        <div className="section-header-with-nav">
          <div className="section-header-left">
            <h2 className="section-title">Phim Điện Ảnh Mới Coóng</h2>
            <a href="#" className="view-all-link">
              Xem toàn bộ &rarr;
            </a>
          </div>
          <button
            className="carousel-nav-btn"
            onClick={() => {
              const grid = document.querySelector(".movie-grid");
              if (grid) {
                grid.scrollBy({ left: 300, behavior: "smooth" });
              }
            }}
          >
            <FaChevronRight />
          </button>
        </div>

        <div className="movie-grid">
          {movies.length > 0 ? (
            movies.map((movie) => (
              <div
                key={movie._id}
                className="movie-card"
                onClick={() => navigate(`/movie/${movie._id}`)}
              >
                <div className="poster-wrapper">
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/300x450?text=Movie+Poster";
                    }}
                  />
                  <span
                    className={`age-tag ${getAgeTagClass(movie.ageRating)}`}
                  >
                    {movie.ageRating}
                  </span>
                </div>
                <div className="movie-card-content">
                  <div className="movie-labels">
                    <span className="label-pde">P.Đề</span>
                    {movie.rating > 8 && (
                      <span className="label-tminh">T.Minh</span>
                    )}
                  </div>
                  <h3 className="movie-title-vi">{movie.title}</h3>
                  {movie.genre && movie.genre.length > 0 && (
                    <p className="movie-title-en">{movie.genre[0]}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p
              style={{
                color: "#b3b3b3",
                gridColumn: "1 / -1",
                textAlign: "center",
              }}
            >
              Chưa có phim nào đang chiếu
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
