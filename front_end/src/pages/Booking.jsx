import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import API_BASE_URL, { API_ENDPOINTS } from "../config/api";
import { io } from "socket.io-client";
import Loading from "../components/Loading";
import "../styles/Booking.css";

const Booking = () => {
  const { id: movieId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useContext(AuthContext);
  const [step, setStep] = useState(1); // 1: Chọn suất, 2: Chọn ghế, 3: Xác nhận
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [socket, setSocket] = useState(null);

  const initialShowtimeId = searchParams.get("showtimeId");

  // Áp dụng ngày được truyền từ trang chi tiết phim (nếu có)
  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      setSelectedDate(dateParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) {
      alert("Vui lòng đăng nhập để đặt vé");
      navigate("/login");
      return;
    }

    fetchMovie();
  }, [movieId, user, navigate]);

  // Kết nối Socket.IO khi đã chọn suất chiếu (MongoDB showtime)
  useEffect(() => {
    if (!selectedShowtime || !selectedShowtime._id) return;

    const socketInstance = io(API_BASE_URL, {
      transports: ["websocket"],
    });

    socketInstance.on("connect", () => {
      socketInstance.emit("join_showtime", {
        showtimeId: selectedShowtime._id,
      });
    });

    socketInstance.on("seatsBooked", ({ showtimeId, seats }) => {
      if (showtimeId !== selectedShowtime._id) return;

      // Cập nhật danh sách ghế đã đặt và loại ghế vừa bị người khác lấy khỏi danh sách đang chọn
      setBookedSeats((prev) => {
        const newSeats = seats.filter((s) => !prev.includes(s));
        return [...prev, ...newSeats];
      });

      setSelectedSeats((prev) =>
        prev.filter((seat) => !seats.includes(seat))
      );
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [selectedShowtime?._id]);

  const fetchMovie = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.MOVIES.GET_BY_ID(movieId));
      const data = await response.json();
      if (data.success) {
        setMovie(data.data.movie);
        fetchShowtimes();
      }
    } catch (error) {
      console.error("Lỗi khi tải phim:", error);
      setLoading(false);
    }
  };

  const fetchShowtimes = async () => {
    try {
      const response = await fetch(
        API_ENDPOINTS.SHOWTIMES.GET_BY_MOVIE(movieId)
      );
      const data = await response.json();
      if (data.success) {
        setShowtimes(data.data.showtimes);
        // Nếu chưa có selectedDate (không truyền từ URL) thì dùng ngày đầu tiên
        if (!selectedDate && data.data.showtimes.length > 0) {
          const firstDate = new Date(
            data.data.showtimes[0].showtimes[0].date
          );
          setSelectedDate(firstDate.toISOString().split("T")[0]);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi tải lịch chiếu:", error);
      setLoading(false);
    }
  };

  // Nếu có showtimeId từ URL, tự động chọn đúng suất chiếu tương ứng
  useEffect(() => {
    if (!initialShowtimeId || !showtimes.length || selectedShowtime) return;

    let foundShowtime = null;
    showtimes.forEach((theaterGroup) => {
      theaterGroup.showtimes.forEach((st) => {
        if (st._id === initialShowtimeId) {
          foundShowtime = st;
        }
      });
    });

    if (foundShowtime) {
      handleSelectShowtime(foundShowtime);
    }
  }, [initialShowtimeId, showtimes, selectedShowtime]);

  const handleSelectShowtime = async (showtime) => {
    setSelectedShowtime(showtime);
    setSelectedSeats([]);
    setStep(2);

    // Use booked seats from showtime data (already fetched from API)
    const booked = showtime.bookedSeats || [];
    setBookedSeats(booked);

    // Generate available seats (A1-A10, B1-B10, etc.)
    const seats = [];
    const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    rows.forEach((row) => {
      for (let i = 1; i <= 10; i++) {
        seats.push(`${row}${i}`);
      }
    });
    setAvailableSeats(seats);
  };

  const handleSelectSeat = (seat) => {
    if (bookedSeats.includes(seat)) return;

    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seat));
    } else {
      if (selectedSeats.length < 8) {
        // Giới hạn tối đa 8 ghế
        setSelectedSeats([...selectedSeats, seat]);
      } else {
        alert("Bạn chỉ có thể chọn tối đa 8 ghế");
      }
    }
  };

  const handleContinue = () => {
    if (step === 1 && !selectedShowtime) {
      alert("Vui lòng chọn suất chiếu");
      return;
    }
    if (step === 2 && selectedSeats.length === 0) {
      alert("Vui lòng chọn ít nhất 1 ghế");
      return;
    }
    if (step === 2) {
      setStep(3);
    }
  };

  const handleCreateBooking = async () => {
    if (!selectedShowtime || selectedSeats.length === 0) {
      alert("Vui lòng chọn đầy đủ thông tin");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
      navigate("/login");
      return;
    }

    setBookingLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.BOOKINGS.CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          showtimeId: selectedShowtime._id,
          seats: selectedSeats,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData?.message ||
          "Đặt vé thất bại, vui lòng kiểm tra lại thông tin";
        alert(message);
        return;
      }

      const data = await response.json();
      const bookingId =
        data?.data?.booking?._id ||
        data?.data?.bookingId ||
        data?.data?._id ||
        data?.bookingId;

      if (data.success && bookingId) {
        navigate(`/payment/${bookingId}`);
      } else {
        alert(data.message || "Có lỗi xảy ra khi đặt vé");
      }
    } catch (error) {
      console.error("Lỗi khi đặt vé:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!movie) {
    return (
      <div className="booking-container">
        <p>Không tìm thấy phim</p>
      </div>
    );
  }

  // Get unique dates
  const dates = [];
  showtimes.forEach((theaterGroup) => {
    theaterGroup.showtimes.forEach((st) => {
      const dateStr = new Date(st.date).toISOString().split("T")[0];
      if (!dates.includes(dateStr)) {
        dates.push(dateStr);
      }
    });
  });
  dates.sort();

  // Filter showtimes by selected date
  const filteredShowtimes = showtimes.map((theaterGroup) => ({
    ...theaterGroup,
    showtimes: theaterGroup.showtimes.filter((st) => {
      const dateStr = new Date(st.date).toISOString().split("T")[0];
      return dateStr === selectedDate;
    }),
  })).filter((tg) => tg.showtimes.length > 0);

  const totalPrice = selectedShowtime
    ? selectedShowtime.price * selectedSeats.length
    : 0;

  return (
    <div>
      <div className="booking-container">
        <div className="booking-header">
          <h1>Đặt vé</h1>
          <div className="booking-steps">
            <div className={`step ${step >= 1 ? "active" : ""}`}>
              <span>1</span> Chọn suất
            </div>
            <div className={`step ${step >= 2 ? "active" : ""}`}>
              <span>2</span> Chọn ghế
            </div>
            <div className={`step ${step >= 3 ? "active" : ""}`}>
              <span>3</span> Xác nhận
            </div>
          </div>
        </div>

        <div className="booking-content">
          <div className="booking-left">
            {step === 1 && (
              <div className="step-content">
                <h2>Chọn suất chiếu</h2>
                <div className="movie-info-card">
                  <img src={movie.poster} alt={movie.title} />
                  <div>
                    <h3>{movie.title}</h3>
                    <p>{movie.duration} phút</p>
                  </div>
                </div>

                <div className="date-selector">
                  <label>Chọn ngày:</label>
                  <div className="date-buttons">
                    {dates.map((date) => {
                      const dateObj = new Date(date);
                      const dayName = dateObj.toLocaleDateString("vi-VN", {
                        weekday: "short",
                      });
                      const day = dateObj.getDate();
                      const month = dateObj.getMonth() + 1;
                      return (
                        <button
                          key={date}
                          className={`date-btn ${
                            selectedDate === date ? "active" : ""
                          }`}
                          onClick={() => setSelectedDate(date)}
                        >
                          <span>{dayName}</span>
                          <span>{day}/{month}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="showtimes-list">
                  {filteredShowtimes.map((theaterGroup) => (
                    <div key={theaterGroup.theater._id} className="theater-group">
                      <h3>{theaterGroup.theater.name}</h3>
                      <p className="theater-address">
                        {theaterGroup.theater.address}
                      </p>
                      <div className="showtime-buttons">
                        {theaterGroup.showtimes.map((st) => (
                          <button
                            key={st._id}
                            className={`showtime-btn ${
                              selectedShowtime?._id === st._id ? "selected" : ""
                            } ${st.availableSeats === 0 ? "sold-out" : ""}`}
                            onClick={() => handleSelectShowtime(st)}
                            disabled={st.availableSeats === 0}
                          >
                            <span>{st.time}</span>
                            <span className="price">
                              {st.price.toLocaleString("vi-VN")}đ
                            </span>
                            <span className="seats">
                              {st.availableSeats} ghế trống
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="step-content">
                <h2>Chọn ghế</h2>
                <div className="seat-selection">
                  <div className="screen">Màn hình</div>
                  <div className="seats-grid">
                    {availableSeats.map((seat) => {
                      const isBooked = bookedSeats.includes(seat);
                      const isSelected = selectedSeats.includes(seat);
                      return (
                        <button
                          key={seat}
                          className={`seat ${isBooked ? "booked" : ""} ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() => handleSelectSeat(seat)}
                          disabled={isBooked}
                        >
                          {seat}
                        </button>
                      );
                    })}
                  </div>
                  <div className="seat-legend">
                    <div>
                      <span className="seat-sample available"></span>
                      <span>Có sẵn</span>
                    </div>
                    <div>
                      <span className="seat-sample selected"></span>
                      <span>Đã chọn</span>
                    </div>
                    <div>
                      <span className="seat-sample booked"></span>
                      <span>Đã đặt</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="step-content">
                <h2>Xác nhận thông tin</h2>
                <div className="booking-summary">
                  <div className="summary-item">
                    <h3>Phim:</h3>
                    <p>{movie.title}</p>
                  </div>
                  <div className="summary-item">
                    <h3>Rạp:</h3>
                    <p>{selectedShowtime?.theater.name}</p>
                    <p className="address">
                      {selectedShowtime?.theater.address}
                    </p>
                  </div>
                  <div className="summary-item">
                    <h3>Suất chiếu:</h3>
                    <p>
                      {new Date(selectedShowtime?.date).toLocaleDateString(
                        "vi-VN"
                      )}{" "}
                      - {selectedShowtime?.time}
                    </p>
                  </div>
                  <div className="summary-item">
                    <h3>Ghế đã chọn:</h3>
                    <p>{selectedSeats.join(", ")}</p>
                  </div>
                  <div className="summary-item">
                    <h3>Tổng tiền:</h3>
                    <p className="total-price">
                      {totalPrice.toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="booking-right">
            <div className="booking-summary-card">
              <h3>Tóm tắt</h3>
              {selectedShowtime && (
                <>
                  <div className="summary-row">
                    <span>Phim:</span>
                    <span>{movie.title}</span>
                  </div>
                  <div className="summary-row">
                    <span>Rạp:</span>
                    <span>{selectedShowtime.theater.name}</span>
                  </div>
                  <div className="summary-row">
                    <span>Ngày:</span>
                    <span>
                      {new Date(selectedShowtime.date).toLocaleDateString(
                        "vi-VN"
                      )}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Giờ:</span>
                    <span>{selectedShowtime.time}</span>
                  </div>
                  {selectedSeats.length > 0 && (
                    <>
                      <div className="summary-row">
                        <span>Ghế:</span>
                        <span>{selectedSeats.join(", ")}</span>
                      </div>
                      <div className="summary-row">
                        <span>Số lượng:</span>
                        <span>{selectedSeats.length} vé</span>
                      </div>
                    </>
                  )}
                  <div className="summary-total">
                    <span>Tổng cộng:</span>
                    <span>{totalPrice.toLocaleString("vi-VN")}đ</span>
                  </div>
                </>
              )}
            </div>

            <div className="booking-actions">
              {step > 1 && (
                <button
                  className="btn-back"
                  onClick={() => setStep(step - 1)}
                >
                  Quay lại
                </button>
              )}
              {step < 3 ? (
                <button
                  className="btn-continue"
                  onClick={handleContinue}
                  disabled={
                    (step === 1 && !selectedShowtime) ||
                    (step === 2 && selectedSeats.length === 0)
                  }
                >
                  Tiếp tục
                </button>
              ) : (
                <button
                  className="btn-payment"
                  onClick={handleCreateBooking}
                  disabled={bookingLoading}
                >
                  {bookingLoading ? "Đang xử lý..." : "Thanh toán"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;

