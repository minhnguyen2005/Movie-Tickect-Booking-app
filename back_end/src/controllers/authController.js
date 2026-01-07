import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
} from "../utils/validationSchemas.js";
import bcrypt from "bcryptjs";

// Đăng ký
export const register = async (req, res) => {
  try {
    // Validation với yup
    const validatedData = await registerSchema.validate(req.body);

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
    const user = await User.create({
      email,
      password: hashedPassword,
      fullName,
      phone: phone || "",
    });

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
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi đăng ký",
    });
  }
};

// Đăng nhập
export const login = async (req, res) => {
  try {
    // Validation với yup
    const validatedData = await loginSchema.validate(req.body);

    const { email, password } = validatedData;

    // Tìm user và lấy password để so sánh
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản đã bị khóa",
      });
    }

    // So sánh password
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    // Tạo token
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
    // Validation với yup
    const validatedData = await forgotPasswordSchema.validate(req.body);

    const { email } = validatedData;

    // Tìm user
    const user = await User.findOne({ email });

    if (!user) {
      // Trả về success để không tiết lộ email có tồn tại hay không
      return res.status(200).json({
        success: true,
        message: "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu",
      });
    }

    // TODO: Gửi email với reset token
    // const resetUrl = `${req.protocol}://${req.get("host")}/api/auth/reset-password/${resetToken}`;
    // await sendEmail({
    //   email: user.email,
    //   subject: "Đặt lại mật khẩu",
    //   message: `Link đặt lại mật khẩu: ${resetUrl}`,
    // });

    res.status(200).json({
      success: true,
      message: "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi xử lý quên mật khẩu",
    });
  }
};
