import Showtime from "../models/Showtime.js";
import Movie from "../models/Movie.js";
import Theater from "../models/Theater.js";
import Booking from "../models/Booking.js";
import { mysqlPool } from "../services/mysql.js";
import mongoose from "mongoose";

// Lấy lịch chiếu theo phim (từ cả MongoDB và MySQL)
export const getShowtimesByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { date } = req.query; // Optional: filter by date

    // Lấy movie - có thể từ MongoDB hoặc MySQL
    let movie = null;
    let movieTitle = null;
    let isMysqlMovie = false;

    // Kiểm tra xem movieId có phải là ObjectId hợp lệ không
    if (mongoose.Types.ObjectId.isValid(movieId) && movieId.length === 24) {
      // Tìm trong MongoDB
      movie = await Movie.findById(movieId);
      if (movie) {
        movieTitle = movie.title;
      }
    }

    // Nếu không tìm thấy trong MongoDB, thử tìm trong MySQL
    if (!movie) {
      try {
        const [mysqlRows] = await mysqlPool.query(
          "SELECT * FROM movies WHERE id = ?",
          [movieId]
        );
        if (mysqlRows.length > 0) {
          isMysqlMovie = true;
          movieTitle = mysqlRows[0].title;
          // Tạo object movie giả để tương thích
          movie = {
            _id: movieId,
            title: movieTitle,
            duration: mysqlRows[0].duration || 120,
          };
        }
      } catch (mysqlError) {
        console.error("Lỗi khi tìm phim trong MySQL:", mysqlError);
      }
    }

    if (!movie || !movieTitle) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phim",
      });
    }

    // Lấy showtimes từ MySQL
    let mysqlQuery = `
      SELECT s.*, m.title AS movie_title, t.name AS theater_name, t.address AS theater_address, t.city AS theater_city
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      JOIN theaters t ON s.theater_id = t.id
      WHERE s.is_active = 1 AND m.title = ?
    `;
    let mysqlParams = [movieTitle];

    // Nếu có date, filter theo ngày
    if (date) {
      mysqlQuery += " AND DATE(s.show_date) = ?";
      mysqlParams.push(date);
    } else {
      // Mặc định lấy từ hôm nay trở đi
      const today = new Date().toISOString().split("T")[0];
      mysqlQuery += " AND DATE(s.show_date) >= ?";
      mysqlParams.push(today);
    }

    mysqlQuery += " ORDER BY s.show_date, s.show_time";

    const [mysqlShowtimes] = await mysqlPool.query(mysqlQuery, mysqlParams);

    // Lấy showtimes từ MongoDB để tính ghế đã đặt
    let mongoShowtimes = [];
    let bookedSeatsMap = {};
    
    // Nếu là phim MongoDB: map theo movieId
    // Nếu là phim MySQL: map theo mysqlId (gắn với showtimes MySQL)
    let mongoQuery = { isActive: true };

    if (!isMysqlMovie && mongoose.Types.ObjectId.isValid(movieId) && movieId.length === 24) {
      mongoQuery.movie = movieId;
    }

    if (isMysqlMovie) {
      // Với phim MySQL, chỉ lấy các showtime có mysqlId trùng với id trong danh sách mysqlShowtimes
      const mysqlIds = mysqlShowtimes.map((st) => st.id.toString());
      if (mysqlIds.length > 0) {
        mongoQuery.mysqlId = { $in: mysqlIds };
      } else {
        mongoQuery = null;
      }
    }

    if (mongoQuery) {
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        mongoQuery.date = { $gte: startOfDay, $lte: endOfDay };
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        mongoQuery.date = { $gte: today };
      }

      mongoShowtimes = await Showtime.find(mongoQuery)
        .populate("theater", "name address city")
        .populate("movie", "title duration")
        .sort({ date: 1, time: 1 });

      // Lấy danh sách ghế đã đặt cho MongoDB showtimes
      const mongoShowtimeIds = mongoShowtimes.map((st) => st._id);
      const bookings = await Booking.find({
        showtime: { $in: mongoShowtimeIds },
        status: { $in: ["pending", "paid"] },
      });

      bookings.forEach((booking) => {
        const stId = booking.showtime.toString();
        if (!bookedSeatsMap[stId]) {
          bookedSeatsMap[stId] = [];
        }
        bookedSeatsMap[stId].push(...booking.seats);
      });
    }

    // Tạo map từ mysqlId -> danh sách ghế đã đặt (tổng hợp từ Mongo showtimes mirror)
    const mysqlBookedSeatsMap = {};
    mongoShowtimes.forEach((st) => {
      if (st.mysqlId) {
        const key = st.mysqlId.toString();
        const stId = st._id.toString();
        const seatsForThisShowtime = bookedSeatsMap[stId] || [];
        if (!mysqlBookedSeatsMap[key]) {
          mysqlBookedSeatsMap[key] = [];
        }
        mysqlBookedSeatsMap[key].push(...seatsForThisShowtime);
      }
    });

    // Format MySQL showtimes để giống MongoDB format
    const formattedMysqlShowtimes = mysqlShowtimes.map((st) => {
      const mysqlIdStr = st.id.toString();
      const bookedFromMirror = mysqlBookedSeatsMap[mysqlIdStr] || [];

      // Loại bỏ trùng lặp ghế
      const uniqueBookedSeats = [...new Set(bookedFromMirror)];

      return {
        _id: `mysql_${st.id}`, // Prefix để phân biệt
        id: st.id,
        movie: {
          _id: movieId, // Dùng movieId (có thể là MySQL ID hoặc MongoDB _id)
          title: st.movie_title,
          duration: movie.duration,
        },
        theater: {
          _id: `theater_${st.theater_id}`,
          name: st.theater_name,
          address: st.theater_address,
          city: st.theater_city,
        },
        date: new Date(st.show_date),
        time: st.show_time,
        price: st.price,
        totalSeats: st.total_seats,
        availableSeats: st.available_seats,
        isActive: st.is_active === 1,
        bookedSeats: uniqueBookedSeats,
      };
    });

    // Combine MongoDB và MySQL showtimes
    const allShowtimes = [
      ...mongoShowtimes.map((st) => {
        const showtimeObj = st.toObject();
        showtimeObj.bookedSeats = bookedSeatsMap[st._id.toString()] || [];
        return showtimeObj;
      }),
      ...formattedMysqlShowtimes,
    ];

    // Nhóm theo rạp
    const groupedByTheater = {};
    allShowtimes.forEach((showtime) => {
      const theaterKey = showtime.theater.name + "_" + showtime.theater.address;
      if (!groupedByTheater[theaterKey]) {
        groupedByTheater[theaterKey] = {
          theater: showtime.theater,
          showtimes: [],
        };
      }
      groupedByTheater[theaterKey].showtimes.push(showtime);
    });

    // Sort showtimes trong mỗi theater
    Object.values(groupedByTheater).forEach((group) => {
      group.showtimes.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA - dateB;
        }
        return a.time.localeCompare(b.time);
      });
    });

    res.status(200).json({
      success: true,
      data: {
        showtimes: Object.values(groupedByTheater),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi lấy lịch chiếu",
    });
  }
};

