import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

// Tạo JWT token
export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Token không hợp lệ hoặc đã hết hạn");
  }
};

// Tạo reset password token (sử dụng crypto để tạo token ngẫu nhiên)
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

