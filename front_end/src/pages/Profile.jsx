import { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/Profile.css";
import Loading from "../components/Loading";
import { API_ENDPOINTS } from "../config/api";
import {
  FaCamera,
  FaCalendarAlt,
  FaStar,
  FaTicketAlt,
  FaChartPie,
  FaHeart,
  FaCog,
  FaChevronRight,
  FaPlus,
  FaQrcode,
  FaTimes,
} from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";

const Profile = () => {
  const { user: contextUser, setUser: setContextUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [stats, setStats] = useState({
    moviesWatched: 0,
    points: 0,
    upcomingTickets: 0,
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(API_ENDPOINTS.AUTH.GET_CURRENT_USER, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            logout();
            navigate("/login");
            return;
          }
          throw new Error("Không thể tải thông tin người dùng");
        }

        const data = await response.json();
        if (data.success && data.data.user) {
          const userData = data.data.user;
          setUser(userData);
          // Cập nhật context user nếu có
          if (setContextUser) {
            setContextUser(userData);
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải profile:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchWishlist = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(API_ENDPOINTS.WISHLIST.GET, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (data.success && data.data && Array.isArray(data.data.movies)) {
          setFavoriteMovies(data.data.movies);
        }
      } catch (error) {
        console.error("Lỗi khi tải wishlist:", error);
      }
    };

    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        // Lấy tất cả bookings (bao gồm cả pending và paid)
        // Có thể filter ở đây nếu muốn chỉ hiển thị bookings đã thanh toán
        const response = await fetch(API_ENDPOINTS.BOOKINGS.GET_MY_BOOKINGS, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (data.success && data.data && Array.isArray(data.data.bookings)) {
          // Format bookings để hiển thị
          const formattedBookings = data.data.bookings
            .map((booking) => {
              // Kiểm tra xem booking có đầy đủ thông tin không
              if (!booking.showtime || !booking.showtime.movie || !booking.showtime.theater) {
                return null;
              }

              const showtime = booking.showtime;
              const movie = showtime.movie;
              const theater = showtime.theater;
              const showtimeDate = new Date(showtime.date);
              const now = new Date();

              return {
                id: booking._id,
                bookingCode: booking.bookingCode || booking._id,
                title: movie.title,
                poster: movie.poster,
                location: `${theater.name} - ${theater.address}`,
                theaterName: theater.name,
                theaterAddress: theater.address,
                date: showtimeDate.toLocaleDateString("vi-VN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
                time: showtime.time,
                seats: booking.seats,
                totalPrice: booking.totalPrice,
                status: booking.status,
                paymentMethod: booking.paymentMethod,
                showtimeDate: showtimeDate,
                bookingDate: booking.createdAt ? new Date(booking.createdAt) : new Date(),
                isUpcoming: showtimeDate > now && booking.status === "paid",
                isPaid: booking.status === "paid",
                ticketType: booking.ticketType || "standard",
                combo: booking.combo || { popcorn: 0, drink: 0, comboPrice: 0 },
              };
            })
            .filter((booking) => booking !== null); // Loại bỏ các booking không hợp lệ

          // Sắp xếp theo ngày đặt vé mới nhất (hoặc ngày chiếu)
          formattedBookings.sort((a, b) => b.bookingDate - a.bookingDate);
          setRecentBookings(formattedBookings);
        }
      } catch (error) {
        console.error("Lỗi khi tải bookings:", error);
      }
    };

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(API_ENDPOINTS.BOOKINGS.GET_STATS, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (data.success && data.data) {
          setStats({
            moviesWatched: data.data.moviesWatched || 0,
            points: data.data.points || 0,
            upcomingTickets: data.data.upcomingTickets || 0,
          });
        }
      } catch (error) {
        console.error("Lỗi khi tải stats:", error);
      }
    };

    if (contextUser) {
      setUser(contextUser);
      setLoading(false);
      fetchWishlist();
      fetchBookings();
      fetchStats();
    } else {
      fetchUserProfile().then(() => {
        fetchWishlist();
        fetchBookings();
        fetchStats();
      });
    }

    // Refresh bookings và stats nếu có flag từ location state (sau khi thanh toán thành công)
    if (location.state?.refreshBookings) {
      fetchBookings();
      fetchStats();
    }

    // Refresh user profile nếu có message từ EditProfile (sau khi cập nhật thành công)
    if (location.state?.message) {
      fetchUserProfile();
    }
  }, [contextUser, navigate, logout, location.state?.refreshBookings, location.state?.message]);

  const formatJoinDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `Tháng ${month}/${year}`;
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Kiểm tra kích thước file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    // Kiểm tra định dạng file
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file ảnh");
      return;
    }

    setUploadingAvatar(true);

    try {
      // Resize và compress ảnh trước khi upload
      const compressImage = (file, maxWidth = 800, quality = 0.8) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              let width = img.width;
              let height = img.height;

              // Tính toán kích thước mới
              if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
              }

              canvas.width = width;
              canvas.height = height;

              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0, width, height);

              // Chuyển thành base64 với quality
              const base64 = canvas.toDataURL("image/jpeg", quality);
              resolve(base64);
            };
            img.src = e.target.result;
          };
          reader.readAsDataURL(file);
        });
      };

      // Compress ảnh trước khi upload
      const base64Image = await compressImage(file);

      // Cập nhật avatar ngay lập tức để preview
      const updatedUser = { ...user, avatar: base64Image };
      setUser(updatedUser);
      if (setContextUser) {
        setContextUser(updatedUser);
      }

      // Gọi API để cập nhật avatar
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(API_ENDPOINTS.AUTH.UPDATE_PROFILE, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          avatar: base64Image,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Cập nhật ảnh đại diện thất bại");
      }

      if (data.success && data.data.user) {
        // Cập nhật user với dữ liệu từ server
        setUser(data.data.user);
        if (setContextUser) {
          setContextUser(data.data.user);
        }
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật avatar:", error);
      alert(error.message || "Có lỗi xảy ra khi cập nhật ảnh đại diện");
      // Revert về avatar cũ nếu có lỗi
      if (user) {
        setUser(user);
      }
    } finally {
      setUploadingAvatar(false);
      // Reset input để có thể chọn lại cùng file
      e.target.value = "";
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="error-message">
          <h2>Không tìm thấy thông tin người dùng</h2>
          <button onClick={() => navigate("/")} className="btn-primary">
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Profile Header Card */}
      <div className="profile-header-card">
        <div className="profile-main-info">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-large">
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" />
              ) : (
                user.fullName
                  ? user.fullName.charAt(0).toUpperCase()
                  : user.email.charAt(0).toUpperCase()
              )}
              {uploadingAvatar && (
                <div className="avatar-upload-overlay">
                  <div className="avatar-upload-spinner"></div>
                </div>
              )}
            </div>
            <label htmlFor="avatar-upload-profile" className="avatar-upload-icon">
              <FaCamera />
              <input
                type="file"
                id="avatar-upload-profile"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
                disabled={uploadingAvatar}
              />
            </label>
          </div>
          <div className="profile-details">
            <h1 className="profile-name">{user.fullName || "Người dùng"}</h1>
            <span className="vip-badge">THÀNH VIÊN VIP</span>
            <p className="profile-email">{user.email}</p>
            <p className="profile-join-date">
              Tham gia từ {formatJoinDate(user.createdAt)}
            </p>
          </div>
        </div>
        <button className="btn-edit-profile" onClick={() => navigate("/profile/edit")}>
          <FaCamera style={{ marginRight: "8px" }} />
          Chỉnh sửa hồ sơ
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FaCalendarAlt />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.moviesWatched}</div>
            <div className="stat-label">Phim đã xem</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <FaStar />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.points.toLocaleString()}</div>
            <div className="stat-label">Điểm tích lũy</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <FaTicketAlt />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.upcomingTickets}</div>
            <div className="stat-label">Vé sắp tới</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`tab-item ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <FaChartPie style={{ marginRight: "6px" }} />
          Tổng quan
        </button>
        <button
          className={`tab-item ${activeTab === "bookings" ? "active" : ""}`}
          onClick={() => navigate("/profile/transactions")}
        >
          <FaTicketAlt style={{ marginRight: "6px" }} />
          Lịch sử giao dịch
        </button>
        <button
          className={`tab-item ${activeTab === "favorites" ? "active" : ""}`}
          onClick={() => setActiveTab("favorites")}
        >
          <FaHeart style={{ marginRight: "6px" }} />
          Phim yêu thích
        </button>
        <button
          className={`tab-item ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          <FaCog style={{ marginRight: "6px" }} />
          Cài đặt
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "overview" && (
          <>
            {/* Recent Bookings */}
            <div className="section-header">
              <h2>Lịch sử đặt vé gần đây</h2>
              <a
                href="#"
                className="view-all-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/profile/transactions");
                }}
              >
                Xem tất cả <FaChevronRight style={{ marginLeft: "4px" }} />
              </a>
            </div>
            <div className="bookings-list">
              {recentBookings.length > 0 ? (
                recentBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-poster">
                      <img
                        src={booking.poster || "/assets/img/default-poster.jpg"}
                        alt={booking.title}
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/300x450?text=Movie+Poster";
                        }}
                      />
                    </div>
                    <div className="booking-info">
                      <h3 className="booking-title">{booking.title}</h3>
                      <p className="booking-location">{booking.location}</p>
                      <div className="booking-datetime">
                        <span>{booking.date}</span>
                        <span>•</span>
                        <span>{booking.time}</span>
                      </div>
                      <div className="booking-seats">
                        <span>Ghế: {booking.seats.join(", ")}</span>
                        <span>•</span>
                        <span>{booking.totalPrice.toLocaleString("vi-VN")}đ</span>
                      </div>
                      <div className="booking-actions">
                        {booking.isUpcoming ? (
                          <>
                            <button 
                              className="btn-view-ticket"
                              onClick={() => {
                                setSelectedTicket(booking);
                                setShowTicketModal(true);
                              }}
                            >
                              Xem vé điện tử
                            </button>
                            <button className="btn-details">Chi tiết</button>
                          </>
                        ) : (
                          <button
                            className="btn-rebook"
                            onClick={() => navigate(`/booking/${booking.id}`)}
                          >
                            Đặt lại phim này
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="booking-status">
                      <span
                        className={`status-badge ${
                          booking.isUpcoming ? "upcoming" : "watched"
                        }`}
                      >
                        {booking.isUpcoming ? "SẮP TỚI" : "ĐÃ XEM"}
                      </span>
                      <span className={`payment-status ${booking.status === "paid" ? "paid" : booking.status === "pending" ? "pending" : "cancelled"}`}>
                        {booking.status === "paid" 
                          ? "Đã thanh toán" 
                          : booking.status === "pending" 
                          ? "Chờ thanh toán" 
                          : booking.status === "cancelled"
                          ? "Đã hủy"
                          : booking.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: "#b3b3b3", textAlign: "center", padding: "40px" }}>
                  Hiện bạn chưa có lịch sử đặt vé.
                </p>
              )}
            </div>

            {/* Favorite Movies */}
            <div className="section-header">
              <h2>Phim yêu thích</h2>
              <a href="#" className="view-all-link">
                Xem tất cả <FaChevronRight style={{ marginLeft: "4px" }} />
              </a>
            </div>
            <div className="movie-grid">
              {favoriteMovies.length > 0 ? (
                favoriteMovies.map((movie) => {
                  const getAgeTagClass = (ageRating) => {
                    const rating = ageRating?.toLowerCase();
                    if (rating === "k") return "k";
                    if (rating === "t13") return "t13";
                    if (rating === "t16") return "t16";
                    if (rating === "t18") return "t18";
                    return "k";
                  };
                  return (
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
                          {movie.ageRating || "K"}
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
                  );
                })
              ) : (
                <p
                  style={{
                    color: "#b3b3b3",
                    gridColumn: "1 / -1",
                    textAlign: "center",
                  }}
                >
                  Hiện bạn chưa lưu phim yêu thích nào.
                </p>
              )}
            </div>
          </>
        )}

        {activeTab === "bookings" && (
          <div className="bookings-tab-content">
            <h2 style={{ marginBottom: "24px", color: "white" }}>
              Tất cả lịch sử đặt vé
            </h2>
            {recentBookings.length > 0 ? (
              <div className="bookings-list">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-poster">
                      <img
                        src={booking.poster || "/assets/img/default-poster.jpg"}
                        alt={booking.title}
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/300x450?text=Movie+Poster";
                        }}
                      />
                    </div>
                    <div className="booking-info">
                      <h3 className="booking-title">{booking.title}</h3>
                      <p className="booking-location">{booking.location}</p>
                      <div className="booking-datetime">
                        <span>{booking.date}</span>
                        <span>•</span>
                        <span>{booking.time}</span>
                      </div>
                      <div className="booking-seats">
                        <span>Ghế: {booking.seats.join(", ")}</span>
                        <span>•</span>
                        <span>{booking.totalPrice.toLocaleString("vi-VN")}đ</span>
                      </div>
                      <div className="booking-actions">
                        {booking.isUpcoming ? (
                          <>
                            <button 
                              className="btn-view-ticket"
                              onClick={() => {
                                setSelectedTicket(booking);
                                setShowTicketModal(true);
                              }}
                            >
                              Xem vé điện tử
                            </button>
                            <button className="btn-details">Chi tiết</button>
                          </>
                        ) : (
                          <button
                            className="btn-rebook"
                            onClick={() => navigate(`/booking/${booking.id}`)}
                          >
                            Đặt lại phim này
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="booking-status">
                      <span
                        className={`status-badge ${
                          booking.isUpcoming ? "upcoming" : "watched"
                        }`}
                      >
                        {booking.isUpcoming ? "SẮP TỚI" : "ĐÃ XEM"}
                      </span>
                      <span className={`payment-status ${booking.status === "paid" ? "paid" : booking.status === "pending" ? "pending" : "cancelled"}`}>
                        {booking.status === "paid" 
                          ? "Đã thanh toán" 
                          : booking.status === "pending" 
                          ? "Chờ thanh toán" 
                          : booking.status === "cancelled"
                          ? "Đã hủy"
                          : booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#b3b3b3", textAlign: "center", padding: "40px" }}>
                Hiện bạn chưa có lịch sử đặt vé.
              </p>
            )}
          </div>
        )}

        {activeTab === "favorites" && (
          <div className="favorites-tab-content">
            {favoriteMovies.length > 0 ? (
              <div className="movie-grid">
                {favoriteMovies.map((movie) => {
                  const getAgeTagClass = (ageRating) => {
                    const rating = ageRating?.toLowerCase();
                    if (rating === "k") return "k";
                    if (rating === "t13") return "t13";
                    if (rating === "t16") return "t16";
                    if (rating === "t18") return "t18";
                    return "k";
                  };
                  return (
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
                          {movie.ageRating || "K"}
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
                  );
                })}
              </div>
            ) : (
              <p
                style={{
                  color: "#b3b3b3",
                  gridColumn: "1 / -1",
                  textAlign: "center",
                }}
              >
                Hiện bạn chưa lưu phim yêu thích nào.
              </p>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="settings-tab-content">
            <div className="settings-section">
              <h3>Thông tin tài khoản</h3>
              <div className="settings-item">
                <label>Họ và tên</label>
                <input type="text" defaultValue={user.fullName || ""} />
              </div>
              <div className="settings-item">
                <label>Email</label>
                <input type="email" defaultValue={user.email} disabled />
              </div>
              <div className="settings-item">
                <label>Số điện thoại</label>
                <input type="tel" defaultValue={user.phone || ""} />
              </div>
              <button className="btn-save-settings">Lưu thay đổi</button>
            </div>
            <div className="settings-section">
              <h3>Bảo mật</h3>
              <button className="btn-change-password">Đổi mật khẩu</button>
              <button className="btn-logout" onClick={logout}>
                Đăng xuất
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal vé điện tử */}
      {showTicketModal && selectedTicket && (
        <div
          className="ticket-modal-overlay"
          onClick={() => {
            setShowTicketModal(false);
            setSelectedTicket(null);
          }}
        >
          <div
            className="ticket-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ticket-modal-header">
              <h2>Vé điện tử</h2>
              <button
                className="ticket-modal-close"
                onClick={() => {
                  setShowTicketModal(false);
                  setSelectedTicket(null);
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div className="ticket-modal-content">
              <div className="ticket-qr-section">
                <div className="ticket-qr-code">
                  <QRCodeSVG
                    value={selectedTicket.bookingCode}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="ticket-booking-code">
                  <p className="ticket-code-label">Mã vé</p>
                  <p className="ticket-code-value">{selectedTicket.bookingCode}</p>
                </div>
              </div>

              <div className="ticket-info-section">
                <div className="ticket-movie-info">
                  <h3>{selectedTicket.title}</h3>
                  <div className="ticket-detail-row">
                    <span className="ticket-label">Rạp:</span>
                    <span className="ticket-value">{selectedTicket.theaterName}</span>
                  </div>
                  <div className="ticket-detail-row">
                    <span className="ticket-label">Địa chỉ:</span>
                    <span className="ticket-value">{selectedTicket.theaterAddress}</span>
                  </div>
                  <div className="ticket-detail-row">
                    <span className="ticket-label">Ngày chiếu:</span>
                    <span className="ticket-value">{selectedTicket.date}</span>
                  </div>
                  <div className="ticket-detail-row">
                    <span className="ticket-label">Giờ chiếu:</span>
                    <span className="ticket-value">{selectedTicket.time}</span>
                  </div>
                  <div className="ticket-detail-row">
                    <span className="ticket-label">Ghế:</span>
                    <span className="ticket-value">{selectedTicket.seats.join(", ")}</span>
                  </div>
                  {selectedTicket.ticketType && (
                    <div className="ticket-detail-row">
                      <span className="ticket-label">Loại vé:</span>
                      <span className="ticket-value">
                        {selectedTicket.ticketType === "standard"
                          ? "Thường"
                          : selectedTicket.ticketType === "vip"
                          ? "VIP"
                          : "Premium"}
                      </span>
                    </div>
                  )}
                  {(selectedTicket.combo?.popcorn > 0 ||
                    selectedTicket.combo?.drink > 0) && (
                    <div className="ticket-detail-row">
                      <span className="ticket-label">Combo:</span>
                      <span className="ticket-value">
                        {selectedTicket.combo.popcorn > 0 &&
                          `${selectedTicket.combo.popcorn} bắp`}
                        {selectedTicket.combo.popcorn > 0 &&
                          selectedTicket.combo.drink > 0 &&
                          " + "}
                        {selectedTicket.combo.drink > 0 &&
                          `${selectedTicket.combo.drink} nước`}
                      </span>
                    </div>
                  )}
                  <div className="ticket-detail-row">
                    <span className="ticket-label">Tổng tiền:</span>
                    <span className="ticket-value ticket-price">
                      {selectedTicket.totalPrice.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>

                <div className="ticket-instruction">
                  <p>
                    <FaQrcode style={{ marginRight: "8px" }} />
                    Vui lòng trình mã QR này tại rạp để vào xem phim
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
