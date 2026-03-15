import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Alert } from "./lib/components/alert/Alert";

// Lazy load all pages
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const CutiPage = lazy(() => import("./pages/CutiPage"));
const AdminDashboardPage = lazy(
	() => import("./pages/admin/AdminDashboardPage"),
);
const ManajemenAbsensiPage = lazy(
	() => import("./pages/admin/ManajemenAbsensiPage"),
);
const ManajemenCutiPage = lazy(() => import("./pages/admin/ManajemenCutiPage"));
const ManajemenAkunPage = lazy(() => import("./pages/admin/ManajemenAkunPage"));
const EditAkunPage = lazy(() => import("./pages/admin/EditAkunPage"));
const SuperAdminPage = lazy(() => import("./pages/admin/SuperAdminPage"));
const ManajemenAdminPage = lazy(
	() => import("./pages/admin/ManajemenAdminPage"),
);

import PrivateRoute from "./lib/components/PrivateRoute";
import { USER_ROLES } from "./lib/constants";
import "./App.css";

// Loading Fallback Component
const PageLoading = () => null;

function App() {
	return (
		<BrowserRouter>
			<Suspense fallback={<PageLoading />}>
				<Routes>
					<Route path="/login" element={<LoginPage />} />

					{/* Employee Routes */}
					<Route
						element={
							<PrivateRoute
								allowedRoles={[
									USER_ROLES.EMPLOYEE,
									USER_ROLES.HR,
									USER_ROLES.ADMIN,
									USER_ROLES.SUPER_ADMIN,
								]}
							/>
						}
					>
						<Route path="/dashboard" element={<DashboardPage />} />
						<Route path="/cuti" element={<CutiPage />} />
						{/* Allow all users to access their own profile edit page */}
						<Route path="/admin/akun/:id" element={<EditAkunPage />} />
					</Route>

					{/* HR Routes */}
					<Route
						element={
							<PrivateRoute
								allowedRoles={[
									USER_ROLES.HR,
									USER_ROLES.ADMIN,
									USER_ROLES.SUPER_ADMIN,
								]}
							/>
						}
					>
						<Route path="/admin" element={<AdminDashboardPage />} />
						<Route path="/admin/absensi" element={<ManajemenAbsensiPage />} />
						<Route path="/admin/cuti" element={<ManajemenCutiPage />} />
						<Route path="/admin/akun" element={<ManajemenAkunPage />} />
						<Route path="/admin/super/admin" element={<ManajemenAdminPage />} />
						<Route path="/admin/super" element={<SuperAdminPage />} />
					</Route>

					<Route path="*" element={<Navigate to="/login" replace />} />
				</Routes>
			</Suspense>
		</BrowserRouter>
	);
}

export default App;
