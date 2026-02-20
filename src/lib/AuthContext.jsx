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

		const userData = {
			id: responseData.id || responseData.user_id,
			name: responseData.full_name || responseData.name || "User",
			role: userRole,
			isNewUser:
				responseData.is_new_employee === true ||
				responseData.is_new_employee === 1 ||
				responseData.is_new_user === true ||
				responseData.isNewUser === true ||
				false,
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

	const updateMe = (data) => {
		const updatedUser = { ...user, ...data };
		localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
		setUser(updatedUser);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				token,
				login,
				logout,
				updateMe,
				loading,
				isAuthenticated: !!token,
			}}
		>
			{!loading && children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
