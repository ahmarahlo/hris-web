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

	// Enrich the original error object with our consistent message
	error.message = message;
	return Promise.reject(error);
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

/** Mengekstrak paginated data (array + total count) dari response API. */
const extractPaginatedResponse = (data, label = "API") => {
	const arr = extractArray(data, label);
	// Handle various total count keys from different backend formats
	const total =
		data?.total ??
		data?.total_count ??
		data?.totalCount ??
		data?.data?.total ??
		data?.data?.total_count ??
		arr.length;

	return { data: arr, total };
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

	changePassword: async (data) => {
		const response = await apiClient.post("/auth/change-password", {
			old_password: data.oldPassword || data.old_password,
			new_password: data.newPassword || data.new_password,
			confirm_password: data.confirmPassword || data.confirm_password,
		});
		return response.data;
	},

	/** Menandai bahwa karyawan baru sudah melihat/menangani notifikasi akun baru. */
	markNewEmployeeAsSeen: async () => {
		try {
			// Endpoint sesuai Swagger: PATCH /auth/new-employee
			const response = await apiClient.patch("/auth/new-employee");
			return response.data;
		} catch (error) {
			console.warn("[api.markNewEmployeeAsSeen] Failed:", error.message);
			// Tidak di-throw agar proses login tidak terganggu
			return null;
		}
	},

	updateProfile: async (data) => {
		const response = await apiClient.put(ENDPOINTS.AUTH.ME, data);
		return response.data;
	},

	/** Mengambil profil user yang sedang login (termasuk sisa cuti). */
	getMe: async () => {
		const response = await apiClient.get(ENDPOINTS.AUTH.ME);
		const profileData = response.data?.data || response.data;
		console.log("[api.getMe] Raw profileData:", profileData);
		console.log(
			"[api.getMe] is_new_employee value:",
			profileData?.is_new_employee,
			"| type:",
			typeof profileData?.is_new_employee,
		);

		// Helper untuk deteksi isNewUser secara mendalam
		const detectIsNew = (data) => {
			if (!data) return false;
			const keys = ["is_new_employee", "is_new_user", "isNewUser", "is_new"];
			for (const key of keys) {
				if (data[key] === true || Number(data[key]) === 1) return true;
			}
			const nested = data.user || data.employee || data.profile;
			if (nested && typeof nested === "object") {
				for (const key of keys) {
					if (nested[key] === true || Number(nested[key]) === 1) return true;
				}
			}
			return false;
		};

		return {
			...profileData,
			id: profileData.id || profileData.employee_id || profileData.user_id,
			leaveBalance: profileData.leave_balance ?? profileData.leaveBalance ?? 0,
			totalLeavesTaken: profileData.total_leaves_taken ?? 0,
			annualLeaveQuota: profileData.annual_leave_quota ?? 0,
			fullName: profileData.full_name || profileData.fullName,
			role: profileData.role,
			isNewUser: detectIsNew(profileData),
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

	/** Cek apakah user di lokasi kantor. Harus dipanggil sebelum clock-in. */
	checkLocation: async (lat, lng) => {
		const response = await apiClient.get(ENDPOINTS.ATTENDANCE.CHECK_LOCATION, {
			params: { lat, lng },
		});
		return response.data;
	},

	/** @returns {object|null} Response data atau null jika gagal */
	clockIn: async (photo = null) => {
		try {
			const formData = new FormData();

			if (photo) {
				// Convert base64 data URL to Blob
				const response = await fetch(photo);
				const blob = await response.blob();
				formData.append("photo", blob, "clock-in.jpg");
			}

			const res = await apiClient.post(
				ENDPOINTS.ATTENDANCE.CLOCK_IN,
				formData,
				{
					headers: { "Content-Type": "multipart/form-data" },
				},
			);
			return res.data;
		} catch (error) {
			console.error("Error clocking in:", error);
			throw error;
		}
	},

	/** @returns {object|null} Response data atau null jika gagal */
	clockOut: async (note = null) => {
		try {
			const response = await apiClient.post(ENDPOINTS.ATTENDANCE.CLOCK_OUT, {
				note: note,
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
				id:
					item.id || item.leave_id || item.id_leave || item.id_cuti || item.no,
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

	getDashboardPendingLeaves: async (params = {}) => {
		try {
			const limit = params.limit || params.pageSize || 10;
			const page = params.page || 1;
			const apiParams = {
				...params,
				page: page,
				limit: limit,
			};
			const response = await apiClient.get(ENDPOINTS.DASHBOARD.PENDING_LEAVES, {
				params: apiParams,
			});
			const paginated = extractPaginatedResponse(
				response.data,
				"getDashboardPendingLeaves",
			);
			return {
				...paginated,
				data: paginated.data.map((item) => ({
					...item,
					id:
						item.id ||
						item.leave_id ||
						item.id_leave ||
						item.id_cuti ||
						item.no,
				})),
			};
		} catch (error) {
			console.error("Error fetching pending leaves:", error);
			return { data: [], total: 0 };
		}
	},

	getDashboardAttendanceToday: async (params = {}) => {
		try {
			const limit = params.limit || params.pageSize || 10;
			const page = params.page || 1;
			const apiParams = {
				...params,
				page: page,
				page_Index: page - 1,
				page_index: page - 1,
				offset: (page - 1) * limit,
				limit: limit,
				per_page: limit,
				perPage: limit,
				pageSize: limit,
				page_size: limit,
				size: limit,
				take: limit,
				count: limit,
			};
			const response = await apiClient.get(
				ENDPOINTS.DASHBOARD.ATTENDANCE_TODAY,
				{ params: apiParams },
			);
			return extractPaginatedResponse(
				response.data,
				"getDashboardAttendanceToday",
			);
		} catch (error) {
			console.error("Error fetching attendance today:", error);
			return { data: [], total: 0 };
		}
	},

	getDashboardAttendance: async (params = {}) => {
		try {
			const limit = params.limit || params.pageSize || 10;
			const page = params.page || 1;
			const apiParams = {
				...params,
				page: page,
				page_Index: page - 1,
				page_index: page - 1,
				offset: (page - 1) * limit,
				limit: limit,
				per_page: limit,
				perPage: limit,
				pageSize: limit,
				page_size: limit,
				size: limit,
				take: limit,
				count: limit,
			};
			const response = await apiClient.get(ENDPOINTS.ATTENDANCE.HISTORY, {
				params: apiParams,
			});
			return extractPaginatedResponse(response.data, "getDashboardAttendance");
		} catch (error) {
			console.error("Error fetching all attendance:", error);
			return { data: [], total: 0 };
		}
	},

	getDashboardLeaves: async (params = {}) => {
		try {
			const limit = params.limit || params.pageSize || 10;
			const page = params.page || 1;
			const apiParams = {
				...params,
				page: page,
				page_Index: page - 1,
				page_index: page - 1,
				offset: (page - 1) * limit,
				limit: limit,
				per_page: limit,
				perPage: limit,
				pageSize: limit,
				page_size: limit,
				size: limit,
				take: limit,
				count: limit,
			};
			const response = await apiClient.get(ENDPOINTS.DASHBOARD.LEAVES, {
				params: apiParams,
			});
			const paginated = extractPaginatedResponse(
				response.data,
				"getDashboardLeaves",
			);
			return {
				...paginated,
				data: paginated.data.map((item) => ({
					...item,
					id:
						item.id ||
						item.leave_id ||
						item.id_leave ||
						item.id_cuti ||
						item.no,
				})),
			};
		} catch (error) {
			console.error("Error fetching all leaves:", error);
			return { data: [], total: 0 };
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
			const limit = params.limit || params.pageSize || 10;
			const page = params.page || 1;
			const apiParams = {
				...params,
				page: page,
				page_Index: page - 1,
				page_index: page - 1,
				offset: (page - 1) * limit,
				limit: limit,
				per_page: limit,
				perPage: limit,
				pageSize: limit,
				page_size: limit,
				size: limit,
				take: limit,
				count: limit,
			};
			const response = await apiClient.get(ENDPOINTS.DASHBOARD.EMPLOYEES, {
				params: apiParams,
			});
			return extractPaginatedResponse(response.data, "getDashboardEmployees");
		} catch (error) {
			console.error("Error fetching employees:", error);
			return { data: [], total: 0 };
		}
	},

	createEmployee: async (data) => {
		const response = await apiClient.post(ENDPOINTS.DASHBOARD.EMPLOYEES, data);
		return response.data;
	},

	updateEmployee: async (id, data) => {
		const response = await apiClient.put(
			ENDPOINTS.DASHBOARD.EMPLOYEE_UPDATE(id),
			data,
		);
		return response.data;
	},

	deleteEmployee: async (id) => {
		const response = await apiClient.delete(
			ENDPOINTS.DASHBOARD.EMPLOYEE_UPDATE(id),
		);
		return response.data;
	},

	resetEmployeePassword: async (id, data) => {
		const response = await apiClient.post(
			ENDPOINTS.DASHBOARD.RESET_PASSWORD(id),
			data,
		);
		return response.data;
	},

	getEmployeeDetail: async (id) => {
		const response = await apiClient.get(
			ENDPOINTS.DASHBOARD.EMPLOYEE_DETAIL(id),
		);
		return response.data?.data || response.data;
	},

	getAdmins: async (params = {}) => {
		try {
			const limit = params.limit || params.pageSize || 10;
			const page = params.page || 1;
			const apiParams = {
				...params,
				page: page,
				limit: limit,
			};
			const response = await apiClient.get(ENDPOINTS.DASHBOARD.ADMINS, {
				params: apiParams,
			});
			return extractPaginatedResponse(response.data, "getAdmins");
		} catch (error) {
			console.error("Error fetching admins:", error);
			return { data: [], total: 0 };
		}
	},

	demoteAdmin: async (id) => {
		const response = await apiClient.delete(
			ENDPOINTS.DASHBOARD.ADMIN_DELETE(id),
		);
		return response.data;
	},
};
