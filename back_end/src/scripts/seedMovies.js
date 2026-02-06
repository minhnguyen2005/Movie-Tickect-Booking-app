import mongoose from "mongoose";
import dotenv from "dotenv";
import Movie from "../models/Movie.js";
import Theater from "../models/Theater.js";
import connectDB from "../services/database.js";

dotenv.config();

// Base URL cho assets (sẽ được serve từ backend)
const ASSETS_BASE_URL =
  process.env.ASSETS_BASE_URL || "http://localhost:5137/assets";

const movies = [
  {
    title: "Dune: Hành Tinh Cát - Phần 2",
    description:
      "Paul Atreides hợp tác với Chani và người Fremen trên hành trình trả thù những kẻ đã hủy hoại gia đình mình. Cuộc chiến vì tương lai của Arrakis đã bắt đầu.",
    trailer: "https://www.youtube.com/embed/Way9Dexny3w",
    cast: [
      {
        name: "Timothée Chalamet",
        role: "Diễn viên",
        image:
          "https://image.tmdb.org/t/p/w500/7I7VT8Y8X1Qw3hL8YQKXZ5Z5Z5Z5.jpg",
      },
      {
        name: "Zendaya",
        role: "Diễn viên",
        image:
          "https://image.tmdb.org/t/p/w500/6XYLiMxHAaCsoyrVo38LBWMw2p8.jpg",
      },
      {
        name: "Denis Villeneuve",
        role: "Đạo diễn",
        image:
          "https://image.tmdb.org/t/p/w500/5YZbUmjbMa3ClvSW1Wj3Gw6gLfV.jpg",
      },
    ],
    rating: 8.5,
    poster: `${ASSETS_BASE_URL}/img/teaser_poster_dune_2_7.jpg`,
    bannerImage: `${ASSETS_BASE_URL}/img/teaser_poster_dune_2_7.jpg`,
    genre: ["Khoa học viễn tưởng", "Hành động", "Phiêu lưu"],
    duration: 166,
    ageRating: "T13",
    releaseDate: new Date("2024-03-01"),
    isShowing: true,
  },
  {
    title: "Kung Fu Panda 4",
    description:
      "Po phải đối mặt với một kẻ thù mới đáng sợ - The Chameleon - một phù thủy biến hình có khả năng biến thành bất kỳ động vật nào. Để đánh bại cô ta, Po cần sự giúp đỡ của một con cáo tên Zhen.",
    trailer: "https://www.youtube.com/embed/_inKs4eeHiI",
    cast: [
      {
        name: "Jack Black",
        role: "Lồng tiếng",
        image:
          "https://image.tmdb.org/t/p/w500/rtCx0fiYxJVhzXXdwZE2XRTfVKE.jpg",
      },
      {
        name: "Awkwafina",
        role: "Lồng tiếng",
        image:
          "https://image.tmdb.org/t/p/w500/l5AKkg3H1QhMuXmTTmq1EyjyiRb.jpg",
      },
      {
        name: "Mike Mitchell",
        role: "Đạo diễn",
        image:
          "https://image.tmdb.org/t/p/w500/5YZbUmjbMa3ClvSW1Wj3Gw6gLfV.jpg",
      },
    ],
    rating: 7.2,
    poster: `${ASSETS_BASE_URL}/img/KungFuPanda4.jpg`,
    bannerImage: `${ASSETS_BASE_URL}/img/kungfupanda4.jpg`,
    genre: ["Hoạt hình", "Hành động", "Hài"],
    duration: 94,
    ageRating: "T13",
    releaseDate: new Date("2024-03-08"),
    isShowing: true,
  },
  {
    title: "Godzilla x Kong: Đế Chế Mới",
    description:
      "Kong và Godzilla phải hợp tác để đối mặt với một mối đe dọa khổng lồ ẩn náu trong lòng Trái Đất, đe dọa sự tồn tại của cả hai loài và nhân loại.",
    trailer: "https://www.youtube.com/embed/lV1OOlGwExM",
    cast: [
      {
        name: "Rebecca Hall",
        role: "Diễn viên",
        image:
          "https://image.tmdb.org/t/p/w500/2lEC3Hy1MlB0kXlslwkCzJbph2B.jpg",
      },
      {
        name: "Brian Tyree Henry",
        role: "Diễn viên",
        image:
          "https://image.tmdb.org/t/p/w500/6XYLiMxHAaCsoyrVo38LBWMw2p8.jpg",
      },
      {
        name: "Adam Wingard",
        role: "Đạo diễn",
        image:
          "https://image.tmdb.org/t/p/w500/5YZbUmjbMa3ClvSW1Wj3Gw6gLfV.jpg",
      },
    ],
    rating: 7.0,
    poster: `${ASSETS_BASE_URL}/img/GodzillaxKongĐế Chế Mới.jpg`,
    bannerImage: `${ASSETS_BASE_URL}/img/GodzillaxKongĐế Chế Mới.jpg`,
    genre: ["Hành động", "Khoa học viễn tưởng", "Phiêu lưu"],
    duration: 115,
    ageRating: "K",
    releaseDate: new Date("2024-03-29"),
    isShowing: true,
  },
  {
    title: "Quật Mộ Trùng Ma",
    description:
      "Một nhóm thầy phong thủy được thuê để di dời một ngôi mộ cổ, nhưng họ không biết rằng việc làm này sẽ giải phóng một linh hồn ác độc đang đe dọa tính mạng của họ.",
    trailer: "https://www.youtube.com/embed/example",
    cast: [
      {
        name: "Choi Min-sik",
        role: "Diễn viên",
        image:
          "https://image.tmdb.org/t/p/w500/5YZbUmjbMa3ClvSW1Wj3Gw6gLfV.jpg",
      },
      {
        name: "Kim Go-eun",
        role: "Diễn viên",
        image:
          "https://image.tmdb.org/t/p/w500/5YZbUmjbMa3ClvSW1Wj3Gw6gLfV.jpg",
      },
      {
        name: "Jang Jae-hyun",
        role: "Đạo diễn",
        image:
          "https://image.tmdb.org/t/p/w500/5YZbUmjbMa3ClvSW1Wj3Gw6gLfV.jpg",
      },
    ],
    rating: 8.1,
    poster: `${ASSETS_BASE_URL}/img/exhuma.jpeg`,
    bannerImage: `${ASSETS_BASE_URL}/img/exhuma.jpeg`,
    genre: ["Kinh dị", "Bí ẩn", "Tâm lý"],
    duration: 134,
    ageRating: "T18",
    releaseDate: new Date("2024-02-22"),
    isShowing: true,
  },
  {
    title: "Thanh Xuân 18x2",
    description:
      "Câu chuyện tình yêu đẹp đẽ giữa một chàng trai 18 tuổi và một cô gái 36 tuổi, được kể lại qua góc nhìn của người đàn ông 40 tuổi nhìn lại quá khứ.",
    trailer: "https://www.youtube.com/embed/example",
    cast: [
      {
        name: "Hsu Guang-han",
        role: "Diễn viên",
        image:
          "https://image.tmdb.org/t/p/w500/5YZbUmjbMa3ClvSW1Wj3Gw6gLfV.jpg",
      },
      {
        name: "Kō Shibasaki",
        role: "Diễn viên",
        image:
          "https://image.tmdb.org/t/p/w500/5YZbUmjbMa3ClvSW1Wj3Gw6gLfV.jpg",
      },
      {
        name: "Michihito Fujii",
        role: "Đạo diễn",
        image:
          "https://image.tmdb.org/t/p/w500/5YZbUmjbMa3ClvSW1Wj3Gw6gLfV.jpg",
      },
    ],
    rating: 7.8,
    poster: `${ASSETS_BASE_URL}/img/18x2.jpg`,
    bannerImage: `${ASSETS_BASE_URL}/img/18x2.jpg`,
    genre: ["Tình cảm", "Chính kịch"],
    duration: 120,
    ageRating: "T16",
    releaseDate: new Date("2024-03-14"),
    isShowing: true,
  },
  {
    title: "Oppenheimer",
    description:
      "Câu chuyện về J. Robert Oppenheimer, nhà vật lý học đứng đầu dự án Manhattan, người đã phát triển bom nguyên tử đầu tiên trong Thế chiến II.",
    trailer: "https://www.youtube.com/embed/uYPbbksJxIg",
    cast: [
      {
        name: "Cillian Murphy",
        role: "Diễn viên",
        image:
          "https://image.tmdb.org/t/p/w500/r7Dfg9aRZ78gJsmDlCirXXlPwdn.jpg",
      },
      {
        name: "Emily Blunt",
        role: "Diễn viên",
        image:
          "https://image.tmdb.org/t/p/w500/5YZbUmjbMa3ClvSW1Wj3Gw6gLfV.jpg",
      },
      {
        name: "Christopher Nolan",
        role: "Đạo diễn",
        image:
          "https://image.tmdb.org/t/p/w500/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg",
      },
    ],
    rating: 8.8,
    poster: `${ASSETS_BASE_URL}/img/Oppenheimer.jpg`,
    bannerImage: `${ASSETS_BASE_URL}/img/Oppenheimer.jpg`,
    genre: ["Chính kịch", "Lịch sử", "Tiểu sử"],
    duration: 180,
    ageRating: "T16",
    releaseDate: new Date("2023-07-21"),
    isShowing: true,
  },
];

