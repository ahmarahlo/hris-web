import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CutiPage from "./pages/CutiPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import ManajemenAbsensiPage from "./pages/admin/ManajemenAbsensiPage";
import ManajemenCutiPage from "./pages/admin/ManajemenCutiPage";
import ManajemenAkunPage from "./pages/admin/ManajemenAkunPage";
import PrivateRoute from "./lib/components/PrivateRoute";
import { USER_ROLES } from "./lib/constants";
import "./App.css";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/login" element={<LoginPage />} />

				{/* Employee Routes */}
				<Route
					element={
						<PrivateRoute allowedRoles={[USER_ROLES.EMPLOYEE, USER_ROLES.HR]} />
					}
				>
					<Route path="/dashboard" element={<DashboardPage />} />
					<Route path="/cuti" element={<CutiPage />} />
				</Route>

				{/* HR Routes */}
				<Route
					element={
						<PrivateRoute allowedRoles={[USER_ROLES.HR, USER_ROLES.ADMIN]} />
					}
				>
					<Route path="/admin" element={<AdminDashboardPage />} />
					<Route path="/admin/absensi" element={<ManajemenAbsensiPage />} />
					<Route path="/admin/cuti" element={<ManajemenCutiPage />} />
					<Route path="/admin/akun" element={<ManajemenAkunPage />} />
				</Route>

				<Route path="*" element={<Navigate to="/login" replace />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
