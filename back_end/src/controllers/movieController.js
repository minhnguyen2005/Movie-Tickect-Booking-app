import Movie from "../models/Movie.js";
import { mysqlPool } from "../services/mysql.js";

const getExistingCast = (movie) =>
  Array.isArray(movie?.cast)
    ? movie.cast
        .map((person) => {
          const name = String(person?.name || "").trim();
          if (!name) {
            return null;
          }

          return {
            name,
            role: String(person?.role || "Dien vien").trim() || "Dien vien",
            image: String(person?.image || "").trim(),
          };
        })
        .filter(Boolean)
    : [];

const getMovieMetadataMaps = async (rows = []) => {
  const byId = new Map();
  const byTitle = new Map();

  if (!Array.isArray(rows) || rows.length === 0) {
    return { byId, byTitle };
  }

  const ids = rows
    .map((row) => Number(row.id))
    .filter((id) => Number.isFinite(id) && id > 0);
  const titles = rows
    .map((row) => String(row.title || "").trim())
    .filter(Boolean);
  const conditions = [];

  if (ids.length > 0) {
    conditions.push({ mysqlMovieId: { $in: ids } });
  }

  if (titles.length > 0) {
    conditions.push({ title: { $in: titles } });
  }

  if (conditions.length === 0) {
    return { byId, byTitle };
  }

  const mongoMovies = await Movie.find({ $or: conditions })
    .select("mysqlMovieId title director language genre cast")
    .lean();

  mongoMovies.forEach((movie) => {
    if (Number.isFinite(Number(movie.mysqlMovieId))) {
      byId.set(Number(movie.mysqlMovieId), movie);
    }

    if (movie.title) {
      byTitle.set(movie.title, movie);
    }
  });

  return { byId, byTitle };
};

const mergeMovieWithMetadata = (movie, metadataMaps) => {
  const metadata =
    metadataMaps.byId.get(Number(movie.id)) ||
    metadataMaps.byTitle.get(String(movie.title || "").trim()) ||
    null;

  return {
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
    director: String(metadata?.director || ""),
    language: String(metadata?.language || ""),
    genre: Array.isArray(metadata?.genre) ? metadata.genre : [],
    cast: getExistingCast(metadata),
    theaters: [],
    createdAt: movie.created_at,
    updatedAt: movie.updated_at,
  };
};

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
    const metadataMaps = await getMovieMetadataMaps(rows);
    const movies = rows.map((movie) => mergeMovieWithMetadata(movie, metadataMaps));

    res.status(200).json({
      success: true,
      data: {
        movies,
        count: movies.length,
      },
    });
  } catch (error) {
    console.error("Loi khi lay phim tu MySQL:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Loi server khi lay danh sach phim",
    });
  }
};

export const searchMovies = async (req, res) => {
  try {
    const { title, genre, theater } = req.query;

    let sql = "SELECT * FROM movies WHERE is_showing = 1";
    const params = [];

    if (title) {
      sql += " AND title LIKE ?";
      params.push(`%${title}%`);
    }

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
    const metadataMaps = await getMovieMetadataMaps(rows);
    let movies = rows.map((movie) => mergeMovieWithMetadata(movie, metadataMaps));

    if (genre) {
      const normalizedGenre = String(genre).trim().toLowerCase();
      movies = movies.filter((movie) =>
        Array.isArray(movie.genre)
          ? movie.genre.some((item) =>
              String(item).toLowerCase().includes(normalizedGenre)
            )
          : false
      );
    }

    res.status(200).json({
      success: true,
      data: {
        movies,
        count: movies.length,
      },
    });
  } catch (error) {
    console.error("Loi khi tim kiem phim tu MySQL:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Loi server khi tim kiem phim",
    });
  }
};

export const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await mysqlPool.query("SELECT * FROM movies WHERE id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay phim",
      });
    }

    const metadataMaps = await getMovieMetadataMaps(rows);
    const movie = mergeMovieWithMetadata(rows[0], metadataMaps);

    res.status(200).json({
      success: true,
      data: {
        movie,
      },
    });
  } catch (error) {
    console.error("Loi khi lay chi tiet phim tu MySQL:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Loi server khi lay thong tin phim",
    });
  }
};

export const getTopMovies = async (req, res) => {
  try {
    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;

    const [rows] = await mysqlPool.query(
      `SELECT * FROM movies
       WHERE is_showing = 1
       ORDER BY rating DESC, release_date DESC
       LIMIT ?`,
      [limit]
    );

    const metadataMaps = await getMovieMetadataMaps(rows);
    const movies = rows.map((movie) => mergeMovieWithMetadata(movie, metadataMaps));

    res.status(200).json({
      success: true,
      data: {
        movies,
        count: movies.length,
      },
    });
  } catch (error) {
    console.error("Loi khi lay top phim tu MySQL:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Loi server khi lay top phim",
    });
  }
};

export const getAllTheaters = async (req, res) => {
  try {
    const [rows] = await mysqlPool.query(
      "SELECT * FROM theaters WHERE is_active = 1 ORDER BY name ASC"
    );

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
    console.error("Loi khi lay rap tu MySQL:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Loi server khi lay danh sach rap",
    });
  }
};
