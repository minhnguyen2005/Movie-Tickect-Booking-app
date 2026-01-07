import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/Login.css";
import Loading from "../components/Loading";
const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);
        navigate("/");
      } else {
        setErrorMessage(data.message);
      }
    } catch (error) {
      setErrorMessage("Lỗi kết nối Server.");
    }
  };
  if (isLoading) {
    return <Loading />;
  }
  return (
    <div className="login-page">
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

          {errorMessage && <div className="error-alert">{errorMessage}</div>}

          <div className="form-actions">
            <label className="checkbox-container">
              <input type="checkbox" /> Ghi nhớ đăng nhập
            </label>
            <a href="#" className="forgot-pass">
              Quên mật khẩu?
            </a>
          </div>

          <button type="submit" className="btn-submit">
            Đăng nhập
          </button>
        </form>

        <div className="divider">
          <span>Hoặc tiếp tục với</span>
        </div>
        <p className="switch-account">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
