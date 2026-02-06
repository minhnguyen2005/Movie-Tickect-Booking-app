import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { API_ENDPOINTS } from "../config/api";
import Loading from "../components/Loading";
import "../styles/TransactionHistory.css";
import {
  FaCalendarAlt,
  FaTicketAlt,
  FaTheaterMasks,
  FaChair,
  FaShoppingBag,
  FaQrcode,
  FaCreditCard,
  FaStar,
  FaArrowLeft,
  FaFilter,
} from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";

const TransactionHistory = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchBookings();
  }, [user, navigate, filterStatus]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const url =
        filterStatus === "all"
          ? API_ENDPOINTS.BOOKINGS.GET_MY_BOOKINGS
          : `${API_ENDPOINTS.BOOKINGS.GET_MY_BOOKINGS}?status=${filterStatus}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Không thể tải lịch sử giao dịch");
      }

      const data = await response.json();
      if (data.success && data.data && Array.isArray(data.data.bookings)) {
        const formattedBookings = data.data.bookings
          .map((booking) => {
            if (!booking.showtime || !booking.showtime.movie || !booking.showtime.theater) {
              return null;
            }

            const showtime = booking.showtime;
            const movie = showtime.movie;
            const theater = showtime.theater;
            const showtimeDate = new Date(showtime.date);
            const now = new Date();

            // Tạo datetime từ date và time
            const [hours, minutes] = showtime.time.split(":").map(Number);
            const showtimeDateTime = new Date(showtimeDate);
            showtimeDateTime.setHours(hours || 0, minutes || 0, 0, 0);

            return {
              id: booking._id,
              bookingCode: booking.bookingCode || booking._id,
              title: movie.title,
              poster: movie.poster,
              duration: movie.duration,
              genre: movie.genre || [],
              rating: movie.rating,
              theaterName: theater.name,
              theaterAddress: theater.address || theater.city || "",
              showtimeDate: showtimeDate,
              showtimeDateTime: showtimeDateTime,
              time: showtime.time,
              seats: booking.seats || [],
              ticketType: booking.ticketType || "standard",
              combo: booking.combo || { popcorn: 0, drink: 0, comboPrice: 0 },
              totalPrice: booking.totalPrice || 0,
              status: booking.status,
              paymentMethod: booking.paymentMethod || "cash",
              pointsEarned: booking.pointsEarned || 0,
              pointsUsed: booking.pointsUsed || 0,
              bookingDate: booking.createdAt ? new Date(booking.createdAt) : new Date(),
              isUpcoming: showtimeDateTime > now && booking.status === "paid",
              isWatched: showtimeDateTime < now && booking.status === "paid",
            };
          })
          .filter((booking) => booking !== null);

        formattedBookings.sort((a, b) => b.bookingDate - a.bookingDate);
        setBookings(formattedBookings);
      }
    } catch (error) {
      console.error("Lỗi khi tải lịch sử giao dịch:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTicketTypeLabel = (type) => {
    const labels = {
      standard: "Thường",
      vip: "VIP",
      premium: "Premium",
    };
    return labels[type] || "Thường";
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      cash: "Tiền mặt",
      card: "Thẻ tín dụng/Ghi nợ",
      banking: "Chuyển khoản",
      momo: "MoMo",
      zalopay: "ZaloPay",
    };
    return labels[method] || method;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Chờ thanh toán",
      paid: "Đã thanh toán",
      cancelled: "Đã hủy",
      completed: "Hoàn thành",
    };
    return labels[status] || status;
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowQRCode(false);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="transaction-history-page">
      <div className="transaction-history-container">
        <div className="transaction-history-header">
          <button className="btn-back" onClick={() => navigate("/profile")}>
            <FaArrowLeft /> Quay lại
          </button>
          <h1>Lịch sử giao dịch</h1>
        </div>

        <div className="transaction-filters">
          <div className="filter-group">
            <FaFilter style={{ marginRight: "8px" }} />
            <span>Lọc theo:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tất cả</option>
              <option value="paid">Đã thanh toán</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="empty-state">
            <FaTicketAlt size={64} style={{ color: "#666", marginBottom: "16px" }} />
            <p>Bạn chưa có giao dịch nào</p>
            <button className="btn-primary" onClick={() => navigate("/")}>
              Đặt vé ngay
            </button>
          </div>
        ) : (
          <div className="transactions-list">
            {bookings.map((booking) => (
              <div key={booking.id} className="transaction-card booking-card">
                <div className="transaction-poster booking-poster">
                  <img
                    src={booking.poster || "/assets/img/default-poster.jpg"}
                    alt={booking.title}
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/300x450?text=Movie+Poster";
                    }}
                  />
                </div>

                <div className="transaction-info booking-info">
                  <h3 className="transaction-title booking-title">{booking.title}</h3>
                  <p className="booking-location">
                    {booking.theaterName}
                    {booking.theaterAddress && ` - ${booking.theaterAddress}`}
                  </p>
                  <div className="booking-datetime">
                    <span>
                      {booking.showtimeDate.toLocaleDateString("vi-VN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <span>•</span>
                    <span>{booking.time}</span>
                  </div>
                  <div className="booking-seats">
                    <span>Ghế: {booking.seats.join(", ")}</span>
                    <span>•</span>
                    <span>{booking.totalPrice.toLocaleString("vi-VN")}đ</span>
                  </div>

                  <div className="booking-actions transaction-actions">
                    {booking.status === "paid" ? (
                      <>
                        <button
                          className="btn-view-ticket"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowQRCode(true);
                          }}
                        >
                          <FaQrcode /> Mã QR
                        </button>
                        <button
                          className="btn-details"
                          onClick={() => handleViewDetails(booking)}
                        >
                          Chi tiết
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn-details"
                        onClick={() => handleViewDetails(booking)}
                      >
                        Xem chi tiết
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
                    {getStatusLabel(booking.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal chi tiết giao dịch */}
      {selectedBooking && (
        <div
          className="transaction-modal-overlay"
          onClick={() => {
            setSelectedBooking(null);
            setShowQRCode(false);
          }}
        >
          <div
            className="transaction-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Chi tiết giao dịch</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setSelectedBooking(null);
                  setShowQRCode(false);
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              {showQRCode ? (
                <div className="qr-code-section">
                  <h3>Mã QR vé điện tử</h3>
                  <div className="qr-code-container">
                    <QRCodeSVG
                      value={selectedBooking.bookingCode}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="booking-code-display">
                    Mã vé: <strong>{selectedBooking.bookingCode}</strong>
                  </p>
                  <p className="qr-instruction">
                    Vui lòng trình mã QR này tại rạp để vào xem phim
                  </p>
                </div>
              ) : (
                <>
                  <div className="modal-poster">
                    <img
                      src={
                        selectedBooking.poster ||
                        "/assets/img/default-poster.jpg"
                      }
                      alt={selectedBooking.title}
                    />
                  </div>

                  <div className="modal-details">
                    <h3>{selectedBooking.title}</h3>
                    <div className="modal-detail-list">
                      <div className="modal-detail-item">
                        <span className="modal-label">Mã đặt vé:</span>
                        <span className="modal-value">
                          {selectedBooking.bookingCode}
                        </span>
                      </div>
                      <div className="modal-detail-item">
                        <span className="modal-label">Thời gian đặt:</span>
                        <span className="modal-value">
                          {selectedBooking.bookingDate.toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div className="modal-detail-item">
                        <span className="modal-label">Thời gian xem:</span>
                        <span className="modal-value">
                          {selectedBooking.showtimeDate.toLocaleDateString(
                            "vi-VN"
                          )}{" "}
                          - {selectedBooking.time}
                        </span>
                      </div>
                      <div className="modal-detail-item">
                        <span className="modal-label">Rạp:</span>
                        <span className="modal-value">
                          {selectedBooking.theaterName}
                        </span>
                      </div>
                      <div className="modal-detail-item">
                        <span className="modal-label">Địa chỉ:</span>
                        <span className="modal-value">
                          {selectedBooking.theaterAddress}
                        </span>
                      </div>
                      <div className="modal-detail-item">
                        <span className="modal-label">Loại vé:</span>
                        <span className="modal-value">
                          {getTicketTypeLabel(selectedBooking.ticketType)}
                        </span>
                      </div>
                      <div className="modal-detail-item">
                        <span className="modal-label">Ghế:</span>
                        <span className="modal-value">
                          {selectedBooking.seats.join(", ")}
                        </span>
                      </div>
                      {(selectedBooking.combo.popcorn > 0 ||
                        selectedBooking.combo.drink > 0) && (
                        <div className="modal-detail-item">
                          <span className="modal-label">Combo:</span>
                          <span className="modal-value">
                            {selectedBooking.combo.popcorn > 0 &&
                              `${selectedBooking.combo.popcorn} bắp`}
                            {selectedBooking.combo.popcorn > 0 &&
                              selectedBooking.combo.drink > 0 &&
                              " + "}
                            {selectedBooking.combo.drink > 0 &&
                              `${selectedBooking.combo.drink} nước`}
                          </span>
                        </div>
                      )}
                      <div className="modal-detail-item">
                        <span className="modal-label">Thanh toán:</span>
                        <span className="modal-value">
                          {getPaymentMethodLabel(selectedBooking.paymentMethod)}
                        </span>
                      </div>
                      {selectedBooking.pointsEarned > 0 && (
                        <div className="modal-detail-item">
                          <span className="modal-label">Điểm tích lũy:</span>
                          <span className="modal-value points-earned">
                            +{selectedBooking.pointsEarned.toLocaleString(
                              "vi-VN"
                            )}{" "}
                            điểm
                          </span>
                        </div>
                      )}
                      {selectedBooking.pointsUsed > 0 && (
                        <div className="modal-detail-item">
                          <span className="modal-label">Điểm đã dùng:</span>
                          <span className="modal-value points-used">
                            -{selectedBooking.pointsUsed.toLocaleString(
                              "vi-VN"
                            )}{" "}
                            điểm
                          </span>
                        </div>
                      )}
                      <div className="modal-detail-item total">
                        <span className="modal-label">Tổng tiền:</span>
                        <span className="modal-value total-amount">
                          {selectedBooking.totalPrice.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    </div>

                    {selectedBooking.status === "paid" && (
                      <button
                        className="btn-view-qr-modal"
                        onClick={() => setShowQRCode(true)}
                      >
                        <FaQrcode /> Xem mã QR
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;

