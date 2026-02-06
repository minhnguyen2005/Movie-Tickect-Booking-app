import express from "express";
import { mysqlPool } from "../services/mysql.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import Movie from "../models/Movie.js";

const router = express.Router();

// Tất cả route admin MySQL đều yêu cầu admin đã đăng nhập
router.use(authenticate, authorize("admin"));

// ===== MOVIES =====
router.get("/movies", async (req, res) => {
  try {
    const [rows] = await mysqlPool.query(
      "SELECT * FROM movies ORDER BY created_at DESC"
    );
    res.json({ success: true, data: rows });
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
      const mongoMovie = new Movie({
        title,
        description,
        trailer: trailer_url || "",
        poster: poster_url || "",
        bannerImage: banner_url || "",
        rating: Number(rating) || 0,
        duration: Number(duration) || 0,
        ageRating: age_rating || "K",
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
      `UPDATE movies SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    // Sau khi cập nhật MySQL, lấy lại bản ghi để đồng bộ sang MongoDB
    try {
      const [updatedRows] = await mysqlPool.query(
        "SELECT * FROM movies WHERE id = ?",
        [id]
      );
      const updated = updatedRows[0];

      if (updated) {
        // Tìm movie trong Mongo theo title cũ, nếu không thấy thì theo title mới
        let mongoMovie = null;
        if (existingMovie && existingMovie.title) {
          mongoMovie = await Movie.findOne({ title: existingMovie.title });
        }
        if (!mongoMovie) {
          mongoMovie = await Movie.findOne({ title: updated.title });
        }

        const releaseDateObj = updated.release_date
          ? new Date(updated.release_date)
          : null;

        const mongoPayload = {
          title: updated.title,
          description: updated.description || "",
          trailer: updated.trailer_url || "",
          poster: updated.poster_url || "",
          bannerImage: updated.banner_url || "",
          rating: Number(updated.rating) || 0,
          duration: Number(updated.duration) || 0,
          ageRating: updated.age_rating || "K",
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
    await mysqlPool.query("DELETE FROM movies WHERE id = ?", [id]);
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
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi xóa lịch chiếu (MySQL)",
    });
  }
});

export default router;


