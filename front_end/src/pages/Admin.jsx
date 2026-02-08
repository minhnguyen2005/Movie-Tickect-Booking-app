import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { API_ENDPOINTS } from "../config/api";
import {
  FaChartBar,
  FaFilm,
  FaTheaterMasks,
  FaCommentDots,
  FaChartLine,
  FaUserCircle,
  FaSignOutAlt,
  FaBell,
  FaCog,
} from "react-icons/fa";
import "../styles/Admin.css";

const Admin = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [movies, setMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [savingMovie, setSavingMovie] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [movieForm, setMovieForm] = useState({
    title: "",
    description: "",
    duration: 120,
    release_date: "",
    age_rating: "K",
    poster_url: "",
    banner_url: "",
    trailer_url: "",
    is_showing: 1,
  });

  // Showtimes state
  const [showtimes, setShowtimes] = useState([]);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);
  const [savingShowtime, setSavingShowtime] = useState(false);
  const [editingShowtimeId, setEditingShowtimeId] = useState(null);
  const [showtimeForm, setShowtimeForm] = useState({
    movie_id: "",
    theater_id: "",
    show_date: "",
    show_time: "",
    price: 0,
    total_seats: 100,
    is_active: 1,
  });
  const [theaters, setTheaters] = useState([]);
  const [theaterRevenue, setTheaterRevenue] = useState([]);
  const ticketSummary = showtimes.reduce(
    (acc, st) => {
      const movieId = st.movie_id ?? st.movieId ?? st.movie?.id;
      const totalSeats = Number(st.total_seats) || 0;
      const availableSeats =
        st.available_seats !== undefined
          ? Number(st.available_seats)
          : totalSeats;
      const soldSeats = Math.max(totalSeats - availableSeats, 0);
      const price = Number(st.price) || 0;
      if (movieId !== undefined && movieId !== null) {
        acc.byMovie[movieId] = (acc.byMovie[movieId] || 0) + soldSeats;
      }
      acc.totalTickets += soldSeats;
      acc.totalRevenue += soldSeats * price;
      return acc;
    },
    { totalRevenue: 0, totalTickets: 0, byMovie: {} },
  );

  const stats = {
    totalRevenue: ticketSummary.totalRevenue,
    totalTickets: ticketSummary.totalTickets,
    totalMovies: movies.length,
  };

  const ticketsSoldByMovie = ticketSummary.byMovie;

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "admin") {
      navigate("/");
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchTheaters();
      fetchShowtimes();
      fetchMovies();
    } else if (activeTab === "movies") {
      fetchMovies();
    } else if (activeTab === "showtimes") {
      fetchShowtimes();
      fetchMovies();
      fetchTheaters();
    } else if (activeTab === "theaters") {
      fetchTheaters();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "dashboard") return;
    if (!Array.isArray(showtimes) || showtimes.length === 0) {
      setTheaterRevenue([]);
      return;
    }
    const theaterById = new Map(
      theaters.map((theater) => [String(theater.id), theater.name]),
    );
    const revenueMap = new Map();

    showtimes.forEach((st) => {
      const theaterId = st.theater_id ?? st.theaterId ?? st.theater?.id;
      const theaterName =
        st.theater_name ||
        st.theaterName ||
        (theaterId !== undefined ? theaterById.get(String(theaterId)) : null) ||
        "R?p ch?a x?c ??nh";
      const price = Number(st.price) || 0;
      const totalSeats = Number(st.total_seats) || 0;
      const availableSeats =
        st.available_seats !== undefined
          ? Number(st.available_seats)
          : totalSeats;
      const soldSeats = Math.max(totalSeats - availableSeats, 0);
      const revenue = soldSeats * price;
      revenueMap.set(theaterName, (revenueMap.get(theaterName) || 0) + revenue);
    });

    const data = Array.from(revenueMap.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
    setTheaterRevenue(data);
  }, [activeTab, showtimes, theaters]);

  const fetchMovies = async () => {
    try {
      setLoadingMovies(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không có token, vui lòng đăng nhập");
      }
      const response = await fetch(API_ENDPOINTS.ADMIN.MOVIES.LIST, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setMovies(data.data);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách phim (admin):", error);
    } finally {
      setLoadingMovies(false);
    }
  };

  const handleMovieInputChange = (e) => {
    const { name, value } = e.target;
    setMovieForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetMovieForm = () => {
    setEditingMovieId(null);
    setMovieForm({
      title: "",
      description: "",
      duration: 120,
      release_date: "",
      age_rating: "K",
      poster_url: "",
      banner_url: "",
      trailer_url: "",
      is_showing: 1,
    });
  };

  const handleEditMovie = (movie) => {
    setEditingMovieId(movie.id);
    setMovieForm({
      title: movie.title || "",
      description: movie.description || "",
      duration: movie.duration || 120,
      release_date: movie.release_date ? movie.release_date.slice(0, 10) : "",
      age_rating: movie.age_rating || "K",
      poster_url: movie.poster_url || "",
      banner_url: movie.banner_url || "",
      trailer_url: movie.trailer_url || "",
      is_showing: movie.is_showing ?? 1,
    });
    setActiveTab("movies");
  };

  const handleSubmitMovie = async (e) => {
    e.preventDefault();
    setSavingMovie(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không có token, vui lòng đăng nhập");
      }

      const payload = {
        ...movieForm,
        duration: Number(movieForm.duration) || 0,
        is_showing: Number(movieForm.is_showing) ? 1 : 0,
      };

      const url = editingMovieId
        ? API_ENDPOINTS.ADMIN.MOVIES.UPDATE(editingMovieId)
        : API_ENDPOINTS.ADMIN.MOVIES.CREATE;
      const method = editingMovieId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Lỗi khi lưu phim");
      }

      await fetchMovies();
      resetMovieForm();
    } catch (error) {
      console.error("Lỗi khi lưu phim:", error);
      alert(error.message || "Có lỗi xảy ra khi lưu phim");
    } finally {
      setSavingMovie(false);
    }
  };

  const handleDeleteMovie = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa phim này?")) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không có token, vui lòng đăng nhập");
      }
      const response = await fetch(API_ENDPOINTS.ADMIN.MOVIES.DELETE(id), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Lỗi khi xóa phim");
      }
      await fetchMovies();
    } catch (error) {
      console.error("Lỗi khi xóa phim:", error);
      alert(error.message || "Có lỗi xảy ra khi xóa phim");
    }
  };

  // Showtimes functions
  const fetchShowtimes = async () => {
    try {
      setLoadingShowtimes(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không có token, vui lòng đăng nhập");
      }
      const response = await fetch(API_ENDPOINTS.ADMIN.SHOWTIMES.LIST, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setShowtimes(data.data);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách lịch chiếu:", error);
    } finally {
      setLoadingShowtimes(false);
    }
  };

  const fetchTheaters = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không có token, vui lòng đăng nhập");
      }
      const response = await fetch(API_ENDPOINTS.ADMIN.THEATERS.LIST, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setTheaters(data.data);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách rạp:", error);
    }
  };

  const handleShowtimeInputChange = (e) => {
    const { name, value } = e.target;
    setShowtimeForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetShowtimeForm = () => {
    setEditingShowtimeId(null);
    setShowtimeForm({
      movie_id: "",
      theater_id: "",
      show_date: "",
      show_time: "",
      price: 0,
      total_seats: 100,
      is_active: 1,
    });
  };

  const handleEditShowtime = (showtime) => {
    setEditingShowtimeId(showtime.id);
    setShowtimeForm({
      movie_id: showtime.movie_id || "",
      theater_id: showtime.theater_id || "",
      show_date: showtime.show_date ? showtime.show_date.slice(0, 10) : "",
      show_time: showtime.show_time || "",
      price: showtime.price || 0,
      total_seats: showtime.total_seats || 100,
      is_active: showtime.is_active ?? 1,
    });
    setActiveTab("showtimes");
  };

  const handleSubmitShowtime = async (e) => {
    e.preventDefault();
    setSavingShowtime(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không có token, vui lòng đăng nhập");
      }

      const payload = {
        ...showtimeForm,
        movie_id: Number(showtimeForm.movie_id) || 0,
        theater_id: Number(showtimeForm.theater_id) || 0,
        price: Number(showtimeForm.price) || 0,
        total_seats: Number(showtimeForm.total_seats) || 100,
        is_active: Number(showtimeForm.is_active) ? 1 : 0,
      };

      const url = editingShowtimeId
        ? API_ENDPOINTS.ADMIN.SHOWTIMES.UPDATE(editingShowtimeId)
        : API_ENDPOINTS.ADMIN.SHOWTIMES.CREATE;
      const method = editingShowtimeId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Lỗi khi lưu lịch chiếu");
      }

      await fetchShowtimes();
      resetShowtimeForm();
    } catch (error) {
      console.error("Lỗi khi lưu lịch chiếu:", error);
      alert(error.message || "Có lỗi xảy ra khi lưu lịch chiếu");
    } finally {
      setSavingShowtime(false);
    }
  };

  const handleDeleteShowtime = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa lịch chiếu này?")) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không có token, vui lòng đăng nhập");
      }
      const response = await fetch(API_ENDPOINTS.ADMIN.SHOWTIMES.DELETE(id), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Lỗi khi xóa lịch chiếu");
      }
      await fetchShowtimes();
    } catch (error) {
      console.error("Lỗi khi xóa lịch chiếu:", error);
      alert(error.message || "Có lỗi xảy ra khi xóa lịch chiếu");
    }
  };

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="admin-layout">
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <div className="admin-logo-main">
            <span className="admin-logo-icon">
              <FaFilm />
            </span>
            <div className="admin-logo-text">
              <span className="logo-title">CinemaHub</span>
              <span className="logo-badge">Admin</span>
            </div>
          </div>
          <div className="admin-search">
            <input placeholder="Tìm kiếm dữ liệu, phim, rạp..." />
          </div>
        </div>
        <div className="admin-topbar-right">
          <button
            type="button"
            className="topbar-icon-btn"
            aria-label="Thông báo"
          >
            <FaBell />
          </button>
          <button
            type="button"
            className="topbar-icon-btn"
            aria-label="Cài đặt"
          >
            <FaCog />
          </button>
          <div className="topbar-avatar">
            <span>
              {user.fullName
                ? user.fullName.charAt(0).toUpperCase()
                : user.email.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      <div className="admin-body">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <div className="admin-sidebar-title">DASHBOARD</div>
            <div className="admin-sidebar-subtitle">Hệ thống</div>
          </div>
          <nav className="admin-sidebar-nav">
            <div className="nav-section-title">HỆ THỐNG</div>
            <button
              className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              <FaChartBar />
              <span>Tổng quan</span>
            </button>
            <button className="nav-item" onClick={() => navigate("/")}>
              <FaFilm />
              <span>Home</span>
            </button>
            <button
              className={`nav-item ${activeTab === "movies" ? "active" : ""}`}
              onClick={() => setActiveTab("movies")}
            >
              <FaFilm />
              <span>Quản lý phim</span>
            </button>
            <button
              className={`nav-item ${activeTab === "showtimes" ? "active" : ""}`}
              onClick={() => setActiveTab("showtimes")}
            >
              <FaChartLine />
              <span>Lịch chiếu</span>
            </button>
            <button
              className={`nav-item ${activeTab === "theaters" ? "active" : ""}`}
              onClick={() => setActiveTab("theaters")}
            >
              <FaTheaterMasks />
              <span>Quản lý rạp</span>
            </button>

            <div className="nav-section-title">BÁO CÁO</div>
            <button
              className={`nav-item ${activeTab === "feedback" ? "active" : ""}`}
              onClick={() => setActiveTab("feedback")}
            >
              <FaCommentDots />
              <span>Feedback</span>
            </button>
          </nav>

          <div className="admin-sidebar-footer">
            <div className="admin-current-user">
              <FaUserCircle className="admin-user-avatar" />
              <div>
                <div className="admin-user-name">
                  {user.fullName || "Admin"}
                </div>
                <div className="admin-user-role">Quản trị viên</div>
              </div>
            </div>
            <button
              className="nav-item logout"
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/login");
              }}
            >
              <FaSignOutAlt />
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        <div className="admin-main">
          <div className="admin-page">
            <div className="admin-header">
              <div className="admin-header-left">
                <h1>Tổng quan hệ thống</h1>
                <p>Theo dõi hiệu suất rạp chiếu phim trong thời gian thực.</p>
              </div>
              <div className="admin-header-actions">
                <button className="topbar-button">7 ngày qua</button>
                <button className="topbar-button primary">Xuất báo cáo</button>
              </div>
            </div>

            {/* Dashboard stats */}
            <div className="admin-stats">
              <div className="admin-stat-card primary">
                <div className="stat-title">Tổng doanh thu</div>
                <div className="stat-value">
                  {stats.totalRevenue.toLocaleString("vi-VN")}đ
                </div>
                <div className="stat-sub">T?ng doanh thu t? v? ?? b?n</div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-title">Vé đã bán</div>
                <div className="stat-value">
                  {stats.totalTickets.toLocaleString("vi-VN")}
                </div>
                <div className="stat-sub">Tổng vé đã thanh toán</div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-title">Số phim</div>
                <div className="stat-value">
                  {movies.length.toLocaleString("vi-VN")}
                </div>
                <div className="stat-sub">Phim trong hệ thống</div>
              </div>
            </div>

            {/* Tab content */}
            <div className="admin-tab-content">
              {activeTab === "dashboard" && (
                <div className="admin-dashboard-grid">
                  <div className="admin-card large">
                    <div className="admin-card-header">
                      <h2>Doanh thu theo rạp</h2>
                      <span className="badge-muted">
                        Tổng hợp theo ghế đã bán
                      </span>
                    </div>
                    <div className="admin-revenue-chart">
                      {theaterRevenue.length > 0 ? (
                        <div className="admin-bar-chart">
                          {theaterRevenue.map((item) => {
                            const maxRevenue = theaterRevenue[0]?.revenue || 1;
                            const width = Math.max(
                              6,
                              Math.round((item.revenue / maxRevenue) * 100),
                            );
                            return (
                              <div className="bar-item" key={item.name}>
                                <div className="bar-label">{item.name}</div>
                                <div className="bar-track">
                                  <div
                                    className="bar-fill"
                                    style={{ width: `${width}%` }}
                                  />
                                </div>
                                <div className="bar-value">
                                  {item.revenue.toLocaleString("vi-VN")}đ
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="admin-chart-empty">
                          Chưa có dữ liệu doanh thu theo rạp.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="admin-card">
                    <div className="admin-card-header">
                      <h2>Phim ăn khách</h2>
                      <span className="badge-muted">
                        Theo số lượng vé đã bán
                      </span>
                    </div>
                    <ul className="admin-top-movies">
                      {movies.slice(0, 5).map((m, index) => (
                        <li key={m.id || index} className="top-movie-item">
                          <div className="top-movie-info">
                            <span className="top-movie-rank">#{index + 1}</span>
                            <span className="top-movie-title">{m.title}</span>
                            <span className="top-movie-sold">
                              {" "}
                              {(ticketsSoldByMovie[m.id] || 0).toLocaleString(
                                "vi-VN",
                              )}{" "}
                              vé
                            </span>
                          </div>
                          <span className="top-movie-meta">
                            {m.duration || 120} phút •{" "}
                            {m.release_date
                              ? new Date(m.release_date).toLocaleDateString(
                                  "vi-VN",
                                )
                              : "Chưa có ngày"}
                          </span>
                        </li>
                      ))}
                      {movies.length === 0 && (
                        <li className="top-movie-empty">
                          Chưa có dữ liệu phim. Hãy thêm phim ở tab Quản lý
                          phim.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "movies" && (
                <div className="admin-movies">
                  <div className="admin-movies-layout">
                    <form className="movie-form" onSubmit={handleSubmitMovie}>
                      <h2>{editingMovieId ? "Sửa phim" : "Thêm phim mới"}</h2>
                      <label>
                        Tên phim
                        <input
                          type="text"
                          name="title"
                          value={movieForm.title}
                          onChange={handleMovieInputChange}
                          required
                        />
                      </label>
                      <label>
                        Mô tả
                        <textarea
                          name="description"
                          value={movieForm.description}
                          onChange={handleMovieInputChange}
                          rows={4}
                          required
                        />
                      </label>
                      <div className="form-row">
                        <label>
                          Thời lượng (phút)
                          <input
                            type="number"
                            name="duration"
                            value={movieForm.duration}
                            onChange={handleMovieInputChange}
                            min={1}
                            required
                          />
                        </label>
                        <label>
                          Ngày khởi chiếu
                          <input
                            type="date"
                            name="release_date"
                            value={movieForm.release_date}
                            onChange={handleMovieInputChange}
                            required
                          />
                        </label>
                      </div>
                      <div className="form-row">
                        <label>
                          Giới hạn tuổi
                          <select
                            name="age_rating"
                            value={movieForm.age_rating}
                            onChange={handleMovieInputChange}
                          >
                            <option value="K">K</option>
                            <option value="T13">T13</option>
                            <option value="T16">T16</option>
                            <option value="T18">T18</option>
                          </select>
                        </label>
                        <label>
                          Đang chiếu
                          <select
                            name="is_showing"
                            value={movieForm.is_showing}
                            onChange={handleMovieInputChange}
                          >
                            <option value={1}>Có</option>
                            <option value={0}>Không</option>
                          </select>
                        </label>
                      </div>
                      <label>
                        Poster URL
                        <input
                          type="text"
                          name="poster_url"
                          value={movieForm.poster_url}
                          onChange={handleMovieInputChange}
                        />
                      </label>
                      <label>
                        Banner URL
                        <input
                          type="text"
                          name="banner_url"
                          value={movieForm.banner_url}
                          onChange={handleMovieInputChange}
                        />
                      </label>
                      <label>
                        Trailer URL
                        <input
                          type="text"
                          name="trailer_url"
                          value={movieForm.trailer_url}
                          onChange={handleMovieInputChange}
                        />
                      </label>

                      <div className="movie-form-actions">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={resetMovieForm}
                          disabled={savingMovie}
                        >
                          Làm mới
                        </button>
                        <button
                          type="submit"
                          className="btn-primary"
                          disabled={savingMovie}
                        >
                          {savingMovie
                            ? "Đang lưu..."
                            : editingMovieId
                              ? "Cập nhật phim"
                              : "Thêm phim"}
                        </button>
                      </div>
                    </form>

                    <div className="movie-list">
                      <h2>Danh sách phim trong hệ thống</h2>
                      {loadingMovies ? (
                        <p>Đang tải...</p>
                      ) : movies.length === 0 ? (
                        <p>Chưa có phim nào trong hệ thống.</p>
                      ) : (
                        <table>
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Tên phim</th>
                              <th>Khởi chiếu</th>
                              <th>Thời lượng</th>
                              <th>Đang chiếu</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {movies.map((m) => (
                              <tr key={m.id}>
                                <td>{m.id}</td>
                                <td>{m.title}</td>
                                <td>
                                  {m.release_date
                                    ? new Date(
                                        m.release_date,
                                      ).toLocaleDateString("vi-VN")
                                    : "-"}
                                </td>
                                <td>{m.duration} phút</td>
                                <td>{m.is_showing ? "Có" : "Không"}</td>
                                <td>
                                  <button
                                    className="btn-link"
                                    onClick={() => handleEditMovie(m)}
                                  >
                                    Sửa
                                  </button>
                                  <button
                                    className="btn-link danger"
                                    onClick={() => handleDeleteMovie(m.id)}
                                  >
                                    Xóa
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "theaters" && (
                <div>
                  <p>
                    Tab quản lý rạp sẽ dùng các endpoint `/api/admin/theaters`.
                    Có thể thêm form và bảng tương tự Movies.
                  </p>
                </div>
              )}

              {activeTab === "showtimes" && (
                <div className="admin-showtimes">
                  <div className="admin-showtimes-layout">
                    <form
                      className="showtime-form"
                      onSubmit={handleSubmitShowtime}
                    >
                      <h2>
                        {editingShowtimeId
                          ? "Sửa lịch chiếu"
                          : "Thêm lịch chiếu mới"}
                      </h2>
                      <label>
                        Phim
                        <select
                          name="movie_id"
                          value={showtimeForm.movie_id}
                          onChange={handleShowtimeInputChange}
                          required
                        >
                          <option value="">-- Chọn phim --</option>
                          {movies.map((movie) => (
                            <option key={movie.id} value={movie.id}>
                              {movie.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Rạp chiếu
                        <select
                          name="theater_id"
                          value={showtimeForm.theater_id}
                          onChange={handleShowtimeInputChange}
                          required
                        >
                          <option value="">-- Chọn rạp --</option>
                          {theaters.map((theater) => (
                            <option key={theater.id} value={theater.id}>
                              {theater.name} - {theater.address}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="form-row">
                        <label>
                          Ngày chiếu
                          <input
                            type="date"
                            name="show_date"
                            value={showtimeForm.show_date}
                            onChange={handleShowtimeInputChange}
                            required
                          />
                        </label>
                        <label>
                          Giờ chiếu
                          <input
                            type="time"
                            name="show_time"
                            value={showtimeForm.show_time}
                            onChange={handleShowtimeInputChange}
                            required
                          />
                        </label>
                      </div>
                      <div className="form-row">
                        <label>
                          Giá vé (VNĐ)
                          <input
                            type="number"
                            name="price"
                            value={showtimeForm.price}
                            onChange={handleShowtimeInputChange}
                            min={0}
                            required
                          />
                        </label>
                        <label>
                          Tổng số ghế
                          <input
                            type="number"
                            name="total_seats"
                            value={showtimeForm.total_seats}
                            onChange={handleShowtimeInputChange}
                            min={1}
                            required
                          />
                        </label>
                      </div>
                      <label>
                        Trạng thái
                        <select
                          name="is_active"
                          value={showtimeForm.is_active}
                          onChange={handleShowtimeInputChange}
                        >
                          <option value={1}>Hoạt động</option>
                          <option value={0}>Tạm ngưng</option>
                        </select>
                      </label>

                      <div className="showtime-form-actions">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={resetShowtimeForm}
                          disabled={savingShowtime}
                        >
                          Làm mới
                        </button>
                        <button
                          type="submit"
                          className="btn-primary"
                          disabled={savingShowtime}
                        >
                          {savingShowtime
                            ? "Đang lưu..."
                            : editingShowtimeId
                              ? "Cập nhật lịch chiếu"
                              : "Thêm lịch chiếu"}
                        </button>
                      </div>
                    </form>

                    <div className="showtime-list">
                      <h2>Danh sách lịch chiếu</h2>
                      {loadingShowtimes ? (
                        <p>Đang tải...</p>
                      ) : showtimes.length === 0 ? (
                        <p>Chưa có lịch chiếu nào trong hệ thống.</p>
                      ) : (
                        <table>
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Phim</th>
                              <th>Rạp</th>
                              <th>Ngày</th>
                              <th>Giờ</th>
                              <th>Giá</th>
                              <th>Ghế trống</th>
                              <th>Trạng thái</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {showtimes.map((st) => (
                              <tr key={st.id}>
                                <td>{st.id}</td>
                                <td>{st.movie_title || "-"}</td>
                                <td>{st.theater_name || "-"}</td>
                                <td>
                                  {st.show_date
                                    ? new Date(st.show_date).toLocaleDateString(
                                        "vi-VN",
                                      )
                                    : "-"}
                                </td>
                                <td>{st.show_time || "-"}</td>
                                <td>
                                  {st.price
                                    ? st.price.toLocaleString("vi-VN") + "đ"
                                    : "-"}
                                </td>
                                <td>
                                  {st.available_seats !== undefined
                                    ? `${st.available_seats}/${st.total_seats || 0}`
                                    : "-"}
                                </td>
                                <td>
                                  {st.is_active ? "Hoạt động" : "Tạm ngưng"}
                                </td>
                                <td>
                                  <button
                                    className="btn-link"
                                    onClick={() => handleEditShowtime(st)}
                                  >
                                    Sửa
                                  </button>
                                  <button
                                    className="btn-link danger"
                                    onClick={() => handleDeleteShowtime(st.id)}
                                  >
                                    Xóa
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "feedback" && (
                <div>
                  <p>
                    Tab Feedback sẽ hiển thị góp ý từ người dùng. Hiện chưa có
                    API, có thể bổ sung sau.
                  </p>
                </div>
              )}

              {activeTab === "notifications" && (
                <div>
                  <p>
                    Tab Thông báo dùng để gửi thông báo hệ thống tới người dùng.
                    Hiện là placeholder, sẽ kết nối API sau.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
