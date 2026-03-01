import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaFilm } from "react-icons/fa";
import { FiBell, FiMapPin, FiSearch } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import "../styles/Navbar.css";

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const isShowtimesRoute = location.pathname.startsWith("/showtimes");

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();

    if (!searchQuery.trim()) {
      return;
    }

    navigate(`/search?title=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery("");
  };

  const getAvatarLabel = () => {
    if (!user) {
      return "";
    }

    if (user.avatar) {
      return null;
    }

    if (user.fullName) {
      return user.fullName.charAt(0).toUpperCase();
    }

    return user.email.charAt(0).toUpperCase();
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
            <Link
              to="/showtimes"
              className={isShowtimesRoute ? "active" : ""}
            >
              {"L\u1ECBch chi\u1EBFu"}
            </Link>
          </li>
          <li>
            <Link to="/">Phim</Link>
          </li>
          <li>
            <Link to="/">{"R\u1EA1p"}</Link>
          </li>
          <li>
            <Link to="/">{"\u01AFu \u0111\u00E3i"}</Link>
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
            placeholder={
              "T\u00ECm phim, r\u1EA1p, di\u1EC5n vi\u00EAn..."
            }
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
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
                  getAvatarLabel()
                )}
              </div>
            </div>
          </>
        ) : (
          <Link to="/login" className="btn-login">
            {"\u0110\u0103ng nh\u1EADp"}
          </Link>
        )}

        <div className="location">
          <span className="map-icon">
            <FiMapPin />
          </span>
          {"H\u00E0 N\u1ED9i"}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
