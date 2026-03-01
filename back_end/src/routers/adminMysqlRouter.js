import express from "express";
import { mysqlPool } from "../services/mysql.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import Movie from "../models/Movie.js";
import Showtime from "../models/Showtime.js";
import Theater from "../models/Theater.js";
import User from "../models/User.js";

const router = express.Router();

// Tất cả route admin MySQL đều yêu cầu admin đã đăng nhập
router.use(authenticate, authorize("admin"));

const normalizeTextList = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object") {
          return item.name || item.value || "";
        }

        return "";
      })
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeCastList = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          const name = item.trim();
          if (!name) return null;
          return { name, role: "Dien vien", image: "" };
        }

        if (!item || typeof item !== "object") {
          return null;
        }

        const name = String(item.name || "").trim();
        if (!name) {
          return null;
        }

        return {
          name,
          role: String(item.role || "Dien vien").trim() || "Dien vien",
          image: String(item.image || "").trim(),
        };
      })
      .filter(Boolean);
  }

  return normalizeTextList(value).map((name) => ({
    name,
    role: "Dien vien",
    image: "",
  }));
};

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

const buildMongoMovieMetadata = (payload = {}, existingMovie = null) => ({
  director:
    payload.director !== undefined
      ? String(payload.director || "").trim()
      : String(existingMovie?.director || "").trim(),
  language:
    payload.language !== undefined
      ? String(payload.language || "").trim()
      : String(existingMovie?.language || "").trim(),
  genre:
    payload.genre !== undefined
      ? normalizeTextList(payload.genre)
      : Array.isArray(existingMovie?.genre)
        ? existingMovie.genre.filter(Boolean)
        : [],
  cast:
    payload.cast !== undefined
      ? normalizeCastList(payload.cast)
      : getExistingCast(existingMovie),
});

const getAdminMovieMetadataMaps = async (rows = []) => {
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

const mergeAdminMovieWithMetadata = (row, metadataMaps) => {
  const metadata =
    metadataMaps.byId.get(Number(row.id)) ||
    metadataMaps.byTitle.get(String(row.title || "").trim()) ||
    null;

  return {
    ...row,
    director: String(metadata?.director || ""),
    language: String(metadata?.language || ""),
    genre: Array.isArray(metadata?.genre) ? metadata.genre : [],
    cast: getExistingCast(metadata),
  };
};

const buildShowtimeDate = (showDate) => {
  const parsedDate = new Date(showDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
};

const ensureMongoMovieByMysqlId = async (mysqlMovieId) => {
  const normalizedId = Number(mysqlMovieId);

  if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
    return null;
  }

  let movie = await Movie.findOne({ mysqlMovieId: normalizedId });
  const [movieRows] = await mysqlPool.query(
    "SELECT * FROM movies WHERE id = ?",
    [normalizedId]
  );
  const mysqlMovie = movieRows[0] || null;

  if (!mysqlMovie) {
    return movie;
  }

  if (!movie) {
    movie = await Movie.findOne({ title: mysqlMovie.title });
  }

  const releaseDateObj = mysqlMovie.release_date
    ? new Date(mysqlMovie.release_date)
    : null;
  const moviePayload = {
    mysqlMovieId: normalizedId,
    title: mysqlMovie.title,
    description: mysqlMovie.description || "",
    trailer: mysqlMovie.trailer_url || "",
    poster: mysqlMovie.poster_url || "",
    bannerImage: mysqlMovie.banner_url || "",
    rating: Number(mysqlMovie.rating) || 0,
    duration: Number(mysqlMovie.duration) || 0,
    ageRating: mysqlMovie.age_rating || "K",
    releaseDate:
      releaseDateObj && !Number.isNaN(releaseDateObj.getTime())
        ? releaseDateObj
        : new Date(),
    isShowing: Number(mysqlMovie.is_showing) ? true : false,
  };

  if (movie) {
    Object.assign(movie, moviePayload);
    await movie.save();
    return movie;
  }

  const newMovie = new Movie({
    ...moviePayload,
    director: "",
    language: "",
    genre: [],
    cast: [],
  });
  await newMovie.save();
  return newMovie;
};

const ensureMongoTheaterByMysqlId = async (mysqlTheaterId) => {
  const normalizedId = Number(mysqlTheaterId);

  if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
    return null;
  }

  let theater = await Theater.findOne({ mysqlTheaterId: normalizedId });
  const [theaterRows] = await mysqlPool.query(
    "SELECT * FROM theaters WHERE id = ?",
    [normalizedId]
  );
  const mysqlTheater = theaterRows[0] || null;

  if (!mysqlTheater) {
    return theater;
  }

  if (!theater) {
    theater = await Theater.findOne({
      name: mysqlTheater.name,
      address: mysqlTheater.address,
    });
  }

  const theaterPayload = {
    mysqlTheaterId: normalizedId,
    name: mysqlTheater.name,
    address: mysqlTheater.address,
    city: mysqlTheater.city,
    phone: mysqlTheater.phone || "",
    isActive: Number(mysqlTheater.is_active) ? true : false,
  };

  if (theater) {
    Object.assign(theater, theaterPayload);
    await theater.save();
    return theater;
  }

  const newTheater = new Theater(theaterPayload);
  await newTheater.save();
  return newTheater;
};

