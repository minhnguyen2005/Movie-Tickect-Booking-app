import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import http from "http";
import mysql from "mysql2/promise";
import { fileURLToPath } from "url";
import connectDB from "./src/services/database.js";
import authRouter from "./src/routers/authRouter.js";
import movieRouter from "./src/routers/movieRouter.js";
import showtimeRouter from "./src/routers/showtimeRouter.js";
import reviewRouter from "./src/routers/reviewRouter.js";
import bookingRouter from "./src/routers/bookingRouter.js";
import adminMysqlRouter from "./src/routers/adminMysqlRouter.js";
import { initSocket } from "./src/services/socket.js";

const app = express();
const server = http.createServer(app);
dotenv.config();

// Lấy __dirname trong ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors());

// Serve static files từ thư mục assets
app.use("/assets", express.static(path.join(__dirname, "src", "assets")));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/movies", movieRouter);
app.use("/api/showtimes", showtimeRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/bookings", bookingRouter);

// API admin sử dụng MySQL để quản lý phim, rạp, lịch chiếu
app.use("/api/admin", adminMysqlRouter);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 26665,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Movie Ticket Booking API",
  });
});

const PORT = process.env.PORT || 5137;

const startServer = async () => {
  try {
    await connectDB();

    // Khởi tạo Socket.IO sau khi có server HTTP
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`Server đang chạy tại http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Lỗi khởi động server:", error.message);
    process.exit(1);
  }
};

startServer();
