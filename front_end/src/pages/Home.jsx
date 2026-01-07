import React from "react";
import "../styles/Home.css";

import Navbar from "../components/Navbar";
const Home = () => {
  return (
    <div className="home-container">
      {/* Navbar */}
      <Navbar />

      {/* Hero Banner */}
      <header className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <span className="tag-imax">ĐANG CHIẾU IMAX</span>
          <h1 className="hero-title">Dune: Hành Tinh Cát - Phần 2</h1>
          <p className="hero-desc">
            Paul Atreides hợp tác với Chani và người Fremen trên hành trình trả
            thù những kẻ đã hủy hoại gia đình mình.
          </p>
          <div className="hero-btns">
            <button className="btn-primary btn-lg">🎟 Đặt vé ngay</button>
            <button className="btn-secondary btn-lg">▶ Xem Trailer</button>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="filter-bar-container">
        <div className="filter-bar">
          <select>
            <option>Chọn phim</option>
          </select>
          <select>
            <option>Chọn rạp</option>
          </select>
          <select>
            <option>Hôm nay, 24/05</option>
          </select>
          <button className="btn-search">Tìm nhanh</button>
        </div>
      </div>

      {/* Movie List */}
      <section className="section-movies">
        <div className="section-header">
          <h2>Đang Chiếu</h2>
          <a href="#" className="view-all">
            Xem tất cả &rarr;
          </a>
        </div>

        <div className="movie-grid">
          {/* Card 1 */}
          <div className="movie-card">
            <div className="poster-wrapper">
              {/* Thay src bằng ảnh thật của bạn */}
              <img
                src="https://via.placeholder.com/300x450?text=Kung+Fu+Panda"
                alt="Phim"
              />
              <span className="age-tag t13">T13</span>
            </div>
            <h3>Kung Fu Panda 4</h3>
            <p>94' • Hoạt hình</p>
          </div>

          {/* Card 2 */}
          <div className="movie-card">
            <div className="poster-wrapper">
              <img
                src="https://via.placeholder.com/300x450?text=Godzilla"
                alt="Phim"
              />
              <span className="age-tag k">K</span>
            </div>
            <h3>Godzilla x Kong</h3>
            <p>115' • Hành động</p>
          </div>

          {/* Card 3 */}
          <div className="movie-card">
            <div className="poster-wrapper">
              <img
                src="https://via.placeholder.com/300x450?text=Exhuma"
                alt="Phim"
              />
              <span className="age-tag t18">T18</span>
            </div>
            <h3>Quật Mộ Trùng Ma</h3>
            <p>134' • Kinh dị</p>
          </div>

          {/* Card 4 */}
          <div className="movie-card">
            <div className="poster-wrapper">
              <img
                src="https://via.placeholder.com/300x450?text=Romance"
                alt="Phim"
              />
              <span className="age-tag t16">T16</span>
            </div>
            <h3>Thanh Xuân 18x2</h3>
            <p>120' • Tình cảm</p>
          </div>
        </div>
      </section>

      {/* Footer simple */}
      <footer className="footer">
        <p>&copy; 2024 CinemaTix Vietnam. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
