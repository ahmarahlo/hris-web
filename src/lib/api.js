import axios from "axios";
import {
	API_CONFIG,
	STORAGE_KEYS,
	ENDPOINTS,
	EMPLOYEE_ENDPOINTS,
	API_KEY,
} from "./constants";

const API_URL = API_CONFIG.BASE_URL;

// ==========================================
// HELPERS & ERROR HANDLING
// ==========================================

/** Menangani error API secara terpusat dan mengembalikan pesan error yang konsisten. */
export const handleApiError = (error) => {
	let message = "Terjadi kesalahan pada server";

	if (error.response) {
		const { status, data } = error.response;
		message = data?.message || `Error ${status}`;

		if (status === 401) {
			message = "Sesi habis, silakan login kembali.";
			localStorage.removeItem(STORAGE_KEYS.TOKEN);
			localStorage.removeItem("user");
		} else if (status === 403) {
			message = "Anda tidak memiliki akses.";
		}
	} else if (error.request) {
		message = "Tidak ada respon dari server. Cek koneksi internet.";
	} else {
		message = error.message;
	}

	console.error("[API Error]:", message);
	if (error.response?.data) {
		console.error("[API Error Data]:", error.response.data);
	}
	return Promise.reject(new Error(message));
};

// ==========================================
// AXIOS INSTANCE & INTERCEPTOR
// ==========================================

export const apiClient = axios.create({
	baseURL: API_URL,
	timeout: API_CONFIG.TIMEOUT,
	headers: {
		"Content-Type": "application/json",
		"X-API-Key": API_KEY,
	},
});

apiClient.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
	(response) => response,
	async (error) => handleApiError(error),
);

// ==========================================
// HELPER: Extract array dari nested API response
// ==========================================

/** Mengekstrak array dari berbagai format response API (langsung array, nested di .data, dsb.) */
const extractArray = (data, label = "API") => {
	if (Array.isArray(data)) return data;
	if (data?.data) {
		if (Array.isArray(data.data)) return data.data;
		if (typeof data.data === "object") {
			const values = Object.values(data.data);
			const arr = values.find((v) => Array.isArray(v));
			if (arr) return arr;
		}
	}
	console.warn(`[${label}] Could not extract array from:`, data);
	return [];
};

// ==========================================
// API METHODS
// ==========================================

