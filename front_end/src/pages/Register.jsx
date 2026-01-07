import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
      } else {
        alert("Đăng ký thành công! Vui lòng đăng nhập.");
        navigate("/login");
      }
    } catch (err) {
      setError("Không thể kết nối đến Server");
    }
  };

  return (
    <div className="register-container">
      <div className="register-wrapper">
        <div className="register-info">
          <div className="brand">CinemaWorld</div>
          <span className="badge-new">Thành viên mới</span>
          <h1>
            Tạo tài khoản mới & <br />{" "}
            <span className="highlight">Trải nghiệm điện ảnh</span>
          </h1>
        </div>

        <div className="register-form-container">
          <h2 className="mobile-title">Đăng ký</h2>
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Họ và tên</label>
              <input
                type="text"
                placeholder="Nhập họ tên"
                className="dark-input"
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
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
                  setFormData({ ...formData, email: e.target.value })
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
                  setFormData({ ...formData, password: e.target.value })
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
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
              />
            </div>

            {error && <div className="error-message"> {error}</div>}

            <div className="terms-check">
              <input type="checkbox" id="terms" required />
              <label htmlFor="terms">Tôi đồng ý với các điều khoản...</label>
            </div>

            <button type="submit" className="btn-register">
              Đăng ký
            </button>
          </form>
          <div className="auth-footer">
            <p>
              Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
