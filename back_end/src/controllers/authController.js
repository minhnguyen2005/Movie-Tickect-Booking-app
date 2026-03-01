import User from "../models/User.js";
import Movie from "../models/Movie.js";
import { generateToken, generateResetToken } from "../utils/jwt.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../utils/validationSchemas.js";
import bcrypt from "bcryptjs";
import { sendResetPasswordEmail } from "../services/emailService.js";

// Đăng ký
export const register = async (req, res) => {
  try {
    // Validation với yup
    let validatedData;
    try {
      validatedData = await registerSchema.validate(req.body, {
        abortEarly: false,
      });
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message:
          validationError.errors?.[0] ||
          validationError.message ||
          "Dữ liệu không hợp lệ",
      });
    }

    const { email, password, fullName, phone } = validatedData;

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email đã được sử dụng",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Tạo user mới
    const userData = {
      email,
      password: hashedPassword,
      fullName,
    };

    // Chỉ thêm phone nếu có giá trị
    if (phone && phone.trim().length > 0) {
      userData.phone = phone.trim();
    }

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi đăng ký",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Tạo tài khoản admin bằng secret (dùng 1 lần hoặc cho dev)
export const createAdmin = async (req, res) => {
  try {
    const { email, password, fullName, secret } = req.body;

    if (!email || !password || !fullName || !secret) {
      return res.status(400).json({
        success: false,
        message: "Thiếu email, password, fullName hoặc secret",
      });
    }

    if (!process.env.ADMIN_SECRET) {
      return res.status(500).json({
        success: false,
        message: "ADMIN_SECRET chưa được cấu hình trên server",
      });
    }

    if (secret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({
        success: false,
        message: "Secret không hợp lệ",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email đã tồn tại",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const adminUser = await User.create({
      email,
      password: hashedPassword,
      fullName,
      role: "admin",
    });

    res.status(201).json({
      success: true,
      message: "Tạo tài khoản admin thành công",
      data: {
        user: {
          id: adminUser._id,
          email: adminUser.email,
          fullName: adminUser.fullName,
          role: adminUser.role,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi tạo admin",
    });
  }
};

// Đăng nhập
export const login = async (req, res) => {
  try {
    let validatedData;
    try {
      validatedData = await loginSchema.validate(req.body, {
        abortEarly: false,
      });
    } catch (validationError) {
      return res.status(200).json({
        success: false,
        code: "INVALID_CREDENTIALS",
        message: "Sai email hoặc mật khẩu",
      });
    }

    const { email, password } = validatedData;
    const invalidLoginMessage = "Sai email hoặc mật khẩu";

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(200).json({
        success: false,
        code: "INVALID_CREDENTIALS",
        message: invalidLoginMessage,
      });
    }

    if (!user.isActive) {
      return res.status(200).json({
        success: false,
        code: "ACCOUNT_LOCKED",
        message: "Tài khoản đã bị khóa",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(200).json({
        success: false,
        code: "INVALID_CREDENTIALS",
        message: invalidLoginMessage,
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi đăng nhập",
    });
  }
};

// Lấy thông tin user hiện tại
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          avatar: user.avatar || "",
          gender: user.gender || "",
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi lấy thông tin user",
    });
  }
};

// Quên mật khẩu
export const forgotPassword = async (req, res) => {
  try {
    const validatedData = await forgotPasswordSchema.validate(req.body);

    const { email } = validatedData;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu",
      });
    }

    const resetToken = generateResetToken();
    const resetPasswordExpire = Date.now() + 60 * 60 * 1000;

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = resetPasswordExpire;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/reset-password/${resetToken}`;

    try {
      await sendResetPasswordEmail(user.email, resetUrl);

      res.status(200).json({
        success: true,
        message: "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu",
      });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      const isConfigError = emailError.message.includes("chưa được cấu hình");

      return res.status(isConfigError ? 503 : 500).json({
        success: false,
        message:
          emailError.message || "Không thể gửi email. Vui lòng thử lại sau.",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi xử lý quên mật khẩu",
    });
  }
};

// Reset mật khẩu
export const resetPassword = async (req, res) => {
  try {
    const validatedData = await resetPasswordSchema.validate(req.body);

    const { token, password } = validatedData;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpire");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Đặt lại mật khẩu thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi đặt lại mật khẩu",
    });
  }
};

export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "wishlist",
      "title poster genre duration ageRating rating",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        movies: user.wishlist || [],
        count: user.wishlist ? user.wishlist.length : 0,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi lấy wishlist",
    });
  }
};

// Thêm một phim vào wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { movieId } = req.body;

    if (!movieId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu movieId",
      });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phim",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $addToSet: { wishlist: movieId }, // không thêm trùng
      },
      { new: true },
    ).populate("wishlist", "title poster genre duration ageRating rating");

    return res.status(200).json({
      success: true,
      message: "Đã thêm phim vào danh sách muốn xem",
      data: {
        movies: user.wishlist,
        count: user.wishlist.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi thêm vào wishlist",
    });
  }
};

// Xóa một phim khỏi wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const { movieId } = req.params;

    if (!movieId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu movieId",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: { wishlist: movieId },
      },
      { new: true },
    ).populate("wishlist", "title poster genre duration ageRating rating");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Đã xóa phim khỏi danh sách muốn xem",
      data: {
        movies: user.wishlist,
        count: user.wishlist.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi xóa khỏi wishlist",
    });
  }
};

// Cập nhật thông tin profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullName, phone, avatar, gender } = req.body;

    // Tìm user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    // Cập nhật các trường được cung cấp
    if (fullName !== undefined) {
      user.fullName = fullName.trim();
    }
    if (phone !== undefined) {
      user.phone = phone ? phone.trim() : "";
    }
    if (avatar !== undefined) {
      user.avatar = avatar;
    }
    if (gender !== undefined) {
      // Validate gender
      if (gender && !["male", "female", "other", ""].includes(gender)) {
        return res.status(400).json({
          success: false,
          message: "Giới tính không hợp lệ",
        });
      }
      user.gender = gender;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin thành công",
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          avatar: user.avatar || "",
          gender: user.gender || "",
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi cập nhật profile",
    });
  }
};
