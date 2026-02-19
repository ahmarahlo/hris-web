// Konstanta aplikasi — semua "magic string" disimpan di sini.
// Sesuaikan dengan dokumentasi API Backend.

export const API_CONFIG = {
	BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:3000",
	TIMEOUT: 10000, // 10 detik
};

export const LOADING_DELAY = 500; // Durasi minimal loading dalam ms

export const API_KEY = "hris-api-key-123";

export const ENDPOINTS = {
	AUTH: {
		LOGIN: "/auth/login",
		ME: "/profile",
		LOGOUT: "/auth/logout",
	},
	ATTENDANCE: {
		CLOCK_IN: "/attendance/clock-in",
		CLOCK_OUT: "/attendance/clock-out",
		HISTORY: "/attendance/history",
	},
	LEAVES: {
		LIST: "/leaves/history",
		CREATE: "/leaves",
	},
	DASHBOARD: {
		STATS: "/dashboard",
		PENDING_LEAVES: "/dashboard/pending-leaves",
		ATTENDANCE_TODAY: "/dashboard/attendance-today",
		ATTENDANCE: "/dashboard/attendance",
		LEAVES: "/dashboard/leaves",
		LEAVE_STATS: "/dashboard/leaves/stats",
		PROCESS_LEAVE: (id) => `/dashboard/leaves/${id}/process`,
		EMPLOYEES: "/dashboard/employees",
		EMPLOYEE_DETAIL: (id) => `/dashboard/employees/${id}`,
		RESET_PASSWORD: (id) => `/dashboard/employees/${id}/reset-password`,
	},
};

export const EMPLOYEE_ENDPOINTS = {
	LIST: "/employees",
	DETAIL: (id) => `/employees/${id}`,
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
