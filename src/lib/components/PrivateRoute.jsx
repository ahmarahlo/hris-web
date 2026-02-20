import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function PrivateRoute({ allowedRoles = [] }) {
	const { user, loading, isAuthenticated } = useAuth();

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				Loading...
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
		// If user has no access to this route, redirect to their dashboard
		// HR -> /admin (future), Employee -> /dashboard
		// For now, if role is HR but accessing employee route, maybe allow?
		// Or if role is Employee accessing HR route, block.

		// Simple logic: if role not allowed, go to home/dashboard
		return <Navigate to="/dashboard" replace />;
	}

	return <Outlet />;
}
