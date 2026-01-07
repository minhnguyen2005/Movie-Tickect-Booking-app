import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/Navbar.css";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="logo">
          <span className="logo-icon">🎬</span> CinemaTix
        </Link>
        <ul className="nav-links">
          <li>
            <Link to="/">Phim</Link>
          </li>
          <li>
            <Link to="/">Rạp</Link>
          </li>
          <li>
            <Link to="/">Sự kiện</Link>
          </li>
          <li>
            <Link to="/">Thành viên</Link>
          </li>
        </ul>
      </div>

      <div className="nav-right">
        <div className="search-box">
          <span className="search-icon"></span>
          <input type="text" placeholder="Tìm phim, rạp..." />
        </div>

        {user ? (
          <div className="user-info">
            <span className="username">Hi, {user.username}</span>
            <button onClick={logout} className="btn-logout">
              Đăng xuất
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn-login">
            Đăng nhập
          </Link>
        )}

        <div className="location">
          <span className="map-icon"></span> Hà Nội
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
