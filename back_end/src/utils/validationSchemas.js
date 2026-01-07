import * as yup from "yup";

// Schema validation cho đăng ký
export const registerSchema = yup.object().shape({
  email: yup
    .string()
    .required("Email là bắt buộc")
    .email("Email không hợp lệ")
    .lowercase()
    .trim(),
  password: yup
    .string()
    .required("Mật khẩu là bắt buộc")
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  fullName: yup
    .string()
    .required("Họ tên là bắt buộc")
    .trim()
    .min(2, "Họ tên phải có ít nhất 2 ký tự"),
  phone: yup
    .string()
    .trim()
    .matches(/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ")
    .nullable(),
});

// Schema validation cho đăng nhập
export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required("Email là bắt buộc")
    .email("Email không hợp lệ")
    .lowercase()
    .trim(),
  password: yup.string().required("Mật khẩu là bắt buộc"),
});

// Schema validation cho quên mật khẩu
export const forgotPasswordSchema = yup.object().shape({
  email: yup
    .string()
    .required("Email là bắt buộc")
    .email("Email không hợp lệ")
    .lowercase()
    .trim(),
});
