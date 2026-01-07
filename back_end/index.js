import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/services/database.js";
import authRouter from "./src/routers/authRouter.js";

const app = express();
dotenv.config();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/auth", authRouter);
//add more routes here

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Movie Ticket Booking API",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server đang chạy tại http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Lỗi khởi động server:", error.message);
    process.exit(1);
  }
};

startServer();
