import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Kết nối pool MySQL dùng cho API admin (phim, rạp, lịch chiếu)
export const mysqlPool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DB || "cinemahub",
  waitForConnections: true,
  connectionLimit: 10,
});


