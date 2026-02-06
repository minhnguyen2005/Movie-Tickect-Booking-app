import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/Navbar.css";
import { FaFilm } from "react-icons/fa";
import { FiSearch, FiBell, FiMapPin } from "react-icons/fi";

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Hiện background khi scroll > 0
      setIsScrolled(window.scrollY > 0);
    };

    onScroll(); // set state on initial render
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?title=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <nav className={`navbar ${isScrolled ? "scrolled" : ""}`}>
      <div className="nav-left">
        <Link to="/" className="logo">
          <span className="logo-icon">
            <FaFilm />
          </span>
          CinemaHub
        </Link>
        <ul className="nav-links">
          <li>
            <Link to="/">Lịch chiếu</Link>
          </li>
          <li>
            <Link to="/">Phim</Link>
          </li>
          <li>
            <Link to="/">Rạp</Link>
          </li>
          <li>
            <Link to="/">Ưu đãi</Link>
          </li>
        </ul>
      </div>

      <div className="nav-right">
        {user && user.role === "admin" && (
          <button
            className="admin-badge"
            type="button"
            onClick={() => navigate("/admin")}
          >
            Admin
          </button>
        )}
        <form className="search-box" onSubmit={handleSearch}>
          <span className="search-icon">
            <FiSearch />
          </span>
          <input
            type="text"
            placeholder="Tìm phim, rạp, diễn viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {user ? (
          <>
            <div
              className="notification-icon"
              onClick={() => navigate("/notifications")}
            >
              <FiBell />
            </div>
            <div
              className="profile-avatar-nav"
              onClick={() => navigate("/profile")}
            >
              <div className="avatar-circle-nav">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" />
                ) : (
                  user.fullName
                  ? user.fullName.charAt(0).toUpperCase()
                    : user.email.charAt(0).toUpperCase()
                )}
              </div>
            </div>
          </>
        ) : (
          <Link to="/login" className="btn-login">
            Đăng nhập
          </Link>
        )}

        <div className="location">
          <span className="map-icon">
            <FiMapPin />
          </span>
          Hà Nội
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