const syncMongoShowtimeByMysqlId = async (mysqlShowtimeId) => {
  const normalizedId = Number(mysqlShowtimeId);
  const mysqlId = String(mysqlShowtimeId);

  if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
    return null;
  }

  const [showtimeRows] = await mysqlPool.query(
    "SELECT * FROM showtimes WHERE id = ?",
    [normalizedId]
  );
  const mysqlShowtime = showtimeRows[0] || null;

  if (!mysqlShowtime) {
    await Showtime.deleteMany({ mysqlId });
    return null;
  }

  const movie = await ensureMongoMovieByMysqlId(mysqlShowtime.movie_id);
  const theater = await ensureMongoTheaterByMysqlId(mysqlShowtime.theater_id);

  if (!movie || !theater) {
    return null;
  }

  let showtime = await Showtime.findOne({ mysqlId });
  const totalSeats = Number(mysqlShowtime.total_seats) || 100;
  const availableSeats =
    mysqlShowtime.available_seats !== undefined
      ? Number(mysqlShowtime.available_seats)
      : totalSeats;
  const showtimePayload = {
    movie: movie._id,
    theater: theater._id,
    date: buildShowtimeDate(mysqlShowtime.show_date) || new Date(),
    time: mysqlShowtime.show_time,
    price: Number(mysqlShowtime.price) || 0,
    totalSeats,
    availableSeats,
    isActive: Number(mysqlShowtime.is_active) ? true : false,
    mysqlId,
  };

  if (showtime) {
    Object.assign(showtime, showtimePayload);
    await showtime.save();
    return showtime;
  }

  showtime = new Showtime(showtimePayload);
  await showtime.save();
  return showtime;
};

// ===== USERS (MongoDB) =====
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({})
      .select("fullName email phone role isActive gender points createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    const formattedUsers = users.map((user) => ({
      id: user._id,
      fullName: user.fullName || "",
      email: user.email,
      phone: user.phone || "",
      role: user.role || "user",
      isActive: Boolean(user.isActive),
      gender: user.gender || "",
      points: Number(user.points) || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    res.json({ success: true, data: formattedUsers });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Loi khi lay danh sach nguoi dung",
    });
  }
});

// ===== MOVIES =====
router.get("/movies", async (req, res) => {
  try {
    const [rows] = await mysqlPool.query(
      "SELECT * FROM movies ORDER BY created_at DESC"
    );
    const metadataMaps = await getAdminMovieMetadataMaps(rows);
    const movies = rows.map((row) => mergeAdminMovieWithMetadata(row, metadataMaps));
    res.json({ success: true, data: movies });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lấy danh sách phim (MySQL)",
    });
  }
});

