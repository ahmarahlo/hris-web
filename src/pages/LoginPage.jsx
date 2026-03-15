import { useState, useEffect, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Input } from "../lib/components/input/Input";
import { Button } from "../lib/components/button/Button";
import { Alert, AlertBanner } from "../lib/components/alert/Alert";
import { api } from "../lib/api";
import logoSvg from "../assets/logo.svg";
import homeGambar from "../assets/home-gambar.webp";

// Lazy load heavy components
const ResetPasswordModal = lazy(() =>
	import("../lib/components/modal/ResetPasswordModal").then((module) => ({
		default: module.ResetPasswordModal,
	})),
);
import { useAuth } from "../lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { USER_ROLES } from "../lib/constants";

export default function LoginPage() {
	const [showPassword, setShowPassword] = useState(false);
	const [formData, setFormData] = useState({ email: "", password: "" });
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	// State untuk notifikasi dan modal
	const [passwordAlert, setPasswordAlert] = useState(null);
	const [isBlockedAlertOpen, setIsBlockedAlertOpen] = useState(false);
	const [showNewUserAlert, setShowNewUserAlert] = useState(false);
	const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
	const [pendingUserData, setPendingUserData] = useState(null);
	const [failedAttempts, setFailedAttempts] = useState(0);

	const { login, setUserData } = useAuth();
	const navigate = useNavigate();

	// Efek untuk menutup alert otomatis dalam 3 detik
	useEffect(() => {
		let timer;
		if (passwordAlert || isBlockedAlertOpen) {
			timer = setTimeout(() => {
				setPasswordAlert(null);
				setIsBlockedAlertOpen(false);
			}, 3000);
		}
		return () => clearTimeout(timer);
	}, [passwordAlert, isBlockedAlertOpen]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		if (error) setError("");
	};

	const handleRedirect = (data) => {
		const user = data.userData || data;
		if (user.role === USER_ROLES.HR || user.role === USER_ROLES.ADMIN) {
			navigate("/admin");
		} else {
			navigate("/dashboard");
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Frontend Validation: Min 8 characters
		if (formData.password.length < 8) {
			setError("Password minimal 8 karakter.");
			return;
		}

		setIsLoading(true);
		setError("");

		try {
			const data = await login(formData.email, formData.password);
			console.log("[LoginPage] Raw login response data:", data);

			// isNewUser sudah dinormalisasi di AuthContext (Boolean)
			let isNewUser = data.isNewUser === true;
			console.log("[LoginPage] isNewUser from AuthContext:", isNewUser);

			// Tambahkan fallback check profile untuk memastikan data paling aktual
			try {
				const profile = await api.getMe();
				console.log("[LoginPage] Profile from getMe:", profile);
				if (profile.isNewUser) isNewUser = true;
			} catch (e) {
				console.warn("[LoginPage] Gagal getMe fallback:", e);
			}

			console.log("[LoginPage] Final isNewUser decision:", isNewUser);

			if (isNewUser) {
				// JIKA USER BARU (is_new_employee = 1): Tampilkan prompt ganti password dulu
				setPendingUserData(data);
				setShowNewUserAlert(true);
			} else {
				// JIKA USER LAMA (is_new_employee = 0): Langsung redirect
				handleRedirect(data);
			}
		} catch (err) {
			let errorMsg = err.message || "Terjadi kesalahan";
			if (err.response?.status === 401) {
				const newAttempts = failedAttempts + 1;
				setFailedAttempts(newAttempts);

				if (newAttempts >= 3) {
					setIsBlockedAlertOpen(true);
					setError("Akun terblokir karena terlalu banyak percobaan.");
				} else {
					setError("Email atau password salah.");
				}
			} else if (errorMsg.toLowerCase().match(/blokir|locked/)) {
				setIsBlockedAlertOpen(true);
			} else {
				setError(err.response?.data?.message || errorMsg);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handlePromptCancel = async () => {
		setShowNewUserAlert(false);
		setIsLoading(true);
		try {
			// Memastikan status di DB diupdate agar tidak muncul lagi di login berikutnya
			await api.markNewEmployeeAsSeen();
			const actualUserData = pendingUserData.userData || pendingUserData;
			setUserData(actualUserData);
			handleRedirect(actualUserData);
		} catch (err) {
			const actualUserData = pendingUserData.userData || pendingUserData;
			setUserData(actualUserData);
			handleRedirect(actualUserData);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen w-full bg-white font-sans overflow-hidden">
			{/* SISI KIRI - FORM LOGIN */}
			<div className="flex w-full flex-col items-center justify-center px-8 lg:w-1/2 relative z-20">
				<div className="w-full max-w-md">
					<div className="mb-8 flex justify-center">
						<img src={logoSvg} alt="Logo" className="h-24" />
					</div>

					<form onSubmit={handleSubmit} className="space-y-5">
						<Input
							type="email"
							name="email"
							placeholder="Email"
							value={formData.email}
							onChange={handleChange}
							disabled={isLoading}
						/>

						<Input
							type="password"
							name="password"
							placeholder="Password"
							value={formData.password}
							onChange={handleChange}
							disabled={isLoading}
						/>

						{error && <AlertBanner variant="error" message={error} />}

						<Button
							type="submit"
							variant="info"
							className="w-full"
							disabled={isLoading}
						>
							{isLoading ? "Signing in..." : "Login"}
						</Button>
					</form>
				</div>
			</div>

			{/* SISI KANAN - GAMBAR */}
			<div className="hidden lg:flex flex-1 items-center justify-end">
				<img
					src={homeGambar}
					alt="Side Decoration"
					className="h-full object-contain"
				/>
			</div>

			{/* MODAL GANTI PASSWORD */}
			<Suspense fallback={null}>
				<ResetPasswordModal
					isOpen={isResetPasswordOpen}
					onClose={() => setIsResetPasswordOpen(false)}
					onSuccess={(msg) =>
						setPasswordAlert({ type: "success", message: msg })
					}
				/>
			</Suspense>

			{/* PORTAL UNTUK ALERT OVERLAY */}

			{/* Alert Akun Terblokir */}
			{isBlockedAlertOpen &&
				createPortal(
					<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
						<Alert
							variant="error"
							title="Akun Terblokir"
							message="Hubungi admin untuk membuka akses."
							onClose={() => setIsBlockedAlertOpen(false)}
							showCloseIcon={false}
						/>
					</div>,
					document.body,
				)}

			{/* Prompt Penawaran Ganti Password untuk User Baru */}
			{showNewUserAlert &&
				createPortal(
					<div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4">
						<Alert
							variant="question"
							title="Selamat datang di HRIS mini, ingin mengganti pasword?"
							message="Apakah Anda ingin mengganti password sekarang demi keamanan?"
							buttonText="Iya"
							cancelText="Tidak"
							onConfirm={() => {
								setShowNewUserAlert(false);
								setIsResetPasswordOpen(true);
							}}
							onCancel={handlePromptCancel}
						/>
					</div>,
					document.body,
				)}

			{/* Alert Sukses Ganti Password (Muncul Otomatis dari Modal) */}
			{passwordAlert &&
				createPortal(
					<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 text-center">
						<Alert
							variant={passwordAlert.type}
							message={passwordAlert.message}
							hideButtons
							hideTitle
						/>
					</div>,
					document.body,
				)}
		</div>
	);
}
