import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/ForgotPassword.css";
import Loading from "../components/Loading";
import { API_ENDPOINTS } from "../config/api";

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || "Email đã được gửi thành công!");
      } else {
        setErrorMessage(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
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
    <div className="forgot-password-page">
      <div className="forgot-password-card">
        <h2 className="forgot-password-title">Quên mật khẩu</h2>
        <p className="forgot-password-subtitle">
          Nhập email của bạn để nhận link đặt lại mật khẩu
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <div className="input-wrapper">
              <span className="icon"></span>
              <input
                type="email"
                placeholder="tenban@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {errorMessage && (
            <div className="error-alert">{errorMessage}</div>
          )}

          {successMessage && (
            <div className="success-alert">{successMessage}</div>
          )}

          <button type="submit" className="btn-submit">
            Gửi email đặt lại mật khẩu
          </button>
        </form>

        <div className="back-to-login">
          <Link to="/login">Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;



