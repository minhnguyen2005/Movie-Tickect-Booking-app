import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Đã kết nối tới MongoDB");
  } catch (error) {
    console.error("Lỗi kết nối MongoDB:", error.message);

    if (error.message.includes("buffering timed out")) {
      console.log(
        "Gợi ý: Kiểm tra lại Network Access (IP Whitelist) trên MongoDB Atlas."
      );
    }
    throw error;
  }
};

export default connectDB;
