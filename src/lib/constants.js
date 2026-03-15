// Konstanta aplikasi — semua "magic string" disimpan di sini.
// Sesuaikan dengan dokumentasi API Backend.

export const API_CONFIG = {
	BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:3000",
	TIMEOUT: 30000, // 30 detik
};

export const LOADING_DELAY = 800; // Durasi minimal loading dalam ms

export const API_KEY = import.meta.env.VITE_API_KEY || "fallback-kunci-lokal";

export const ENDPOINTS = {
	AUTH: {
		LOGIN: "/auth/login",
		ME: "/profile",
		LOGOUT: "/auth/logout",
	},
	ATTENDANCE: {
		CHECK_LOCATION: "/attendance/check-location",
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
		ADMINS: "/dashboard/admins",
		ADMIN_DELETE: (id) => `/dashboard/admins/${id}`,
		EMPLOYEES: "/dashboard/employees",
		EMPLOYEE_UPDATE: (id) => `/dashboard/employees/${id}`,
		EMPLOYEE_DETAIL: (id) => `/dashboard/employees/${id}/detail`,
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
	SUPER_ADMIN: "superadmin",
};

export const STORAGE_KEYS = {
	TOKEN: "token",
	USER: "user_data",
};

export const DEPARTMENTS = [
	"IT OPS",
	"HR",
	"UI/UX Designer",
	"QA",
	"System Analyst",
];
