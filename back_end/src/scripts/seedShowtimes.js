import mongoose from "mongoose";
import dotenv from "dotenv";
import Showtime from "../models/Showtime.js";
import Movie from "../models/Movie.js";
import Theater from "../models/Theater.js";
import connectDB from "../services/database.js";

dotenv.config();

const seedShowtimes = async () => {
  try {
    await connectDB();
    console.log("Đang kết nối database...");

    // Lấy tất cả phim và rạp
    const movies = await Movie.find({ isShowing: true });
    const theaters = await Theater.find({ isActive: true });

    if (movies.length === 0 || theaters.length === 0) {
      console.log("Không có phim hoặc rạp nào. Vui lòng seed movies và theaters trước.");
      process.exit(1);
    }

    // Xóa tất cả showtimes cũ
    await Showtime.deleteMany({});
    console.log("Đã xóa showtimes cũ");

    const showtimes = [];
    // Thêm nhiều khung giờ hơn cho đa dạng
    const times = [
      "08:00", "09:30", "11:00", "12:30", 
      "14:00", "15:30", "17:00", "18:30", 
      "20:00", "21:30", "23:00"
    ];
    const prices = [80000, 90000, 100000, 110000, 120000, 130000]; // Giá vé từ 80k đến 130k

    // Tạo showtimes cho 14 ngày tới (2 tuần)
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);
      date.setHours(0, 0, 0, 0);

      // Mỗi phim có showtimes ở nhiều rạp
      movies.forEach((movie, movieIndex) => {
        // Mỗi phim có showtimes ở 3-4 rạp (tăng từ 2-3)
        const numTheaters = 3 + Math.floor(Math.random() * 2);
        const startIndex = movieIndex % theaters.length;
        const theatersForMovie = [];
        
        for (let i = 0; i < numTheaters; i++) {
          theatersForMovie.push(theaters[(startIndex + i) % theaters.length]);
        }

        theatersForMovie.forEach((theater) => {
          // Mỗi rạp có 4-6 suất chiếu mỗi ngày (tăng từ 3-4)
          const numShowtimes = 4 + Math.floor(Math.random() * 3);
          const selectedTimes = times
            .sort(() => Math.random() - 0.5)
            .slice(0, numShowtimes)
            .sort(); // Sắp xếp lại theo thứ tự thời gian

          selectedTimes.forEach((time) => {
            const totalSeats = 100 + Math.floor(Math.random() * 50); // 100-150 ghế
            // Tăng số ghế đã đặt cho các suất chiếu buổi tối (phổ biến hơn)
            const isEvening = parseInt(time.split(':')[0]) >= 18;
            const bookedSeats = isEvening 
              ? Math.floor(Math.random() * 50) + 20 // 20-70 ghế đã đặt cho buổi tối
              : Math.floor(Math.random() * 30); // 0-30 ghế đã đặt cho buổi sáng/chiều
            const availableSeats = totalSeats - bookedSeats;
            const price = prices[Math.floor(Math.random() * prices.length)];

            showtimes.push({
              movie: movie._id,
              theater: theater._id,
              date: new Date(date),
              time: time,
              price: price,
              availableSeats: availableSeats,
              totalSeats: totalSeats,
              isActive: true,
            });
          });
        });
      });
    }

    await Showtime.insertMany(showtimes);
    console.log(`Đã tạo ${showtimes.length} showtimes thành công!`);

    process.exit(0);
  } catch (error) {
    console.error("Lỗi khi seed showtimes:", error);
    process.exit(1);
  }
};

seedShowtimes();

