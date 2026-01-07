const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoute = require("./routes/auth.js");

const app = express();
dotenv.config();

app.use(express.json());
app.use(cors());
app.use("./routes/auth.js", authRoute);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Đã kết nối tới MongoDB");

    app.listen(PORT, () => {
      console.log(`Server đang chạy tại http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Lỗi kết nối MongoDB:", error.message);

    if (error.message.includes("buffering timed out")) {
      console.log(
        " Gợi ý: Kiểm tra lại Network Access (IP Whitelist) trên MongoDB Atlas."
      );
    }
  }
};

startServer();
