// TODO: Gunakan file ini untuk menyimpan semua konstanta agar tidak ada "Magic String" di kode.
// Sesuaikan dengan dokumentasi API Backend.

export const API_CONFIG = {
  // Ambil dari .env, fallback ke localhost jika tidak ada
  BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  TIMEOUT: 10000, // 10 detik
};

export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    ME: "/auth/me",
    LOGOUT: "/auth/logout",
  },
  ATTENDANCE: {
    CLOCK_IN: "/attendance/clock-in",
    CLOCK_OUT: "/attendance/clock-out",
    HISTORY: "/attendance/history",
    TODAY: "/attendance/today",
  },
  LEAVES: {
    LIST: "/leaves",
    CREATE: "/leaves",
    DETAIL: (id) => `/leaves/${id}`, // Contoh dynamic endpoint
  },
  // TODO: Tambahkan endpoint lain seperti Employee, Divisi, dll disini
};

export const USER_ROLES = {
  ADMIN: "admin",
  HR: "hr",
  EMPLOYEE: "employee",
};

export const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user_data",
};
