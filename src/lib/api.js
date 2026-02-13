const EMPLOYEE_API_URL = "http://109.111.53.197:7090";
const BACKOFFICE_API_URL = "http://109.111.53.197:7091";
const API_KEY = "INIKEYAPI";

export const api = {
	login: async (email, password) => {
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
		return [];
	},

	createLeave: async (data) => {
		return { message: "Success" };
	},
};
