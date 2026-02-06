import mongoose from "mongoose";
import dotenv from "dotenv";
import Theater from "../models/Theater.js";
import connectDB from "../services/database.js";
import { mysqlPool } from "../services/mysql.js";

dotenv.config();

const migrateTheatersToMySQL = async () => {
  try {
    // Kết nối MongoDB
    await connectDB();
    console.log("Đã kết nối MongoDB");

    // Kiểm tra kết nối MySQL
    const [mysqlRows] = await mysqlPool.query("SELECT 1");
    console.log("Đã kết nối MySQL");

    // Lấy tất cả rạp từ MongoDB
    const theaters = await Theater.find({});
    console.log(`Tìm thấy ${theaters.length} rạp trong MongoDB`);

    if (theaters.length === 0) {
      console.log("Không có rạp nào để migrate");
      process.exit(0);
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Migrate từng rạp
    for (const theater of theaters) {
      try {
        // Kiểm tra xem rạp đã tồn tại trong MySQL chưa (theo name và address)
        const [existing] = await mysqlPool.query(
          "SELECT id FROM theaters WHERE name = ? AND address = ?",
          [theater.name, theater.address]
        );

        if (existing.length > 0) {
          console.log(`⏭️  Đã bỏ qua: "${theater.name}" (đã tồn tại)`);
          skipCount++;
          continue;
        }

        // Insert vào MySQL
        const [result] = await mysqlPool.query(
          `INSERT INTO theaters 
          (name, address, city, phone, is_active) 
          VALUES (?, ?, ?, ?, ?)`,
          [
            theater.name,
            theater.address,
            theater.city,
            theater.phone || null,
            theater.isActive ? 1 : 0,
          ]
        );

        console.log(`✅ Đã thêm: "${theater.name}" (ID MySQL: ${result.insertId})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Lỗi khi migrate rạp "${theater.name}":`, error.message);
        errorCount++;
      }
    }

    // Tổng kết
    console.log("\n=== KẾT QUẢ MIGRATE ===");
    console.log(`✅ Thành công: ${successCount} rạp`);
    console.log(`⏭️  Đã bỏ qua: ${skipCount} rạp (đã tồn tại)`);
    console.log(`❌ Lỗi: ${errorCount} rạp`);
    console.log(`📊 Tổng: ${theaters.length} rạp`);

    process.exit(0);
  } catch (error) {
    console.error("Lỗi khi migrate:", error);
    process.exit(1);
  }
};

migrateTheatersToMySQL();

