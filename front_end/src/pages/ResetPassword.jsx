import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "../styles/ResetPassword.css";
import Loading from "../components/Loading";
import { API_ENDPOINTS } from "../config/api";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/forgot-password");
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || "Đặt lại mật khẩu thành công!");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setErrorMessage(data.message || "Token không hợp lệ hoặc đã hết hạn");
      }
    } catch (error) {
      setErrorMessage("Lỗi kết nối Server.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-card">
        <h2 className="reset-password-title">Đặt lại mật khẩu</h2>
        <p className="reset-password-subtitle">
          Nhập mật khẩu mới của bạn
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Mật khẩu mới</label>
            <div className="input-wrapper">
              <span className="icon"></span>
              <input
                type="password"
                placeholder="Nhập mật khẩu mới"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="icon-right"></span>
            </div>
          </div>

          <div className="input-group">
            <label>Xác nhận mật khẩu</label>
            <div className="input-wrapper">
              <span className="icon"></span>
              <input
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <span className="icon-right"></span>
            </div>
          </div>

          {errorMessage && (
            <div className="error-alert">{errorMessage}</div>
          )}

          {successMessage && (
            <div className="success-alert">{successMessage}</div>
          )}

          <button type="submit" className="btn-submit">
            Đặt lại mật khẩu
          </button>
        </form>

        <div className="back-to-login">
          <Link to="/login">Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;



