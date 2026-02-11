import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(localStorage.getItem("token") || null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const initAuth = async () => {
			const storedToken = localStorage.getItem("token");
			const storedUser = localStorage.getItem("user");

			if (storedToken && storedUser) {
				setToken(storedToken);
				setUser(JSON.parse(storedUser));
			}
			setLoading(false);
		};

		initAuth();
	}, []);

	const login = async (email, password) => {
		try {
			const data = await api.login(email, password);

			// Data expected: { id, name, role, token }
			if (data.token) {
				localStorage.setItem("token", data.token);
				localStorage.setItem(
					"user",
					JSON.stringify({
						id: data.id,
						name: data.name,
						role: data.role,
					}),
				);
				setToken(data.token);
				setUser({
					id: data.id,
					name: data.name,
					role: data.role,
				});
				return data; // Return full data for redirect logic in component
			} else {
				throw new Error("Invalid response from server");
			}
		} catch (error) {
			console.error("Login error:", error);
			throw error;
		}
	};

	const logout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		setToken(null);
		setUser(null);
		// Optional: Redirect to login happens via consumer or protected route
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
