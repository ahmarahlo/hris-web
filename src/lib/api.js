const EMPLOYEE_API_URL = "http://109.111.53.197:7090";
const BACKOFFICE_API_URL = "http://109.111.53.197:7091";

const API_KEY = "INIKEYAPI"; // Masukkan API Key di sini (hubungi backend dev jika tidak ada)

const getBaseUrl = (isBackoffice = false) => {
	return isBackoffice ? BACKOFFICE_API_URL : EMPLOYEE_API_URL;
};

const getAuthToken = () => {
	return localStorage.getItem("token");
};

export const fetchWithAuth = async (
	endpoint,
	options = {},
	isBackoffice = false,
) => {
	const token = getAuthToken();
	const headers = {
		"Content-Type": "application/json",
		"x-api-key": API_KEY, // Add API Key
		...options.headers,
	};

	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	const url = `${getBaseUrl(isBackoffice)}${endpoint}`;

	const response = await fetch(url, {
		...options,
		headers,
	});

	if (response.status === 401) {
		// Optional: Handle unauthorized (e.g., redirect to login if not already there)
		// For now, we'll let the caller handle it or AuthContext can handle logout
	}

	return response;
};

export const api = {
	login: async (email, password) => {
		// Try employee login first
		let response = await fetch(`${EMPLOYEE_API_URL}/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": API_KEY,
			},
			body: JSON.stringify({ email, password }),
		});

		if (response.ok) {
			return response.json();
		}
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || "Email atau password salah");
		}

		return response.json();
	},

	// User Data
	getMe: async () => {
		const response = await fetchWithAuth("/users/me");
		if (!response.ok) throw new Error("Failed to fetch user");
		return response.json();
	},

	// Attendance
	getAttendanceToday: async () => {
		const response = await fetchWithAuth("/attendance/today");
		if (!response.ok) throw new Error("Failed to fetch attendance today");
		return response.json();
	},

	clockIn: async (time) => {
		const response = await fetchWithAuth("/attendance/clock-in", {
			method: "POST",
			body: JSON.stringify({ time }),
		});
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || "Failed to clock in");
		}
		return response.json();
	},

	clockOut: async (time) => {
		const response = await fetchWithAuth("/attendance/clock-out", {
			method: "POST",
			body: JSON.stringify({ time }),
		});
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || "Failed to clock out");
		}
		return response.json();
	},

	getAttendanceHistory: async () => {
		const response = await fetchWithAuth("/attendance");
		if (!response.ok) throw new Error("Failed to fetch attendance history");
		return response.json();
	},

	// Leaves
	getLeaves: async () => {
		const response = await fetchWithAuth("/leaves");
		if (!response.ok) throw new Error("Failed to fetch leaves");
		return response.json();
	},

	createLeave: async (data) => {
		const response = await fetchWithAuth("/leaves", {
			method: "POST",
			body: JSON.stringify(data),
		});
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || "Failed to create leave request");
		}
		return response.json();
	},
};
