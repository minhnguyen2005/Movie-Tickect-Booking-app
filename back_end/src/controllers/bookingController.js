import Booking from "../models/Booking.js";
import Showtime from "../models/Showtime.js";
import Movie from "../models/Movie.js";
import Theater from "../models/Theater.js";
import User from "../models/User.js";
import { mysqlPool } from "../services/mysql.js";
import { getIO } from "../services/socket.js";
import crypto from "crypto";

// Hàm tạo mã booking code duy nhất
const generateBookingCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `BK${timestamp}${random}`;
};

// Tạo booking mới
export const createBooking = async (req, res) => {
  try {
    const { showtimeId, seats, ticketType, combo, pointsUsed } = req.body;
    const userId = req.user.id;

    if (!showtimeId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn suất chiếu và ghế",
      });
    }

    // Kiểm tra showtime - có thể từ MongoDB hoặc MySQL
    let showtime = null;
    let isMysqlShowtime = false;
    let mysqlShowtimeId = null;

    // Kiểm tra nếu là MySQL showtime (có prefix "mysql_")
    if (showtimeId.startsWith("mysql_")) {
      isMysqlShowtime = true;
      mysqlShowtimeId = showtimeId.replace("mysql_", "");
      
      // Lấy showtime từ MySQL
      const [mysqlRows] = await mysqlPool.query(
        `SELECT s.*, m.title AS movie_title, m.duration AS movie_duration,
                t.name AS theater_name, t.address AS theater_address, t.city AS theater_city
         FROM showtimes s
         JOIN movies m ON s.movie_id = m.id
         JOIN theaters t ON s.theater_id = t.id
         WHERE s.id = ? AND s.is_active = 1`,
        [mysqlShowtimeId]
      );

      if (mysqlRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy suất chiếu",
        });
      }

      const mysqlSt = mysqlRows[0];
      
      // Tìm movie trong MongoDB để lấy _id
      let movie = await Movie.findOne({ title: mysqlSt.movie_title });
      
      // Nếu không tìm thấy trong MongoDB, tìm trong MySQL và tạo movie tạm
      if (!movie) {
        try {
          const [movieRows] = await mysqlPool.query(
            "SELECT * FROM movies WHERE title = ?",
            [mysqlSt.movie_title]
          );
          
          if (movieRows.length > 0) {
            const mysqlMovie = movieRows[0];
            // Tạo movie tạm trong MongoDB
            movie = new Movie({
              title: mysqlMovie.title,
              description: mysqlMovie.description || "",
              poster: mysqlMovie.poster_url || "",
              bannerImage: mysqlMovie.banner_url || "",
              trailer: mysqlMovie.trailer_url || "",
              rating: parseFloat(mysqlMovie.rating) || 0,
              duration: mysqlMovie.duration || 120,
              ageRating: mysqlMovie.age_rating || "K",
              releaseDate: mysqlMovie.release_date,
              genre: [],
              cast: [],
              isShowing: mysqlMovie.is_showing === 1,
            });
            await movie.save();
          } else {
            return res.status(404).json({
              success: false,
              message: "Không tìm thấy phim trong hệ thống",
            });
          }
        } catch (error) {
          console.error("Lỗi khi tạo movie tạm:", error);
          return res.status(500).json({
            success: false,
            message: "Lỗi khi xử lý thông tin phim",
          });
        }
      }

      // Tìm hoặc tạo theater trong MongoDB
      let theater = await Theater.findOne({ name: mysqlSt.theater_name });
      if (!theater) {
        theater = new Theater({
          name: mysqlSt.theater_name,
          address: mysqlSt.theater_address,
          city: mysqlSt.theater_city,
        });
        await theater.save();
      }

      // Tạo showtime tạm trong MongoDB để booking, lưu kèm mysqlId để map ghế đã đặt
      showtime = new Showtime({
        movie: movie._id,
        theater: theater._id,
        date: new Date(mysqlSt.show_date),
        time: mysqlSt.show_time,
        price: mysqlSt.price,
        totalSeats: mysqlSt.total_seats,
        availableSeats: mysqlSt.available_seats,
        isActive: true,
        mysqlId: mysqlShowtimeId?.toString(),
      });
      await showtime.save();
      await showtime.populate("movie theater");
    } else {
      // Lấy showtime từ MongoDB
      showtime = await Showtime.findById(showtimeId).populate("movie theater");
      if (!showtime) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy suất chiếu",
        });
      }
    }

    if (!showtime.isActive) {
      return res.status(400).json({
        success: false,
        message: "Suất chiếu này đã bị hủy",
      });
    }

    // Kiểm tra ghế có sẵn không
    if (seats.length > showtime.availableSeats) {
      return res.status(400).json({
        success: false,
        message: "Không đủ ghế trống",
      });
    }

    // Kiểm tra ghế đã được đặt chưa
    const existingBookings = await Booking.find({
      showtime: showtime._id,
      status: { $in: ["pending", "paid"] },
    });

    const bookedSeats = existingBookings.flatMap((b) => b.seats);
    const invalidSeats = seats.filter((seat) => bookedSeats.includes(seat));

    if (invalidSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Ghế ${invalidSeats.join(", ")} đã được đặt`,
      });
    }

    // Nếu là MySQL showtime, cập nhật available_seats trong MySQL sau khi booking thành công
    if (isMysqlShowtime && mysqlShowtimeId) {
      // Sẽ cập nhật sau khi booking được tạo thành công
    }

    // Tính giá vé theo loại
    let ticketPrice = showtime.price;
    if (ticketType === "vip") {
      ticketPrice = showtime.price * 1.5; // VIP đắt hơn 50%
    } else if (ticketType === "premium") {
      ticketPrice = showtime.price * 2; // Premium đắt hơn 100%
    }

    // Tính giá combo
    const comboPrice = combo?.comboPrice || 0;
    const comboItems = {
      popcorn: combo?.popcorn || 0,
      drink: combo?.drink || 0,
      comboPrice: comboPrice,
    };

    // Tính tổng tiền
    const ticketsPrice = ticketPrice * seats.length;
    const totalPrice = ticketsPrice + comboPrice;

    // Kiểm tra và trừ điểm nếu có sử dụng
    let pointsToUse = pointsUsed || 0;
    if (pointsToUse > 0) {
      const user = await User.findById(userId);
      if (!user || user.points < pointsToUse) {
        return res.status(400).json({
          success: false,
          message: "Không đủ điểm để sử dụng",
        });
      }
    }

    // Tạo mã booking code
    let bookingCode = generateBookingCode();
    let isUnique = false;
    while (!isUnique) {
      const existing = await Booking.findOne({ bookingCode });
      if (!existing) {
        isUnique = true;
      } else {
        bookingCode = generateBookingCode();
      }
    }

    // Tạo booking - sử dụng showtime._id (có thể là showtime MongoDB mới tạo)
    const booking = new Booking({
      user: userId,
      showtime: showtime._id, // Sử dụng _id của showtime (có thể là mới tạo từ MySQL)
      seats: seats,
      ticketType: ticketType || "standard",
      combo: comboItems,
      totalPrice: totalPrice,
      status: "pending",
      bookingCode: bookingCode,
      pointsUsed: pointsToUse,
      pointsEarned: 0, // Sẽ được tính khi thanh toán
    });

    await booking.save();

    // Emit sự kiện realtime để các client khác cập nhật ghế
    try {
      const io = getIO();
      // Với showtime MySQL, dùng cùng ID logic mà frontend đang dùng (mysql_<id>)
      const logicalShowtimeId = isMysqlShowtime && mysqlShowtimeId
        ? `mysql_${mysqlShowtimeId}`
        : showtime._id.toString();
      const room = `showtime_${logicalShowtimeId}`;
      io.to(room).emit("seatsBooked", {
        showtimeId: logicalShowtimeId,
        seats,
      });
    } catch (socketError) {
      // Không làm fail booking nếu socket có vấn đề
      console.error("Lỗi khi emit sự kiện Socket.IO:", socketError.message);
    }

    // Nếu là MySQL showtime, cập nhật available_seats trong MySQL
    if (isMysqlShowtime && mysqlShowtimeId) {
      try {
        await mysqlPool.query(
          "UPDATE showtimes SET available_seats = available_seats - ? WHERE id = ?",
          [seats.length, mysqlShowtimeId]
        );
        // Cập nhật lại availableSeats trong MongoDB showtime để đồng bộ
        showtime.availableSeats -= seats.length;
        await showtime.save();
      } catch (mysqlError) {
        console.error("Lỗi khi cập nhật MySQL showtime:", mysqlError);
        // Không throw error vì booking đã được tạo thành công
      }
    }

    // Populate để trả về thông tin đầy đủ
    await booking.populate({
      path: "showtime",
      populate: [
        { path: "movie", select: "title poster duration" },
        { path: "theater", select: "name address city" },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Đặt vé thành công",
      data: { booking },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi tạo booking",
    });
  }
};

// Lấy booking của user
export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query; // Cho phép filter theo status (paid, pending, cancelled)

    // Tạo query filter
    const filter = { user: userId };
    
    // Nếu có status filter, chỉ lấy bookings có status đó
    // Nếu không có filter, lấy tất cả bookings (bao gồm cả pending, paid, cancelled)
    // Nhưng thông thường trong lịch sử đặt vé, ta chỉ hiển thị các booking đã thanh toán
    if (status) {
      filter.status = status;
    } else {
      // Mặc định chỉ lấy bookings đã thanh toán hoặc đang pending (chưa hủy)
      filter.status = { $in: ["pending", "paid", "completed"] };
    }

    const bookings = await Booking.find(filter)
      .populate({
        path: "showtime",
        populate: [
          { path: "movie", select: "title poster duration genre rating" },
          { path: "theater", select: "name address city" },
        ],
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { bookings },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi lấy danh sách booking",
    });
  }
};

// Lấy chi tiết booking
export const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId,
    }).populate({
      path: "showtime",
      populate: [
        { path: "movie", select: "title poster duration" },
        { path: "theater", select: "name address city" },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    res.status(200).json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi lấy booking",
    });
  }
};

// Cập nhật trạng thái thanh toán
export const updateBookingPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentMethod, paymentInfo } = req.body;
    const userId = req.user.id;

    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Booking này đã được xử lý",
      });
    }

    // Trừ điểm nếu có sử dụng
    if (booking.pointsUsed > 0) {
      const user = await User.findById(userId);
      if (user && user.points >= booking.pointsUsed) {
        user.points -= booking.pointsUsed;
        await user.save();
      } else {
        return res.status(400).json({
          success: false,
          message: "Không đủ điểm để thanh toán",
        });
      }
    }

    // Tính điểm tích lũy: 1% tổng tiền (làm tròn)
    const pointsEarned = Math.round(booking.totalPrice * 0.01);
    booking.pointsEarned = pointsEarned;

    // Cộng điểm cho user
    const user = await User.findById(userId);
    if (user) {
      user.points = (user.points || 0) + pointsEarned;
      await user.save();
    }

    booking.status = "paid";
    booking.paymentMethod = paymentMethod || "cash";
    booking.paymentInfo = paymentInfo || {};

    // Cập nhật số ghế trống
    const showtime = await Showtime.findById(booking.showtime);
    if (showtime) {
      showtime.availableSeats -= booking.seats.length;
      await showtime.save();
    }

    // Lưu booking vào lịch sử (booking đã có user field nên sẽ tự động được lưu vào lịch sử)
    await booking.save();

    // Đảm bảo booking được lưu đúng cách với đầy đủ thông tin
    // Booking đã được lưu với user reference, nên sẽ tự động xuất hiện trong lịch sử đặt vé

    await booking.populate({
      path: "showtime",
      populate: [
        { path: "movie", select: "title poster duration" },
        { path: "theater", select: "name address city" },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Thanh toán thành công",
      data: { booking },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi cập nhật thanh toán",
    });
  }
};

// Hủy booking
export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking này đã bị hủy",
      });
    }

    if (booking.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Không thể hủy booking đã thanh toán",
      });
    }

    booking.status = "cancelled";
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Hủy booking thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi hủy booking",
    });
  }
};

// Lấy thống kê của user (số phim đã xem, điểm tích lũy, vé sắp tới)
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date(); // Thời điểm hiện tại

    // Lấy tất cả bookings đã thanh toán của user
    const paidBookings = await Booking.find({
      user: userId,
      status: "paid",
    }).populate({
      path: "showtime",
      select: "date time movie",
    });

    // Tính số phim đã xem: các booking có showtime đã qua (ngày + giờ < hiện tại)
    // Mỗi booking đại diện cho một lần xem phim (có thể nhiều ghế nhưng chỉ tính 1 lần)
    const watchedMovies = paidBookings.filter((booking) => {
      if (!booking.showtime || !booking.showtime.date) return false;
      
      // Tạo Date object từ showtime.date và showtime.time
      const showtimeDate = new Date(booking.showtime.date);
      if (booking.showtime.time) {
        // Parse time string (format: "HH:MM")
        const [hours, minutes] = booking.showtime.time.split(":").map(Number);
        showtimeDate.setHours(hours || 0, minutes || 0, 0, 0);
      } else {
        // Nếu không có time, đặt về cuối ngày
        showtimeDate.setHours(23, 59, 59, 999);
      }
      
      // Phim đã xem nếu showtime đã qua
      return showtimeDate < now;
    });

    const moviesWatched = watchedMovies.length;

    // Tính điểm tích lũy: mỗi phim xem được = 500 điểm
    // Nếu chưa xem phim nào thì điểm = 0
    const points = moviesWatched * 500;

    // Tính vé sắp tới: các booking có showtime chưa đến (ngày + giờ >= hiện tại)
    const upcomingTickets = paidBookings.filter((booking) => {
      if (!booking.showtime || !booking.showtime.date) return false;
      
      // Tạo Date object từ showtime.date và showtime.time
      const showtimeDate = new Date(booking.showtime.date);
      if (booking.showtime.time) {
        // Parse time string (format: "HH:MM")
        const [hours, minutes] = booking.showtime.time.split(":").map(Number);
        showtimeDate.setHours(hours || 0, minutes || 0, 0, 0);
      } else {
        // Nếu không có time, đặt về đầu ngày
        showtimeDate.setHours(0, 0, 0, 0);
      }
      
      // Vé sắp tới nếu showtime chưa đến
      return showtimeDate >= now;
    }).length;

    res.status(200).json({
      success: true,
      data: {
        moviesWatched,
        points,
        upcomingTickets,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi lấy thống kê",
    });
  }
};