router.post("/movies", async (req, res) => {
  try {
    const {
      title,
      description,
      trailer_url,
      poster_url,
      banner_url,
      rating = 0,
      duration,
      age_rating = "K",
      release_date,
      is_showing = 1,
      director = "",
      language = "",
      genre = [],
      cast = [],
    } = req.body;

    if (!title || !description || !duration || !release_date) {
      return res.status(400).json({
        success: false,
        message: "Thiếu dữ liệu bắt buộc (title, description, duration, release_date)",
      });
    }

    const [result] = await mysqlPool.query(
      `INSERT INTO movies 
        (title, description, trailer_url, poster_url, banner_url, rating, duration, age_rating, release_date, is_showing)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        trailer_url || null,
        poster_url || null,
        banner_url || null,
        rating,
        duration,
        age_rating,
        release_date,
        is_showing,
      ]
    );

    // Đồng bộ sang MongoDB để trang phim / API movies sử dụng
    try {
      const releaseDateObj = new Date(release_date);
      const metadata = buildMongoMovieMetadata({
        director,
        language,
        genre,
        cast,
      });
      const mongoMovie = new Movie({
        mysqlMovieId: Number(result.insertId),
        title,
        description,
        trailer: trailer_url || "",
        poster: poster_url || "",
        bannerImage: banner_url || "",
        rating: Number(rating) || 0,
        duration: Number(duration) || 0,
        ageRating: age_rating || "K",
        director: metadata.director,
        language: metadata.language,
        genre: metadata.genre,
        cast: metadata.cast,
        releaseDate: isNaN(releaseDateObj.getTime()) ? undefined : releaseDateObj,
        isShowing: Number(is_showing) ? true : false,
      });
      await mongoMovie.save();
    } catch (mongoError) {
      // Không làm fail API admin nếu đồng bộ Mongo lỗi
      console.error("Lỗi khi đồng bộ phim mới sang MongoDB:", mongoError.message);
    }

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi tạo phim (MySQL)",
    });
  }
});

router.put("/movies/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Lấy dữ liệu phim hiện tại trong MySQL (để biết title cũ)
    const [existingRows] = await mysqlPool.query(
      "SELECT * FROM movies WHERE id = ?",
      [id]
    );

    const existingMovie = existingRows[0] || null;

    if (!existingMovie) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay phim de cap nhat",
      });
    }

    const fields = [
      "title",
      "description",
      "trailer_url",
      "poster_url",
      "banner_url",
      "rating",
      "duration",
      "age_rating",
      "release_date",
      "is_showing",
    ];
    const metadataFields = ["director", "language", "genre", "cast"];
    const hasMetadataUpdates = metadataFields.some(
      (field) => req.body[field] !== undefined
    );

    const updates = [];
    const values = [];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(req.body[f]);
      }
    });

    if (updates.length === 0 && !hasMetadataUpdates) {
      return res.status(400).json({
        success: false,
        message: "Không có dữ liệu để cập nhật",
      });
    }

    if (updates.length > 0) {
      values.push(id);
      await mysqlPool.query(
        `UPDATE movies SET ${updates.join(", ")} WHERE id = ?`,
        values
      );
    }

    // Sau khi cập nhật MySQL, lấy lại bản ghi để đồng bộ sang MongoDB
    try {
      let updated = existingMovie;

      if (updates.length > 0) {
        const [updatedRows] = await mysqlPool.query(
          "SELECT * FROM movies WHERE id = ?",
          [id]
        );
        updated = updatedRows[0] || existingMovie;
      }

      if (updated) {
        // Tìm movie trong Mongo theo title cũ, nếu không thấy thì theo title mới
        let mongoMovie = await Movie.findOne({ mysqlMovieId: Number(id) });
        if (!mongoMovie && existingMovie && existingMovie.title) {
          mongoMovie = await Movie.findOne({ title: existingMovie.title });
        }
        if (!mongoMovie) {
          mongoMovie = await Movie.findOne({ title: updated.title });
        }

        const releaseDateObj = updated.release_date
          ? new Date(updated.release_date)
          : null;
        const metadata = buildMongoMovieMetadata(req.body, mongoMovie);

        const mongoPayload = {
          mysqlMovieId: Number(id),
          title: updated.title,
          description: updated.description || "",
          trailer: updated.trailer_url || "",
          poster: updated.poster_url || "",
          bannerImage: updated.banner_url || "",
          rating: Number(updated.rating) || 0,
          duration: Number(updated.duration) || 0,
          ageRating: updated.age_rating || "K",
          director: metadata.director,
          language: metadata.language,
          genre: metadata.genre,
          cast: metadata.cast,
          releaseDate: releaseDateObj && !isNaN(releaseDateObj.getTime())
            ? releaseDateObj
            : undefined,
          isShowing: Number(updated.is_showing) ? true : false,
        };

        if (mongoMovie) {
          Object.assign(mongoMovie, mongoPayload);
          await mongoMovie.save();
        } else {
          // Nếu chưa tồn tại trong Mongo, tạo mới để frontend có thể hiển thị
          const newMongoMovie = new Movie(mongoPayload);
          await newMongoMovie.save();
        }
      }
    } catch (mongoError) {
      console.error("Lỗi khi đồng bộ cập nhật phim sang MongoDB:", mongoError.message);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi cập nhật phim (MySQL)",
    });
  }
});

router.delete("/movies/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [existingRows] = await mysqlPool.query(
      "SELECT title FROM movies WHERE id = ?",
      [id]
    );
    const existingMovie = existingRows[0] || null;

    await mysqlPool.query("DELETE FROM movies WHERE id = ?", [id]);
    const deleteResult = await Movie.deleteOne({ mysqlMovieId: Number(id) });

    if (deleteResult.deletedCount === 0 && existingMovie?.title) {
      await Movie.deleteOne({ title: existingMovie.title });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi xóa phim (MySQL)",
    });
  }
});

// ===== THEATERS =====
router.get("/theaters", async (req, res) => {
  try {
    const [rows] = await mysqlPool.query(
      "SELECT * FROM theaters ORDER BY created_at DESC"
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lấy danh sách rạp (MySQL)",
    });
  }
});

router.post("/theaters", async (req, res) => {
  try {
    const { name, address, city, phone, is_active = 1 } = req.body;

    if (!name || !address || !city) {
      return res.status(400).json({
        success: false,
        message: "Thiếu dữ liệu bắt buộc (name, address, city)",
      });
    }

    const [result] = await mysqlPool.query(
      `INSERT INTO theaters (name, address, city, phone, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [name, address, city, phone || null, is_active]
    );

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi tạo rạp (MySQL)",
    });
  }
});