const theaters = [
  {
    name: "CGV Vincom Center",
    address: "72 Lê Thánh Tôn, Quận 1",
    city: "Hồ Chí Minh",
    phone: "1900 6017",
  },
  {
    name: "CGV Landmark 81",
    address: "208 Nguyễn Hữu Cảnh, Quận Bình Thạnh",
    city: "Hồ Chí Minh",
    phone: "1900 6017",
  },
  {
    name: "CGV Crescent Mall",
    address: "101 Tôn Dật Tiên, Quận 7",
    city: "Hồ Chí Minh",
    phone: "1900 6017",
  },
  {
    name: "CGV Pandora City",
    address: "1/1 Trường Chinh, Quận 12",
    city: "Hồ Chí Minh",
    phone: "1900 6017",
  },
  {
    name: "Lotte Cinema Đà Nẵng",
    address: "910A Ngô Quyền, Quận Sơn Trà",
    city: "Đà Nẵng",
    phone: "1900 1099",
  },
  {
    name: "CGV Hà Nội",
    address: "191 Bà Triệu, Quận Hai Bà Trưng",
    city: "Hà Nội",
    phone: "1900 6017",
  },
];

const seedMovies = async () => {
  try {
    await connectDB();

    // Xóa dữ liệu cũ
    await Movie.deleteMany({});
    await Theater.deleteMany({});
    console.log("Đã xóa dữ liệu cũ");

    // Thêm theaters
    const insertedTheaters = await Theater.insertMany(theaters);
    console.log(`Đã thêm ${insertedTheaters.length} rạp vào database`);

    // Gán theaters cho movies (mỗi phim sẽ có 2-3 rạp ngẫu nhiên)
    const moviesWithTheaters = movies.map((movie, index) => {
      // Phân bổ theaters cho các phim
      let movieTheaters = [];
      if (index % 3 === 0) {
        // Phim 0, 3: CGV Vincom, CGV Landmark
        movieTheaters = [
          insertedTheaters[0]._id,
          insertedTheaters[1]._id,
          insertedTheaters[3]._id,
        ];
      } else if (index % 3 === 1) {
        // Phim 1, 4: CGV Crescent, CGV Pandora, Lotte Đà Nẵng
        movieTheaters = [
          insertedTheaters[2]._id,
          insertedTheaters[3]._id,
          insertedTheaters[4]._id,
        ];
      } else {
        // Phim 2, 5: Tất cả rạp
        movieTheaters = insertedTheaters.map((t) => t._id);
      }
      return {
        ...movie,
        theaters: movieTheaters,
      };
    });

    // Thêm phim mới
    const insertedMovies = await Movie.insertMany(moviesWithTheaters);
    console.log(`Đã thêm ${insertedMovies.length} phim vào database`);

    process.exit(0);
  } catch (error) {
    console.error("Lỗi khi seed dữ liệu:", error);
    process.exit(1);
  }
};

seedMovies();