export const api = {
	// --- Authentication ---

	login: async (email, password) => {
		const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, {
			email,
			password,
		});
		return response.data;
	},

	changePassword: async (password, oldPassword) => {
		const response = await apiClient.post("/auth/change-password", {
			password,
			oldPassword,
		});
		return response.data;
	},

	/** Mengambil profil user yang sedang login (termasuk sisa cuti). */
	getMe: async () => {
		const response = await apiClient.get(ENDPOINTS.AUTH.ME);
		const profileData = response.data?.data || response.data;

		return {
			...profileData,
			id: profileData.id || profileData.employee_id || profileData.user_id,
			leaveBalance: profileData.leave_balance ?? profileData.leaveBalance ?? 0,
			totalLeavesTaken: profileData.total_leaves_taken ?? 0,
			annualLeaveQuota: profileData.annual_leave_quota ?? 0,
			fullName: profileData.full_name || profileData.fullName,
			role: profileData.role,
		};
	},

	// --- Attendance ---

	/** Mengambil status absensi hari ini dari endpoint /profile. Return null jika belum clock in. */
	getAttendanceToday: async () => {
		try {
			const response = await apiClient.get(ENDPOINTS.AUTH.ME);
			const profileData = response.data?.data || response.data;

			const clockIn = profileData.today_clock_in || null;
			const clockOut = profileData.today_clock_out || null;

			if (!clockIn) return null;

			return {
				clockIn,
				clockOut,
				date: new Date().toISOString().split("T")[0],
			};
		} catch (error) {
			console.error("Error fetching today's attendance:", error);
			return null;
		}
	},

	/** @returns {object|null} Response data atau null jika gagal */
	clockIn: async (time) => {
		try {
			const response = await apiClient.post(ENDPOINTS.ATTENDANCE.CLOCK_IN, {
				clock_in: time,
			});
			return response.data;
		} catch (error) {
			console.error("Error clocking in:", error);
			return null;
		}
	},

	/** @returns {object|null} Response data atau null jika gagal */
	clockOut: async (time, reason = null) => {
		try {
			const response = await apiClient.post(ENDPOINTS.ATTENDANCE.CLOCK_OUT, {
				clock_out: time,
				reason: reason,
			});
			return response.data;
		} catch (error) {
			console.error("Error clocking out:", error);
			return null;
		}
	},

	/** @returns {Array} Riwayat absensi (normalized clockIn/clockOut) */
	getAttendanceHistory: async () => {
		try {
			const response = await apiClient.get(ENDPOINTS.ATTENDANCE.HISTORY);
			const historyArray = extractArray(response.data, "getAttendanceHistory");

			return historyArray.map((item) => ({
				...item,
				clockIn: item.clock_in || item.clockIn,
				clockOut: item.clock_out || item.clockOut,
			}));
		} catch (error) {
			console.error("Error fetching attendance history:", error);
			return [];
		}
	},

	// --- Leaves ---

	/** @returns {Array} Riwayat cuti (normalized startDate/endDate) */
	getLeaves: async () => {
		try {
			const response = await apiClient.get(ENDPOINTS.LEAVES.LIST);
			const leavesArray = extractArray(response.data, "getLeaves");

			return leavesArray.map((item) => ({
				...item,
				id: item.id || item.leave_id,
				startDate: item.start_date || item.startDate,
				endDate: item.end_date || item.endDate,
			}));
		} catch (error) {
			console.error("Error fetching leaves:", error);
			return [];
		}
	},

	createLeave: async (leaveData) => {
		const response = await apiClient.post(ENDPOINTS.LEAVES.CREATE, leaveData);
		return response.data;
	},

	// --- Admin / Dashboard ---

	getDashboardStats: async () => {
		try {
			const response = await apiClient.get(ENDPOINTS.DASHBOARD.STATS);
			return response.data?.data || response.data || {};
		} catch (error) {
			console.error("Error fetching dashboard stats:", error);
			return {};
		}
	},

	getDashboardPendingLeaves: async () => {
		try {
			const response = await apiClient.get(ENDPOINTS.DASHBOARD.PENDING_LEAVES);
			const arr = extractArray(response.data, "getDashboardPendingLeaves");
			return arr.map((item) => ({
				...item,
				id: item.id || item.leave_id || item.id_leave,
			}));
		} catch (error) {
			console.error("Error fetching pending leaves:", error);
			return [];
		}
	},

	getDashboardAttendanceToday: async () => {
		try {
			const response = await apiClient.get(
				ENDPOINTS.DASHBOARD.ATTENDANCE_TODAY,
			);
			return extractArray(response.data, "getDashboardAttendanceToday");
		} catch (error) {
			console.error("Error fetching attendance today:", error);
			return [];
		}
	},

	getDashboardAttendance: async () => {
		try {
			const response = await apiClient.get(ENDPOINTS.DASHBOARD.ATTENDANCE);
			return extractArray(response.data, "getDashboardAttendance");
		} catch (error) {
			console.error("Error fetching all attendance:", error);
			return [];
		}
	},

	getDashboardLeaves: async (params = {}) => {
		try {
			const response = await apiClient.get(ENDPOINTS.DASHBOARD.LEAVES, {
				params,
			});
			const arr = extractArray(response.data, "getDashboardLeaves");
			return arr.map((item) => ({
				...item,
				id: item.id || item.leave_id,
			}));
		} catch (error) {
			console.error("Error fetching all leaves:", error);
			return [];
		}
	},

	getDashboardLeaveStats: async () => {
		try {
			const response = await apiClient.get(ENDPOINTS.DASHBOARD.LEAVE_STATS);
			return response.data?.data || response.data || {};
		} catch (error) {
			console.error("Error fetching leave stats:", error);
			return {};
		}
	},

	processLeave: async (id, data) => {
		const response = await apiClient.put(
			ENDPOINTS.DASHBOARD.PROCESS_LEAVE(id),
			data,
		);
		return response.data;
	},

	getDashboardEmployees: async (params = {}) => {
		try {
			const response = await apiClient.get(ENDPOINTS.DASHBOARD.EMPLOYEES, {
				params,
			});
			return extractArray(response.data, "getDashboardEmployees");
		} catch (error) {
			console.error("Error fetching employees:", error);
			return [];
		}
	},

	createEmployee: async (data) => {
		const response = await apiClient.post(ENDPOINTS.DASHBOARD.EMPLOYEES, data);
		return response.data;
	},

	updateEmployee: async (id, data) => {
		const response = await apiClient.patch(EMPLOYEE_ENDPOINTS.DETAIL(id), data);
		return response.data;
	},

	deleteEmployee: async (id) => {
		const response = await apiClient.delete(
			ENDPOINTS.DASHBOARD.EMPLOYEE_DETAIL(id),
		);
		return response.data;
	},

	resetEmployeePassword: async (id) => {
		const response = await apiClient.post(
			ENDPOINTS.DASHBOARD.RESET_PASSWORD(id),
		);
		return response.data;
	},
	unlockEmployee: async (id, data) => {
		const response = await apiClient.put(ENDPOINTS.DASHBOARD.UNLOCK(id), data);
		return response.data;
	},

	getEmployeeDetail: async (id) => {
		const response = await apiClient.get(
			ENDPOINTS.DASHBOARD.EMPLOYEE_DETAIL(id),
		);
		return response.data?.data || response.data;
	},
};