// Tạo lịch chiếu mới (Admin only - có thể thêm middleware sau)
export const createShowtime = async (req, res) => {
  try {
    const { movieId, theaterId, date, time, price, totalSeats } = req.body;

    // Validate
    if (!movieId || !theaterId || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin",
      });
    }

    // Kiểm tra movie và theater có tồn tại không
    let movie = null;
    let theater = null;

    // Kiểm tra movie - có thể từ MongoDB hoặc MySQL
    if (mongoose.Types.ObjectId.isValid(movieId) && movieId.length === 24) {
      movie = await Movie.findById(movieId);
    }

    // Kiểm tra theater - có thể từ MongoDB hoặc MySQL
    if (mongoose.Types.ObjectId.isValid(theaterId) && theaterId.length === 24) {
      theater = await Theater.findById(theaterId);
    }

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phim",
      });
    }

    if (!theater) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy rạp",
      });
    }

    const showtime = new Showtime({
      movie: movieId,
      theater: theaterId,
      date: new Date(date),
      time,
      price: price || 100000,
      totalSeats: totalSeats || 100,
      availableSeats: totalSeats || 100,
    });

    await showtime.save();
    await showtime.populate("theater", "name address city");
    await showtime.populate("movie", "title duration");

    res.status(201).json({
      success: true,
      data: {
        showtime,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi tạo lịch chiếu",
    });
  }
};

