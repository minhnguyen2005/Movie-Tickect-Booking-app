import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChevronLeft,
  FaChevronRight,
  FaHeart,
  FaInfoCircle,
  FaStar,
  FaTicketAlt,
} from "react-icons/fa";
import { FiClock, FiMapPin } from "react-icons/fi";
import Loading from "../components/Loading";
import { API_ENDPOINTS } from "../config/api";
import { AuthContext } from "../context/AuthContext";
import "../styles/Home.css";

const FALLBACK_POSTER = "https://via.placeholder.com/600x900?text=CinemaHub";

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");

  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Response is not JSON");
  }

  return response.json();
};

const formatDuration = (minutes) => {
  const duration = Number(minutes) || 0;
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }

  return `${mins}m`;
};

const formatYear = (value) => {
  if (!value) {
    return "--";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  return String(parsed.getFullYear());
};

const getAgeTagClass = (ageRating = "K") => {
  const rating = ageRating.toLowerCase();

  if (rating === "t13") {
    return "t13";
  }

  if (rating === "t16") {
    return "t16";
  }

  if (rating === "t18") {
    return "t18";
  }

  return "k";
};

const Home = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const autoPlayIntervalRef = useRef(null);
  const topStripRef = useRef(null);
  const [movies, setMovies] = useState([]);
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroTransitionDirection, setHeroTransitionDirection] = useState("up");
  const [activeTab, setActiveTab] = useState("now-showing");
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState({});
  const heroMovies = (
    featuredMovies.length > 0 ? featuredMovies : movies
  ).slice(0, 5);

  useEffect(() => {
    let isCancelled = false;

    const loadInitialData = async () => {
      setLoading(true);

      try {
        const [moviesData, theatersData, topMoviesData] = await Promise.all([
          fetchJson(`${API_ENDPOINTS.MOVIES.GET_ALL}?isShowing=true`),
          fetchJson(API_ENDPOINTS.MOVIES.THEATERS),
          fetchJson(API_ENDPOINTS.MOVIES.GET_TOP(10)),
        ]);

        if (isCancelled) {
          return;
        }

        const nextMovies = Array.isArray(moviesData?.data?.movies)
          ? moviesData.data.movies
          : [];
        const nextTheaters = Array.isArray(theatersData?.data?.theaters)
          ? theatersData.data.theaters
          : [];
        const nextTopMovies = Array.isArray(topMoviesData?.data?.movies)
          ? topMoviesData.data.movies
          : [];

        setMovies(nextMovies);
        setFeaturedMovies(nextMovies.slice(0, 5));
        setTheaters(nextTheaters);
        setTopMovies(nextTopMovies);
      } catch (error) {
        console.error("Failed to load home page data:", error);

        if (!isCancelled) {
          setMovies([]);
          setFeaturedMovies([]);
          setTheaters([]);
          setTopMovies([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setWishlist([]);
      return;
    }

    let isCancelled = false;

    const fetchWishlist = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          return;
        }

        const data = await fetchJson(API_ENDPOINTS.WISHLIST.GET, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!isCancelled && data.success && data.data?.movies) {
          setWishlist(data.data.movies.map((movie) => movie._id || movie));
        }
      } catch (error) {
        console.error("Failed to load wishlist:", error);
      }
    };

    fetchWishlist();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (currentSlide >= heroMovies.length && heroMovies.length > 0) {
      setCurrentSlide(0);
    }
  }, [currentSlide, heroMovies.length]);

  useEffect(() => {
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
      autoPlayIntervalRef.current = null;
    }

    if (heroMovies.length > 1) {
      autoPlayIntervalRef.current = setInterval(() => {
        setHeroTransitionDirection("up");
        setCurrentSlide((previous) => (previous + 1) % heroMovies.length);
      }, 9000);
    }

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, [heroMovies.length]);

  const isInWishlist = (movieId) => wishlist.includes(movieId);

  const handleToggleWishlist = async (movieId, event) => {
    event.stopPropagation();

    if (!user) {
      alert("Vui long dang nhap de luu phim yeu thich");
      navigate("/login");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Vui long dang nhap de luu phim yeu thich");
      navigate("/login");
      return;
    }

    const isSaved = isInWishlist(movieId);
    setWishlistLoading((current) => ({ ...current, [movieId]: true }));

    try {
      if (isSaved) {
        const response = await fetch(API_ENDPOINTS.WISHLIST.REMOVE(movieId), {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to remove wishlist item");
        }

        setWishlist((current) => current.filter((id) => id !== movieId));
      } else {
        const response = await fetch(API_ENDPOINTS.WISHLIST.ADD, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ movieId }),
        });

        if (!response.ok) {
          throw new Error("Failed to add wishlist item");
        }

        setWishlist((current) => [...current, movieId]);
      }
    } catch (error) {
      console.error("Failed to update wishlist:", error);
      alert("Khong the cap nhat phim yeu thich luc nay");
    } finally {
      setWishlistLoading((current) => ({ ...current, [movieId]: false }));
    }
  };

  const goToSlide = (index) => {
    if (!heroMovies.length) {
      return;
    }

    const totalSlides = heroMovies.length;
    const normalizedIndex = ((index % totalSlides) + totalSlides) % totalSlides;
    const stepForward =
      (normalizedIndex - currentSlide + totalSlides) % totalSlides;
    const stepBackward =
      (currentSlide - normalizedIndex + totalSlides) % totalSlides;

    setHeroTransitionDirection(stepForward <= stepBackward ? "up" : "down");
    setCurrentSlide(normalizedIndex);
  };

  const scrollTopStrip = (direction) => {
    if (!topStripRef.current) {
      return;
    }

    const topStrip = topStripRef.current;
    const topCards = Array.from(topStrip.children);

    if (topCards.length === 0) {
      return;
    }

    const firstCardWidth = topCards[0].getBoundingClientRect().width || 220;
    const stripStyles = window.getComputedStyle(topStrip);
    const gap = Number.parseFloat(
      stripStyles.columnGap || stripStyles.gap || "16",
    );
    const trackStep = firstCardWidth + gap;
    const visibleCards = Math.max(
      1,
      Math.round((topStrip.clientWidth + gap) / trackStep),
    );
    const cardsPerMove = Math.max(1, Math.ceil(visibleCards / 2));
    const currentLeft = topStrip.scrollLeft;
    const currentIndex = topCards.findIndex(
      (card) => card.offsetLeft >= currentLeft - gap / 2,
    );
    const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
    const targetIndex = Math.min(
      Math.max(safeCurrentIndex + direction * cardsPerMove, 0),
      topCards.length - 1,
    );

    topCards[targetIndex].scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
  };

  if (loading) {
    return <Loading />;
  }

  const heroMovie =
    heroMovies.length > 0 ? heroMovies[currentSlide % heroMovies.length] : null;

  const browseSource =
    activeTab === "recommended" && topMovies.length > 0 ? topMovies : movies;
  const browseMovies = [];

  browseSource.forEach((movie) => {
    if (
      browseMovies.length < 8 &&
      !browseMovies.some((entry) => entry._id === movie._id)
    ) {
      browseMovies.push(movie);
    }
  });

  if (browseMovies.length < 8) {
    movies.forEach((movie) => {
      if (
        browseMovies.length < 8 &&
        !browseMovies.some((entry) => entry._id === movie._id)
      ) {
        browseMovies.push(movie);
      }
    });
  }

  const featuredTheaters = theaters.slice(0, 4);

  if (!heroMovie && movies.length === 0) {
    return (
      <div className="home-page">
        <div className="home-shell home-empty-state">
          <h1>Chua co du lieu phim</h1>
          <p>
            Hay kiem tra lai API hoac them du lieu phim de hien thi trang chu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-shell">
        {heroMovie && (
          <section className="home-hero">
            <div className="home-hero-copy">
              <div
                key={`${heroMovie._id || "hero"}-${currentSlide}`}
                className={`home-hero-copy-slide ${heroTransitionDirection}`}
              >
                <span className="home-hero-kicker">
                  {activeTab === "recommended"
                    ? "Tuyen chon noi bat"
                    : "Dang duoc quan tam"}
                </span>

                <h1 className="home-hero-title">{heroMovie.title}</h1>
                <p className="home-hero-subtitle">
                  {heroMovie.description ||
                    "Trai nghiem khong gian dien anh hien dai voi lich chieu cap nhat nhanh va dat ve gon."}
                </p>

                <div className="home-hero-meta">
                  <span className="home-meta-pill imdb">
                    <FaStar />
                    {heroMovie.rating ? heroMovie.rating.toFixed(1) : "7.5"}
                  </span>
                  <span
                    className={`home-meta-pill ${getAgeTagClass(
                      heroMovie.ageRating,
                    )}`}
                  >
                    {heroMovie.ageRating || "K"}
                  </span>
                  <span className="home-meta-pill">
                    <FiClock />
                    {formatDuration(heroMovie.duration)}
                  </span>
                  <span className="home-meta-pill">
                    {formatYear(heroMovie.releaseDate)}
                  </span>
                </div>

                <div className="home-hero-actions">
                  <button
                    type="button"
                    className="home-primary-button"
                    onClick={() => navigate(`/booking/${heroMovie._id}`)}
                  >
                    <FaTicketAlt />
                    Đặt vé ngay
                  </button>

                  <button
                    type="button"
                    className="home-secondary-button"
                    onClick={() => navigate(`/movie/${heroMovie._id}`)}
                  >
                    <FaInfoCircle />
                    Chi tiết phim
                  </button>

                  <button
                    type="button"
                    className={`home-icon-button ${
                      isInWishlist(heroMovie._id) ? "active" : ""
                    }`}
                    onClick={(event) =>
                      handleToggleWishlist(heroMovie._id, event)
                    }
                    disabled={wishlistLoading[heroMovie._id]}
                    aria-label="Luu phim"
                  >
                    <FaHeart />
                  </button>
                </div>
              </div>
            </div>

            <div className="home-hero-showcase">
              <div className="home-hero-poster-stage">
                <div
                  key={`${heroMovie._id || "poster"}-${currentSlide}`}
                  className={`home-hero-poster-slide ${heroTransitionDirection}`}
                >
                  <img
                    src={
                      heroMovie.bannerImage ||
                      heroMovie.poster ||
                      FALLBACK_POSTER
                    }
                    alt={heroMovie.title}
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_POSTER;
                    }}
                  />
                </div>
              </div>

              <div className="home-hero-side">
                <div className="home-hero-rail">
                  {heroMovies.map((movie, index) => (
                    <button
                      key={movie._id}
                      type="button"
                      className={`home-hero-rail-item ${
                        index === currentSlide ? "active" : ""
                      }`}
                      onClick={() => goToSlide(index)}
                    >
                      <img
                        src={movie.poster || FALLBACK_POSTER}
                        alt={movie.title}
                        onError={(event) => {
                          event.currentTarget.src = FALLBACK_POSTER;
                        }}
                      />
                      <span>{movie.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {topMovies.length > 0 && (
          <section className="home-section">
            <div className="home-section-head">
              <div>
                <span className="home-section-kicker">Bảng xếp hạng</span>
                <h2 className="home-section-title">Top 10 phim nổi bật</h2>
              </div>
              <button
                type="button"
                className="home-inline-link"
                onClick={() => navigate("/showtimes")}
              >
                Xem lịch <FaChevronRight />
              </button>
            </div>

            <div className="home-top-strip-shell">
              {topMovies.length > 4 && (
                <button
                  type="button"
                  className="home-top-nav-button left"
                  onClick={() => scrollTopStrip(-1)}
                  aria-label="Cuon sang trai"
                >
                  <FaChevronLeft />
                </button>
              )}

              <div className="home-top-strip" ref={topStripRef}>
                {topMovies.slice(0, 10).map((movie, index) => (
                  <article
                    key={movie._id}
                    className="home-top-card"
                    onClick={() => navigate(`/movie/${movie._id}`)}
                  >
                    <div className="home-top-rank">{index + 1}</div>
                    <div className="home-top-poster">
                      <img
                        src={movie.poster || FALLBACK_POSTER}
                        alt={movie.title}
                        onError={(event) => {
                          event.currentTarget.src = FALLBACK_POSTER;
                        }}
                      />
                    </div>
                    <div className="home-top-copy">
                      <h3>{movie.title}</h3>
                      <div className="home-top-meta">
                        <span>{movie.ageRating || "K"}</span>
                        <span>{formatDuration(movie.duration)}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {topMovies.length > 4 && (
                <button
                  type="button"
                  className="home-top-nav-button right"
                  onClick={() => scrollTopStrip(1)}
                  aria-label="Cuon sang phai"
                >
                  <FaChevronRight />
                </button>
              )}
            </div>
          </section>
        )}

        <section className="home-section">
          <div className="home-section-head">
            <div>
              <span className="home-section-kicker">Thư viện phim</span>
              <h2 className="home-section-title">Không gian khám phá</h2>
            </div>

            <div className="home-tab-group">
              <button
                type="button"
                className={`home-tab ${
                  activeTab === "now-showing" ? "active" : ""
                }`}
                onClick={() => setActiveTab("now-showing")}
              >
                Đang chiếu
              </button>
              <button
                type="button"
                className={`home-tab ${
                  activeTab === "recommended" ? "active" : ""
                }`}
                onClick={() => setActiveTab("recommended")}
              >
                Đề cử
              </button>
            </div>
          </div>

          <div className="home-library-grid">
            {browseMovies.map((movie) => (
              <article
                key={movie._id}
                className="home-library-card"
                onClick={() => navigate(`/movie/${movie._id}`)}
              >
                <div className="home-library-poster">
                  <img
                    src={movie.poster || FALLBACK_POSTER}
                    alt={movie.title}
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_POSTER;
                    }}
                  />

                  <span
                    className={`home-age-pill ${getAgeTagClass(movie.ageRating)}`}
                  >
                    {movie.ageRating || "K"}
                  </span>

                  <button
                    type="button"
                    className={`home-card-favorite ${
                      isInWishlist(movie._id) ? "active" : ""
                    }`}
                    onClick={(event) => handleToggleWishlist(movie._id, event)}
                    disabled={wishlistLoading[movie._id]}
                    aria-label="Luu phim"
                  >
                    <FaHeart />
                  </button>
                </div>

                <div className="home-library-copy">
                  <div className="home-library-meta">
                    <span>
                      <FaStar />
                      {movie.rating ? movie.rating.toFixed(1) : "N/A"}
                    </span>
                    <span>{formatDuration(movie.duration)}</span>
                  </div>
                  <h3>{movie.title}</h3>
                  <p>
                    {Array.isArray(movie.genre) && movie.genre.length > 0
                      ? movie.genre.join(" / ")
                      : "Dang cap nhat the loai"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="home-insight-grid">
          <div className="home-info-panel">
            <span className="home-section-kicker">Thông tin nhanh</span>
            <h2 className="home-section-title">Rạp đang hoạt động</h2>
            <div className="home-theater-list">
              {featuredTheaters.length > 0 ? (
                featuredTheaters.map((theater) => (
                  <div
                    key={theater._id || theater.id}
                    className="home-theater-item"
                  >
                    <div>
                      <h3>{theater.name}</h3>
                      <p>{theater.address}</p>
                    </div>
                    <span>
                      <FiMapPin />
                      {theater.city}
                    </span>
                  </div>
                ))
              ) : (
                <p className="home-muted-copy">
                  Chưa có thông tin rạp để hiển thị.
                </p>
              )}
            </div>
          </div>

          <div className="home-info-panel accent">
            <span className="home-section-kicker">Tổng quan hôm nay</span>
            <h2 className="home-section-title">Thống kê hoạt động</h2>
            <div className="home-stat-grid">
              <div className="home-stat-card">
                <strong>{movies.length}</strong>
                <span>Phim đang chiếu</span>
              </div>
              <div className="home-stat-card">
                <strong>{theaters.length}</strong>
                <span>Rạp hoạt động</span>
              </div>
              <div className="home-stat-card">
                <strong>{topMovies.length}</strong>
                <span>Phim xếp hạng</span>
              </div>
              <div className="home-stat-card">
                <strong>{heroMovies.length}</strong>
                <span>Phim nổi bật</span>
              </div>
            </div>

            <button
              type="button"
              className="home-primary-button full"
              onClick={() => navigate("/showtimes")}
            >
              Xem toàn bộ lịch chiếu
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
