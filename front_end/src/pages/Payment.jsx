import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { API_ENDPOINTS } from "../config/api";
import Loading from "../components/Loading";
import "../styles/Payment.css";

const Payment = () => {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchBooking();
  }, [bookingId, user, navigate]);

  const fetchBooking = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(API_ENDPOINTS.BOOKINGS.GET_BY_ID(bookingId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setBooking(data.data.booking);
      } else {
        alert("Không tìm thấy booking");
        navigate("/");
      }
      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi tải booking:", error);
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!booking) return;

    setPaymentLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        API_ENDPOINTS.BOOKINGS.UPDATE_PAYMENT(bookingId),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentMethod,
            paymentInfo: {},
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Thanh toán thành công! Vé đã được lưu vào lịch sử đặt vé.");
        navigate("/profile", { state: { refreshBookings: true } });
      } else {
        alert(data.message || "Có lỗi xảy ra khi thanh toán");
      }
    } catch (error) {
      console.error("Lỗi khi thanh toán:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!booking) {
    return (
      <div className="payment-container">
        <p>Không tìm thấy booking</p>
      </div>
    );
  }

  const showtime = booking.showtime;
  const movie = showtime.movie;
  const theater = showtime.theater;

  return (
    <div className="payment-container">
        <div className="payment-header">
          <h1>Thanh toán</h1>
          <p className="payment-subtitle">Vui lòng hoàn tất thanh toán để hoàn tất đặt vé</p>
        </div>

        <div className="payment-content">
          <div className="payment-left">
            <div className="booking-details-card">
              <h2>Chi tiết đặt vé</h2>
              <div className="detail-section">
                <div className="detail-item">
                  <span className="label">Phim:</span>
                  <span className="value">{movie.title}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Rạp:</span>
                  <span className="value">{theater.name}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Địa chỉ:</span>
                  <span className="value">{theater.address}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Ngày chiếu:</span>
                  <span className="value">
                    {new Date(showtime.date).toLocaleDateString("vi-VN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Giờ chiếu:</span>
                  <span className="value">{showtime.time}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Ghế đã chọn:</span>
                  <span className="value">{booking.seats.join(", ")}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Số lượng vé:</span>
                  <span className="value">{booking.seats.length} vé</span>
                </div>
              </div>
            </div>

            <div className="payment-methods-card">
              <h2>Phương thức thanh toán</h2>
              <div className="payment-methods">
                <label className={`payment-method ${paymentMethod === "cash" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="method-content">
                    <span className="method-icon">💵</span>
                    <span className="method-name">Tiền mặt</span>
                    <span className="method-desc">Thanh toán tại rạp</span>
                  </div>
                </label>

                <label className={`payment-method ${paymentMethod === "card" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="method-content">
                    <span className="method-icon">💳</span>
                    <span className="method-name">Thẻ tín dụng/Ghi nợ</span>
                    <span className="method-desc">Visa, Mastercard</span>
                  </div>
                </label>

                <label className={`payment-method ${paymentMethod === "banking" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="banking"
                    checked={paymentMethod === "banking"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="method-content">
                    <span className="method-icon">🏦</span>
                    <span className="method-name">Chuyển khoản</span>
                    <span className="method-desc">Internet Banking</span>
                  </div>
                </label>

                <label className={`payment-method ${paymentMethod === "momo" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="momo"
                    checked={paymentMethod === "momo"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="method-content">
                    <span className="method-icon">📱</span>
                    <span className="method-name">MoMo</span>
                    <span className="method-desc">Ví điện tử MoMo</span>
                  </div>
                </label>

                <label className={`payment-method ${paymentMethod === "zalopay" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="zalopay"
                    checked={paymentMethod === "zalopay"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="method-content">
                    <span className="method-icon">📱</span>
                    <span className="method-name">ZaloPay</span>
                    <span className="method-desc">Ví điện tử ZaloPay</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="payment-right">
            <div className="payment-summary-card">
              <h2>Tóm tắt thanh toán</h2>
              <div className="summary-section">
                <div className="summary-row">
                  <span>Giá vé:</span>
                  <span>{showtime.price.toLocaleString("vi-VN")}đ x {booking.seats.length}</span>
                </div>
                <div className="summary-row">
                  <span>Tổng tiền:</span>
                  <span className="total-amount">
                    {booking.totalPrice.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
              <button
                className="btn-pay"
                onClick={handlePayment}
                disabled={paymentLoading}
              >
                {paymentLoading ? "Đang xử lý..." : "Xác nhận thanh toán"}
              </button>
              <button
                className="btn-cancel"
                onClick={() => navigate(-1)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    
  );
};

export default Payment;

