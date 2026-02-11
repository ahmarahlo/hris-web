import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CutiPage from "./pages/CutiPage";
import PrivateRoute from "./lib/components/PrivateRoute";
import "./App.css";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/login" element={<LoginPage />} />

				{/* Employee Routes */}
				<Route element={<PrivateRoute allowedRoles={["employee", "hr"]} />}>
					<Route path="/dashboard" element={<DashboardPage />} />
					<Route path="/cuti" element={<CutiPage />} />
				</Route>

				{/* HR Routes - Future */}
				{/* <Route element={<PrivateRoute allowedRoles={['hr']} />}>
                    <Route path="/admin" element={<AdminDashboardPage />} />
                </Route> */}

				<Route path="*" element={<Navigate to="/login" replace />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
