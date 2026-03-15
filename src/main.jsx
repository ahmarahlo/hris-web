import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./lib/AuthContext.jsx";
import { LoadingProvider } from "./lib/LoadingContext.jsx";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<LoadingProvider>
			<AuthProvider>
				<App />
			</AuthProvider>
		</LoadingProvider>
	</StrictMode>,
);
