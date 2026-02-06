import Movie from "../models/Movie.js";
import Theater from "../models/Theater.js";
import { mysqlPool } from "../services/mysql.js";

// Lấy tất cả phim từ MySQL
export const getAllMovies = async (req, res) => {
  try {
    const { isShowing } = req.query;

    let sql = "SELECT * FROM movies WHERE 1=1";
    const params = [];

    if (isShowing !== undefined) {
      sql += " AND is_showing = ?";
      params.push(isShowing === "true" ? 1 : 0);
    }

    sql += " ORDER BY release_date DESC";

    const [rows] = await mysqlPool.query(sql, params);

    // Format lại để tương thích với frontend (giống format MongoDB)
    const movies = rows.map((movie) => ({
      _id: movie.id.toString(), // Convert INT id thành string để tương thích
      id: movie.id.toString(),
      title: movie.title,
      description: movie.description,
      trailer: movie.trailer_url || "",
      poster: movie.poster_url || "",
      bannerImage: movie.banner_url || "",
      rating: parseFloat(movie.rating) || 0,
      duration: movie.duration,
      ageRating: movie.age_rating || "K",
      releaseDate: movie.release_date,
      isShowing: movie.is_showing === 1,
      genre: [], // MySQL không có genre, có thể thêm sau
      cast: [], // MySQL không có cast, có thể thêm sau
      theaters: [], // MySQL không có theaters array, có thể join sau
      createdAt: movie.created_at,
      updatedAt: movie.updated_at,
    }));

    res.status(200).json({
      success: true,
      data: {
        movies,
        count: movies.length,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy phim từ MySQL:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi lấy danh sách phim",
    });
  }
};

// Tìm kiếm phim từ MySQL
export const searchMovies = async (req, res) => {
  try {
    const { title, genre, theater } = req.query;

    let sql = "SELECT * FROM movies WHERE is_showing = 1";
    const params = [];

    // Tìm kiếm theo tên phim (case-insensitive, partial match)
    if (title) {
      sql += " AND title LIKE ?";
      params.push(`%${title}%`);
    }

    // Tìm kiếm theo rạp (join với showtimes và theaters)
    if (theater) {
      sql += ` AND id IN (
        SELECT DISTINCT movie_id FROM showtimes s
        JOIN theaters t ON s.theater_id = t.id
        WHERE t.name LIKE ? AND t.is_active = 1
      )`;
      params.push(`%${theater}%`);
    }

    sql += " ORDER BY release_date DESC";

    const [rows] = await mysqlPool.query(sql, params);

    // Format lại để tương thích với frontend
    const movies = rows.map((movie) => ({
      _id: movie.id.toString(),
      id: movie.id.toString(),
      title: movie.title,
      description: movie.description,
      trailer: movie.trailer_url || "",
      poster: movie.poster_url || "",
      bannerImage: movie.banner_url || "",
      rating: parseFloat(movie.rating) || 0,
      duration: movie.duration,
      ageRating: movie.age_rating || "K",
      releaseDate: movie.release_date,
      isShowing: movie.is_showing === 1,
      genre: [],
      cast: [],
      theaters: [],
      createdAt: movie.created_at,
      updatedAt: movie.updated_at,
    }));

    res.status(200).json({
      success: true,
      data: {
        movies,
        count: movies.length,
      },
    });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm phim từ MySQL:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi tìm kiếm phim",
    });
  }
};

// Lấy chi tiết phim theo ID từ MySQL
export const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await mysqlPool.query("SELECT * FROM movies WHERE id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phim",
      });
    }

    const movieData = rows[0];

    // Format lại để tương thích với frontend
    const movie = {
      _id: movieData.id.toString(),
      id: movieData.id.toString(),
      title: movieData.title,
      description: movieData.description,
      trailer: movieData.trailer_url || "",
      poster: movieData.poster_url || "",
      bannerImage: movieData.banner_url || "",
      rating: parseFloat(movieData.rating) || 0,
      duration: movieData.duration,
      ageRating: movieData.age_rating || "K",
      releaseDate: movieData.release_date,
      isShowing: movieData.is_showing === 1,
      genre: [],
      cast: [],
      theaters: [],
      createdAt: movieData.created_at,
      updatedAt: movieData.updated_at,
    };

    res.status(200).json({
      success: true,
      data: {
        movie,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết phim từ MySQL:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi lấy thông tin phim",
    });
  }
};

// Lấy top phim từ MySQL (theo rating)
export const getTopMovies = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const [rows] = await mysqlPool.query(
      `SELECT * FROM movies 
       WHERE is_showing = 1 
       ORDER BY rating DESC, release_date DESC 
       LIMIT ?`,
      [parseInt(limit)]
    );

    // Format lại để tương thích với frontend
    const movies = rows.map((movie) => ({
      _id: movie.id.toString(),
      id: movie.id.toString(),
      title: movie.title,
      description: movie.description,
      trailer: movie.trailer_url || "",
      poster: movie.poster_url || "",
      bannerImage: movie.banner_url || "",
      rating: parseFloat(movie.rating) || 0,
      duration: movie.duration,
      ageRating: movie.age_rating || "K",
      releaseDate: movie.release_date,
      isShowing: movie.is_showing === 1,
      genre: [],
      cast: [],
      theaters: [],
      createdAt: movie.created_at,
      updatedAt: movie.updated_at,
    }));

    res.status(200).json({
      success: true,
      data: {
        movies,
        count: movies.length,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy top phim từ MySQL:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi lấy top phim",
    });
  }
};

// Lấy tất cả rạp từ MySQL
export const getAllTheaters = async (req, res) => {
  try {
    const [rows] = await mysqlPool.query(
      "SELECT * FROM theaters WHERE is_active = 1 ORDER BY name ASC"
    );

    // Format lại để tương thích với frontend
    const theaters = rows.map((theater) => ({
      _id: theater.id.toString(),
      id: theater.id.toString(),
      name: theater.name,
      address: theater.address,
      city: theater.city,
      phone: theater.phone || "",
      isActive: theater.is_active === 1,
      createdAt: theater.created_at,
      updatedAt: theater.updated_at,
    }));

    res.status(200).json({
      success: true,
      data: {
        theaters,
        count: theaters.length,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy rạp từ MySQL:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi lấy danh sách rạp",
    });
  }
};
