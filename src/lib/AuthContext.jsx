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

		// Gunakan data langsung dari response login (seperti di screenshot Swagger)
		let userRole = responseData.role || "employee";

		// Helper untuk deteksi isNewUser secara mendalam (handling nested data)
		const detectIsNewUser = (data) => {
			if (!data) return false;

			// Cek key umum di level top
			const keys = ["is_new_employee", "is_new_user", "isNewUser", "is_new"];
			for (const key of keys) {
				if (data[key] === true || Number(data[key]) === 1) return true;
			}

			// Cek nested 'user' atau 'employee' object
			const nested = data.user || data.employee || data.profile;
			if (nested && typeof nested === "object") {
				for (const key of keys) {
					if (nested[key] === true || Number(nested[key]) === 1) return true;
				}
			}

			return false;
		};

		const userData = {
			id: responseData.id || responseData.user_id || responseData.user?.id,
			name:
				responseData.full_name ||
				responseData.name ||
				responseData.user?.name ||
				"User",
			role: userRole,
			isNewUser: detectIsNewUser(responseData),
		};

		console.log("[Auth] Raw response data:", responseData);
		console.log("[Auth] Calculated userData:", userData);

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

	const updateMe = (data) => {
		const updatedUser = { ...user, ...data };
		localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
		setUser(updatedUser);
	};

	/** Alias untuk menyetel user data secara langsung (tanpa merge). */
	const setUserData = (data) => {
		const newUser = { ...user, ...data };
		localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
		setUser(newUser);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				token,
				login,
				logout,
				updateMe,
				setUserData,
				loading,
				isAuthenticated: !!token,
			}}
		>
			{!loading && children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
