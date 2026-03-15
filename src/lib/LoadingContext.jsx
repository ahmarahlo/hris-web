import React, { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Alert } from "./components";

// Create Context
const LoadingContext = createContext();

// Create Provider
export const LoadingProvider = ({ children }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState("Memuat Data...");

	const showLoading = useCallback((msg = "Memuat Data...") => {
		setMessage(msg);
		setIsLoading(true);
	}, []);

	const hideLoading = useCallback(() => {
		setIsLoading(false);
	}, []);

	return (
		<LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
			{children}
			{isLoading &&
				createPortal(
					<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
						<Alert variant="loading" title={message} shadow={true} />
					</div>,
					document.body,
				)}
		</LoadingContext.Provider>
	);
};

// Custom Hook to use Loading Context
export const useLoading = () => {
	const context = useContext(LoadingContext);
	if (!context) {
		throw new Error("useLoading must be used within a LoadingProvider");
	}
	return context;
};
