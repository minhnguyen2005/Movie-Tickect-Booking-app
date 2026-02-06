import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../styles/SearchResults.css";
import Loading from "../components/Loading";
import { API_ENDPOINTS } from "../config/api";
import { FaStar } from "react-icons/fa";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theaters, setTheaters] = useState([]);

  const title = searchParams.get("title") || "";
  const genre = searchParams.get("genre") || "";
  const theater = searchParams.get("theater") || "";

  useEffect(() => {
    const fetchTheaters = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.MOVIES.THEATERS);
        const data = await response.json();
        if (data.success) {
          setTheaters(data.data.theaters);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách rạp:", error);
      }
    };

    fetchTheaters();
  }, []);

  useEffect(() => {
    const searchMovies = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (title) params.append("title", title);
        if (genre) params.append("genre", genre);
        if (theater) params.append("theater", theater);

        const response = await fetch(
          `${API_ENDPOINTS.MOVIES.SEARCH}?${params.toString()}`
        );
        const data = await response.json();

        if (data.success) {
          setMovies(data.data.movies);
        }
      } catch (error) {
        console.error("Lỗi khi tìm kiếm phim:", error);
      } finally {
        setLoading(false);
      }
    };

    searchMovies();
  }, [title, genre, theater]);

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
    <div className="search-results-container">
      <div className="search-header">
        <h1>Kết quả tìm kiếm</h1>
        {(title || genre || theater) && (
          <div className="search-filters">
            {title && (
              <span className="filter-tag">
                Tên: <strong>{title}</strong>
                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete("title");
                    navigate(`/search?${newParams.toString()}`);
                  }}
                >
                  ×
                </button>
              </span>
            )}
            {genre && (
              <span className="filter-tag">
                Thể loại: <strong>{genre}</strong>
                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete("genre");
                    navigate(`/search?${newParams.toString()}`);
                  }}
                >
                  ×
                </button>
              </span>
            )}
            {theater && (
              <span className="filter-tag">
                Rạp: <strong>{theater}</strong>
                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete("theater");
                    navigate(`/search?${newParams.toString()}`);
                  }}
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="search-content">
        <div className="search-sidebar">
          <h3>Bộ lọc tìm kiếm</h3>
          <div className="filter-section">
            <label>Tên phim</label>
            <input
              type="text"
              placeholder="Nhập tên phim..."
              value={title}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                if (e.target.value) {
                  newParams.set("title", e.target.value);
                } else {
                  newParams.delete("title");
                }
                navigate(`/search?${newParams.toString()}`);
              }}
            />
          </div>

          <div className="filter-section">
            <label>Thể loại</label>
            <select
              value={genre}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                if (e.target.value) {
                  newParams.set("genre", e.target.value);
                } else {
                  newParams.delete("genre");
                }
                navigate(`/search?${newParams.toString()}`);
              }}
            >
              <option value="">Tất cả thể loại</option>
              <option value="Hành động">Hành động</option>
              <option value="Khoa học viễn tưởng">Khoa học viễn tưởng</option>
              <option value="Hoạt hình">Hoạt hình</option>
              <option value="Hài">Hài</option>
              <option value="Kinh dị">Kinh dị</option>
              <option value="Tình cảm">Tình cảm</option>
              <option value="Chính kịch">Chính kịch</option>
              <option value="Phiêu lưu">Phiêu lưu</option>
              <option value="Bí ẩn">Bí ẩn</option>
              <option value="Tâm lý">Tâm lý</option>
              <option value="Lịch sử">Lịch sử</option>
              <option value="Tiểu sử">Tiểu sử</option>
            </select>
          </div>

          <div className="filter-section">
            <label>Rạp</label>
            <select
              value={theater}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                if (e.target.value) {
                  newParams.set("theater", e.target.value);
                } else {
                  newParams.delete("theater");
                }
                navigate(`/search?${newParams.toString()}`);
              }}
            >
              <option value="">Tất cả rạp</option>
              {theaters.map((theater) => (
                <option key={theater._id} value={theater.name}>
                  {theater.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn-clear-filters"
            onClick={() => navigate("/search")}
          >
            Xóa tất cả bộ lọc
          </button>
        </div>

        <div className="search-results">
          {movies.length > 0 ? (
            <>
              <p className="results-count">
                Tìm thấy {movies.length} phim
              </p>
              <div className="movie-grid">
                {movies.map((movie) => (
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
                      <h3>{movie.title}</h3>
                      <p className="movie-genre-duration">
                        {movie.genre && movie.genre.length > 0
                          ? movie.genre.join(", ")
                          : "N/A"}
                      </p>
                      {movie.rating && (
                        <div className="movie-rating">
                          <FaStar style={{ color: "#ffd700" }} />
                          <span>{movie.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-results">
              <h2>Không tìm thấy phim nào</h2>
              <p>Thử thay đổi bộ lọc tìm kiếm của bạn</p>
              <button
                className="btn-primary"
                onClick={() => navigate("/")}
              >
                Về trang chủ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;

