import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Kiểm tra xem email có được cấu hình không
const isEmailConfigured = () => {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
};

// Tạo transporter cho email (chỉ khi có credentials)
let transporter = null;

if (isEmailConfigured()) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
} else {
  console.warn(
    " Email service chưa được cấu hình. EMAIL_USER và EMAIL_PASSWORD cần được thiết lập trong .env"
  );
}

// Gửi email reset password
export const sendResetPasswordEmail = async (email, resetUrl) => {
  if (!isEmailConfigured()) {
    console.warn(
      ` Email service chưa được cấu hình. Reset URL cho ${email}: ${resetUrl}`
    );
    throw new Error(
      "Email service chưa được cấu hình. Vui lòng liên hệ quản trị viên."
    );
  }

  if (!transporter) {
    throw new Error("Email transporter chưa được khởi tạo");
  }

  try {
    const mailOptions = {
      from: `"Movie Ticket Booking" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Đặt lại mật khẩu",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Đặt lại mật khẩu</h2>
          <p>Xin chào,</p>
          <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
          <p>Vui lòng click vào link bên dưới để đặt lại mật khẩu:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4CAF50; 
                      color: white; 
                      padding: 12px 30px; 
                      text-decoration: none; 
                      border-radius: 5px;
                      display: inline-block;">
              Đặt lại mật khẩu
            </a>
          </div>
          <p>Link này sẽ hết hạn sau 1 giờ.</p>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Đây là email tự động, vui lòng không trả lời email này.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(` Email reset password đã được gửi đến ${email}`);
    return true;
  } catch (error) {
    console.error("Lỗi gửi email:", error);
    throw new Error(`Không thể gửi email đặt lại mật khẩu: ${error.message}`);
  }
};
