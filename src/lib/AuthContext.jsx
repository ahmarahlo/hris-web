import { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api";
import { STORAGE_KEYS } from "./constants";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(
		localStorage.getItem(STORAGE_KEYS.TOKEN) || null,
	);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const initAuth = async () => {
			const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
			const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

			if (storedToken && storedUser) {
				setToken(storedToken);
				setUser(JSON.parse(storedUser));
			}
			setLoading(false);
		};

		initAuth();
	}, []);

	const login = async (email, password) => {
		const data = await api.login(email, password);
		const responseData = data.data || data;

		if (!responseData.token) {
			throw new Error("Invalid response from server: Token not found");
		}

		localStorage.setItem(STORAGE_KEYS.TOKEN, responseData.token);
		setToken(responseData.token);

		// Tentukan role dari profile endpoint
		let userRole = responseData.role || "employee";
		let profile = null;

		try {
			profile = await api.getMe();
			console.log("[Auth] Profile data retrieved:", profile);
			const profileRole = (profile?.role || "").toLowerCase();

			if (profileRole) {
				userRole = profileRole;
			} else if (profile?.department === "HR") {
				// Fallback: Department HR = Admin Role
				userRole = "admin";
			}
		} catch (e) {
			console.warn("Could not fetch profile for role detection:", e);
		}

		const userData = {
			id: profile?.id || responseData.id,
			name:
				profile?.fullName ||
				profile?.full_name ||
				responseData.name ||
				responseData.full_name ||
				"User",
			role: userRole,
			isNewUser: responseData.isNewUser || responseData.is_new_user || false,
			employeeId: profile?.id,
		};

		console.log("[Auth] Final user data:", userData);
		localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
		setUser(userData);

		return { ...responseData, ...userData };
	};

	const logout = () => {
		localStorage.removeItem(STORAGE_KEYS.TOKEN);
		localStorage.removeItem(STORAGE_KEYS.USER);
		setToken(null);
		setUser(null);
	};

	return (
		<AuthContext.Provider
			value={{ user, token, login, logout, loading, isAuthenticated: !!token }}
		>
			{!loading && children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
