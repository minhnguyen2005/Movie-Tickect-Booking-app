import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Footer.css";
import {
  FaFacebook,
  FaInstagram,
  FaYoutube,
  FaTwitter,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaGlobe,
} from "react-icons/fa";

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      alert("Cảm ơn bạn đã đăng ký nhận tin!");
      setEmail("");
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Top Section */}
        <div className="footer-top">
          <div className="footer-brand">
            <h3 className="footer-logo">CinemaWorld</h3>
            <p className="footer-tagline">
              Trải nghiệm điện ảnh đỉnh cao với hệ thống rạp hiện đại bậc nhất.
              Đặt vé nhanh chóng, ưu đãi ngập tràn.
            </p>
            <div className="footer-social">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Facebook"
              >
                <FaFacebook />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="YouTube"
              >
                <FaYoutube />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Twitter"
              >
                <FaTwitter />
              </a>
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4 className="footer-column-title">CinemaWorld</h4>
              <ul className="footer-link-list">
                <li>
                  <Link to="/about">Về chúng tôi</Link>
                </li>
                <li>
                  <Link to="/theaters">Hệ thống rạp</Link>
                </li>
                <li>
                  <Link to="/careers">Tuyển dụng</Link>
                </li>
                <li>
                  <Link to="/contact">Liên hệ</Link>
                </li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-column-title">Hỗ trợ</h4>
              <ul className="footer-link-list">
                <li>
                  <Link to="/faq">Câu hỏi thường gặp</Link>
                </li>
                <li>
                  <Link to="/terms">Điều khoản sử dụng</Link>
                </li>
                <li>
                  <Link to="/privacy">Chính sách bảo mật</Link>
                </li>
                <li>
                  <Link to="/support">Chăm sóc khách hàng</Link>
                </li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-column-title">Đăng ký nhận tin</h4>
              <p className="footer-newsletter-desc">
                Nhận thông báo về phim mới và ưu đãi sớm nhất.
              </p>
              <form
                className="footer-newsletter"
                onSubmit={handleNewsletterSubmit}
              >
                <input
                  type="email"
                  placeholder="Email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="newsletter-btn">
                  <FaEnvelope />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <p className="footer-copyright">
              © 2024 CinemaWorld Entertainment. All rights reserved.
            </p>
          </div>
          <div className="footer-bottom-right">
            <div className="footer-language">
              <FaGlobe />
              <select className="language-select">
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

