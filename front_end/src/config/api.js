// API Configuration
// Có thể thay đổi port bằng cách tạo file .env với VITE_API_URL=http://localhost:5137
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5137";

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
    GET_CURRENT_USER: `${API_BASE_URL}/api/auth/me`,
    UPDATE_PROFILE: `${API_BASE_URL}/api/auth/profile`,
  },
  // Movie endpoints
  MOVIES: {
    GET_ALL: `${API_BASE_URL}/api/movies`,
    GET_BY_ID: (id) => `${API_BASE_URL}/api/movies/${id}`,
    SEARCH: `${API_BASE_URL}/api/movies/search`,
    THEATERS: `${API_BASE_URL}/api/movies/theaters`,
    GET_TOP: (limit = 10) => `${API_BASE_URL}/api/movies/top?limit=${limit}`,
  },
  // Wishlist endpoints
  WISHLIST: {
    GET: `${API_BASE_URL}/api/auth/wishlist`,
    ADD: `${API_BASE_URL}/api/auth/wishlist`,
    REMOVE: (movieId) => `${API_BASE_URL}/api/auth/wishlist/${movieId}`,
  },
  // Showtime endpoints
  SHOWTIMES: {
    GET_BY_MOVIE: (movieId) => `${API_BASE_URL}/api/showtimes/movie/${movieId}`,
    CREATE: `${API_BASE_URL}/api/showtimes`,
  },
  // Review endpoints
  REVIEWS: {
    GET_BY_MOVIE: (movieId) => `${API_BASE_URL}/api/reviews/movie/${movieId}`,
    CREATE: (movieId) => `${API_BASE_URL}/api/reviews/movie/${movieId}`,
    DELETE: (reviewId) => `${API_BASE_URL}/api/reviews/${reviewId}`,
  },
  // Booking endpoints
  BOOKINGS: {
    CREATE: `${API_BASE_URL}/api/bookings`,
    GET_MY_BOOKINGS: `${API_BASE_URL}/api/bookings/my-bookings`,
    GET_STATS: `${API_BASE_URL}/api/bookings/stats`,
    GET_BY_ID: (bookingId) => `${API_BASE_URL}/api/bookings/${bookingId}`,
    UPDATE_PAYMENT: (bookingId) => `${API_BASE_URL}/api/bookings/${bookingId}/payment`,
    CANCEL: (bookingId) => `${API_BASE_URL}/api/bookings/${bookingId}`,
  },
  // Admin (MySQL) endpoints
  ADMIN: {
    MOVIES: {
      LIST: `${API_BASE_URL}/api/admin/movies`,
      CREATE: `${API_BASE_URL}/api/admin/movies`,
      UPDATE: (id) => `${API_BASE_URL}/api/admin/movies/${id}`,
      DELETE: (id) => `${API_BASE_URL}/api/admin/movies/${id}`,
    },
    THEATERS: {
      LIST: `${API_BASE_URL}/api/admin/theaters`,
      CREATE: `${API_BASE_URL}/api/admin/theaters`,
      UPDATE: (id) => `${API_BASE_URL}/api/admin/theaters/${id}`,
      DELETE: (id) => `${API_BASE_URL}/api/admin/theaters/${id}`,
    },
    SHOWTIMES: {
      LIST: `${API_BASE_URL}/api/admin/showtimes`,
      CREATE: `${API_BASE_URL}/api/admin/showtimes`,
      UPDATE: (id) => `${API_BASE_URL}/api/admin/showtimes/${id}`,
      DELETE: (id) => `${API_BASE_URL}/api/admin/showtimes/${id}`,
    },
  },
};

export default API_BASE_URL;