router.put("/theaters/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const fields = ["name", "address", "city", "phone", "is_active"];
    const updates = [];
    const values = [];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(req.body[f]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có dữ liệu để cập nhật",
      });
    }

    values.push(id);
    await mysqlPool.query(
      `UPDATE theaters SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi cập nhật rạp (MySQL)",
    });
  }
});

router.delete("/theaters/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await mysqlPool.query("DELETE FROM theaters WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi xóa rạp (MySQL)",
    });
  }
});

// ===== SHOWTIMES =====
router.get("/showtimes", async (req, res) => {
  try {
    const [rows] = await mysqlPool.query(
      `SELECT s.*, m.title AS movie_title, t.name AS theater_name
       FROM showtimes s
       JOIN movies m ON s.movie_id = m.id
       JOIN theaters t ON s.theater_id = t.id
       ORDER BY s.show_date, s.show_time`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lấy danh sách lịch chiếu (MySQL)",
    });
  }
});

router.post("/showtimes", async (req, res) => {
  try {
    const {
      movie_id,
      theater_id,
      show_date,
      show_time,
      price,
      total_seats = 100,
      is_active = 1,
    } = req.body;

    if (!movie_id || !theater_id || !show_date || !show_time || !price) {
      return res.status(400).json({
        success: false,
        message:
          "Thiếu dữ liệu bắt buộc (movie_id, theater_id, show_date, show_time, price)",
      });
    }

    const [result] = await mysqlPool.query(
      `INSERT INTO showtimes
        (movie_id, theater_id, show_date, show_time, price, total_seats, available_seats, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movie_id,
        theater_id,
        show_date,
        show_time,
        price,
        total_seats,
        total_seats,
        is_active,
      ]
    );

    try {
      await syncMongoShowtimeByMysqlId(result.insertId);
    } catch (mongoError) {
      console.error(
        "Loi khi dong bo lich chieu moi sang MongoDB:",
        mongoError.message
      );
    }

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi tạo lịch chiếu (MySQL)",
    });
  }
});

router.put("/showtimes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const fields = [
      "movie_id",
      "theater_id",
      "show_date",
      "show_time",
      "price",
      "total_seats",
      "available_seats",
      "is_active",
    ];
    const updates = [];
    const values = [];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(req.body[f]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có dữ liệu để cập nhật",
      });
    }

    values.push(id);
    await mysqlPool.query(
      `UPDATE showtimes SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    try {
      await syncMongoShowtimeByMysqlId(id);
    } catch (mongoError) {
      console.error(
        "Loi khi dong bo cap nhat lich chieu sang MongoDB:",
        mongoError.message
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi cập nhật lịch chiếu (MySQL)",
    });
  }
});

router.delete("/showtimes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await mysqlPool.query("DELETE FROM showtimes WHERE id = ?", [id]);
    await Showtime.deleteMany({ mysqlId: String(id) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi xóa lịch chiếu (MySQL)",
    });
  }
});

export default router;


