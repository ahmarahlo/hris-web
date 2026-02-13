import axios from "axios";

// TODO: Aktifkan import di bawah ini jika ingin menggunakan constants
// import { API_CONFIG, STORAGE_KEYS, ENDPOINTS } from "./constants";

// TODO: Pindahkan semua config ini ke file .env (lihat .env.example)
// TODO: Gunakan API_CONFIG dari constants.js daripada hardcode disini
// const API_URL = API_CONFIG.BASE_URL;
const API_URL = "http://109.111.53.197:7090"; // Ganti dengan URL API yang benar
const API_KEY = "INIKEYAPI"; // Ganti dengan API Key yang benar

// ==========================================
// HELPERS & ERROR HANDLING
// ==========================================

// TODO:  Sesuaikan struktur response ini dengan API Backend
// Misal: Backend return { data: {...}, meta: {...}, status: "success" }
export const formatResponse = (response) => {
  return {
    data: response.data?.data || response.data,
    status: response.status,
    message: response.data?.message || "Success",
    meta: response.data?.meta || null,
  };
};

// TODO:  Customize error message based on backend error response standard
export const handleApiError = (error) => {
  let message = "Terjadi kesalahan pada server";

  if (error.response) {
    // Server responded with a status code outside 2xx
    const { status, data } = error.response;
    message = data?.message || `Error ${status}`;

    // TODO: Handle specific error codes
    if (status === 401) {
      message = "Sesi habis, silakan login kembali.";
      // window.location.href = "/login"; // Optional: Force redirect
    } else if (status === 403) {
      message = "Anda tidak memiliki akses.";
    }
  } else if (error.request) {
    // Request made but no response received
    message = "Tidak ada respon dari server. Cek koneksi internet.";
  } else {
    // Something happened in setting up the request
    message = error.message;
  }

  console.error("[API Helper Error]:", message);
  return Promise.reject(new Error(message));
};

// ==========================================
// TEMPLATE AXIOS INTERCEPTOR
// ==========================================

export const apiClient = axios.create({
  baseURL: API_URL,
  // timeout: API_CONFIG.TIMEOUT, // TODO: Gunakan timeout dari constants
  headers: {
    "Content-Type": "application/json",
    // "x-api-key": API_KEY, // Uncomment jika butuh API Key di header
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    // TODO: Ambil token dari storage (localStorage/sessionStorage)
    // const token = localStorage.getItem(STORAGE_KEYS.TOKEN); // Gunakan STORAGE_KEYS dari constants
    // if (token) {
    // 	config.headers.Authorization = `Bearer ${token}`;
    // }
    console.log(`[Request] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    // TODO:  Aktifkan formatResponse jika ingin data yang bersih langsung dari sini
    // return formatResponse(response);
    return response;
  },
  async (error) => {
    // TODO:  Aktifkan handleApiError untuk centralize error handling
    // return handleApiError(error);

    // Fallback error handling (jika handleApiError belum digunakan)
    console.error("[Response Error]", error);
    if (error.response?.status === 401) {
      // Redirect ke login atau refresh token
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// ==========================================
// MOCK API (Existing)
// ==========================================

export const api = {
  // eslint-disable-next-line no-unused-vars
  login: async (email, password) => {
    // TODO: Ganti mock ini dengan call ke apiClient yang hardcode jangan lupa di hapus
    // try {
    // 	const response = await apiClient.post("/auth/login", { email, password });
    // 	const { token, user } = response.data;
    // 	localStorage.setItem("token", token);
    // 	return user;
    // } catch (error) {
    // 	throw error;
    // }

    const role = email.includes("hr") ? "hr" : "employee";
    const user = {
      id: 1,
      name: "Test User",
      email: email,
      role: role,
      token: "access-token",
    };
    return user;
  },

  getMe: async () => {
    // TODO: Ganti mock ini dengan call ke apiClient: sama kayak yang atas tapi pake get profile;
    return {
      id: 1,
      name: "Test User",
      divisi: "UI/UX",
      leaveBalance: 12,
    };
  },

  // Attendance
  getAttendanceToday: async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem(`attendance_${todayStr}`);
    return stored ? JSON.parse(stored) : null;
  },

  clockIn: async (time) => {
    // TODO:  Ganti mock ini dengan call ke apiClient dan ambil url api nya dari file constants
    const todayStr = new Date().toISOString().split("T")[0];
    const data = {
      date: todayStr,
      clockIn: time,
      clockOut: null,
    };
    localStorage.setItem(`attendance_${todayStr}`, JSON.stringify(data));
    return data;
  },

  clockOut: async (time, reason = null) => {
    // TODO: Ganti mock ini dengan call ke apiClient dan ambil url api nya dari file constants
    const todayStr = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem(`attendance_${todayStr}`);
    if (stored) {
      const data = JSON.parse(stored);
      data.clockOut = time;
      if (reason) data.reason = reason;
      localStorage.setItem(`attendance_${todayStr}`, JSON.stringify(data));
      return data;
    }
    throw new Error("Belum Clock In hari ini!");
  },

  getAttendanceHistory: async () => {
    // TODO:  Ganti mock ini dengan call ke apiClient dan ambil url api nya dari file constants
    const localHistory = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("attendance_")) {
        const item = JSON.parse(localStorage.getItem(key));
        localHistory.push(item);
      }
    }

    localHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    return localHistory;
  },

  // Leaves
  getLeaves: async () => {
    // TODO:  Ganti mock ini dengan call ke apiClient dan ambil url api nya dari file constants
    return [];
  },

  createLeave: async () => {
    // TODO:  Ganti mock ini dengan call ke apiClient dan ambil url api nya dari file constants
    return { message: "Success" };
  },
};
