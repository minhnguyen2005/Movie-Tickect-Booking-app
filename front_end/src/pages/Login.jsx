import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/Login.css";
import Loading from "../components/Loading";
import { API_ENDPOINTS } from "../config/api";
const Login = ({ initialMode = "login" }) => {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [registerError, setRegisterError] = useState("");

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    setRegisterError("");
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        login(data.data.user, data.data.token);
        navigate("/");
      } else {
        setErrorMessage(data.message || "Đăng nhập thất bại");
      }
    } catch (error) {
      setErrorMessage("Lỗi kết nối Server.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError("");
    setIsLoading(true);

    if (registerData.password !== registerData.confirmPassword) {
      setIsLoading(false);
      setRegisterError("Mật khẩu xác nhận không khớp!");
      return;
    }

    try {
      const res = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: registerData.fullName,
          email: registerData.email,
          password: registerData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRegisterError(data.message || "Đăng ký thất bại!");
      } else {
        alert("Đăng ký thành công! Vui lòng đăng nhập.");
        // Chuyển về tab login sau khi đăng ký
        setMode("login");
      }
    } catch (err) {
      setRegisterError("Không thể kết nối đến Server");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }
  return (
    <div className="login-page">
      <div className="auth-wrapper">
        <div
          className={`auth-slider ${
            mode === "register" ? "show-register" : "show-login"
          }`}
        >
          {/* LOGIN SIDE - LEFT */}
          <div className="auth-slide">
            <div className="login-card">
              <h2 className="login-title">Đăng nhập</h2>
              <p className="login-subtitle">
                Chào mừng trở lại! Vui lòng nhập thông tin.
              </p>

              <form onSubmit={handleLogin}>
                <div className="input-group">
                  <label>Email</label>
                  <div className="input-wrapper">
                    <span className="icon"></span>
                    <input
                      type="email"
                      placeholder="tenban@example.com"
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Mật khẩu</label>
                  <div className="input-wrapper">
                    <span className="icon"></span>
                    <input
                      type="password"
                      placeholder="Nhập mật khẩu"
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <span className="icon-right"></span>
                  </div>
                </div>

                {errorMessage && (
                  <div className="error-alert">{errorMessage}</div>
                )}

                <div className="form-actions">
                  <label className="checkbox-container">
                    <input type="checkbox" /> Ghi nhớ đăng nhập
                  </label>
                  <Link to="/forgot-password" className="forgot-pass">
                    Quên mật khẩu?
                  </Link>
                </div>

                <button type="submit" className="btn-submit">
                  Đăng nhập
                </button>
              </form>

              <div className="divider">
                <span>Hoặc</span>
              </div>
              <p className="switch-account">
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setMode("register")}
                >
                  Đăng ký ngay
                </button>
              </p>
            </div>
          </div>

          {/* REGISTER SIDE - RIGHT */}
          <div className="auth-slide">
            <div className="register-card">
              <div className="register-info-mini">
                <div className="brand">CinemaWorld</div>
                <span className="badge-new">Thành viên mới</span>
                <h1>
                  Tạo tài khoản mới &{" "}
                  <span className="highlight">trải nghiệm điện ảnh</span>
                </h1>
              </div>

              <form onSubmit={handleRegister} className="register-form">
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    placeholder="Nhập họ tên"
                    className="dark-input"
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        fullName: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="email@vidu.com"
                    className="dark-input"
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Mật khẩu</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="dark-input"
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        password: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="dark-input"
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                {registerError && (
                  <div className="error-alert">{registerError}</div>
                )}

                <div className="terms-check">
                  <input type="checkbox" id="terms" required />
                  <label htmlFor="terms">
                    Tôi đồng ý với các điều khoản và chính sách của hệ thống.
                  </label>
                </div>

                <button type="submit" className="btn-register">
                  Đăng ký
                </button>
              </form>

              <div className="auth-footer">
                <p>
                  Đã có tài khoản?{" "}
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setMode("login")}
                  >
                    Đăng nhập
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
