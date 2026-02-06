import mongoose from "mongoose";
import dotenv from "dotenv";
import Movie from "../models/Movie.js";
import connectDB from "../services/database.js";
import { mysqlPool } from "../services/mysql.js";

dotenv.config();

const migrateMoviesToMySQL = async () => {
  try {
    // Kết nối MongoDB
    await connectDB();
    console.log("Đã kết nối MongoDB");

    // Kiểm tra kết nối MySQL
    const [mysqlRows] = await mysqlPool.query("SELECT 1");
    console.log("Đã kết nối MySQL");

    // Lấy tất cả phim từ MongoDB
    const movies = await Movie.find({});
    console.log(`Tìm thấy ${movies.length} phim trong MongoDB`);

    if (movies.length === 0) {
      console.log("Không có phim nào để migrate");
      process.exit(0);
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Migrate từng phim
    for (const movie of movies) {
      try {
        // Kiểm tra xem phim đã tồn tại trong MySQL chưa (theo title)
        const [existing] = await mysqlPool.query(
          "SELECT id FROM movies WHERE title = ?",
          [movie.title]
        );

        if (existing.length > 0) {
          console.log(`⏭️  Đã bỏ qua: "${movie.title}" (đã tồn tại)`);
          skipCount++;
          continue;
        }

        // Chuyển đổi dữ liệu từ MongoDB sang MySQL format
        const releaseDate = new Date(movie.releaseDate);
        const formattedDate = releaseDate.toISOString().split("T")[0]; // YYYY-MM-DD

        // Insert vào MySQL
        const [result] = await mysqlPool.query(
          `INSERT INTO movies 
          (title, description, trailer_url, poster_url, banner_url, 
           rating, duration, age_rating, release_date, is_showing) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            movie.title,
            movie.description,
            movie.trailer || null,
            movie.poster || null,
            movie.bannerImage || null,
            movie.rating || 0,
            movie.duration,
            movie.ageRating || "K",
            formattedDate,
            movie.isShowing ? 1 : 0,
          ]
        );

        console.log(`✅ Đã thêm: "${movie.title}" (ID MySQL: ${result.insertId})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Lỗi khi migrate phim "${movie.title}":`, error.message);
        errorCount++;
      }
    }

    // Tổng kết
    console.log("\n=== KẾT QUẢ MIGRATE ===");
    console.log(`✅ Thành công: ${successCount} phim`);
    console.log(`⏭️  Đã bỏ qua: ${skipCount} phim (đã tồn tại)`);
    console.log(`❌ Lỗi: ${errorCount} phim`);
    console.log(`📊 Tổng: ${movies.length} phim`);

    process.exit(0);
  } catch (error) {
    console.error("Lỗi khi migrate:", error);
    process.exit(1);
  }
};

migrateMoviesToMySQL();

