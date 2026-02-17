import { useState } from "react";
import { createPortal } from "react-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Input, Button, AlertBanner, Alert, Modal } from "../lib/components";
import { api } from "../lib/api";
import logoSvg from "../assets/logo.svg";
import homeGambar from "../assets/home-gambar.svg";
import { useAuth } from "../lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { USER_ROLES } from "../lib/constants";

export default function LoginPage() {
	const [showPassword, setShowPassword] = useState(false);
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});

	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [passwordAlert, setPasswordAlert] = useState(null);

	// New User States
	const [isWelcomeAlertOpen, setIsWelcomeAlertOpen] = useState(false);
	const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] =
		useState(false);
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [oldPassword, setOldPassword] = useState("");

	const { login } = useAuth();
	const navigate = useNavigate();

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		if (error) setError("");
	};

	const [isBlockedAlertOpen, setIsBlockedAlertOpen] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!formData.email || !formData.password) {
			setError("Email atau password masih kosong");
			return;
		}

		setIsLoading(true);
		setError("");

		try {
			const data = await login(formData.email, formData.password);

			if (data.isNewUser) {
				setIsWelcomeAlertOpen(true);
				return;
			}

			if (data.role === USER_ROLES.HR || data.role === USER_ROLES.ADMIN) {
				navigate("/admin");
			} else {
				navigate("/dashboard");
			}
		} catch (err) {
			let errorMsg = err.message || "Terjadi kesalahan saat login";
			if (
				errorMsg.toLowerCase().includes("blokir") ||
				errorMsg.toLowerCase().includes("locked")
			) {
				setIsBlockedAlertOpen(true);
			} else if (
				errorMsg.includes("401") ||
				errorMsg.includes("Invalid credentials")
			) {
				errorMsg = "Email atau password salah.";
				setError(errorMsg);
			} else {
				setError(errorMsg);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleWelcomeConfirm = () => {
		setIsWelcomeAlertOpen(false);
		setIsResetPasswordModalOpen(true);
	};

	const handleWelcomeCancel = () => {
		setIsWelcomeAlertOpen(false);
		navigate("/dashboard");
	};

	const handlePasswordChange = async () => {
		if (newPassword !== confirmPassword) {
			setPasswordAlert({
				type: "error",
				message: "Password konfirmasi tidak cocok!",
			});
			return;
		}
		if (newPassword.length < 6) {
			setPasswordAlert({
				type: "error",
				message: "Password minimal 6 karakter",
			});
			return;
		}

		try {
			await api.changePassword(newPassword, oldPassword);
			setPasswordAlert({
				type: "success",
				message: "Password berhasil diubah, silakan masuk ke dashboard.",
				onClose: () => {
					setPasswordAlert(null);
					setIsResetPasswordModalOpen(false);
					navigate("/dashboard");
				},
			});
		} catch (err) {
			setPasswordAlert({
				type: "error",
				message: "Gagal mengubah password: " + err.message,
			});
		}
	};

	return (
		<div className="flex min-h-screen w-full overflow-hidden bg-white font-sans">
			{/* Left Side - Form */}
			<div className="flex w-full flex-col items-center justify-center px-8 lg:w-1/2 lg:px-16 xl:px-24 relative z-20">
				<div className="w-full max-w-md">
					<div className="mb-8 flex justify-center">
						<img src={logoSvg} alt="HRIS Logo" className="h-24 w-auto" />
					</div>

					<div className="mb-8 text-center">
						<h1 className="mb-2 text-3xl font-bold text-gray-900">
							Log In to your account
						</h1>
						<p className="text-sm text-gray-500">Welcome back</p>
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

						<div className="relative">
							<Input
								type={showPassword ? "text" : "password"}
								name="password"
								placeholder="Password"
								value={formData.password}
								onChange={handleChange}
								disabled={isLoading}
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
							>
								{showPassword ? (
									<EyeSlashIcon className="h-5 w-5" />
								) : (
									<EyeIcon className="h-5 w-5" />
								)}
							</button>
						</div>

						{error && <AlertBanner variant="error" message={error} />}

						<Button
							type="submit"
							variant="info"
							className="w-full py-3"
							disabled={isLoading}
						>
							{isLoading ? "Signing in..." : "Login"}
						</Button>
					</form>
				</div>
			</div>

			{/* Right Side - Image */}
			<div className="hidden lg:flex relative flex-1 items-center justify-end overflow-hidden -ml-1">
				<img
					src={homeGambar}
					alt="Office Buildings"
					className="h-full w-auto object-contain"
				/>
			</div>

			{/* Welcome Alert Overlay */}
			{isWelcomeAlertOpen &&
				createPortal(
					<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
						<Alert
							variant="question"
							title="Selamat datang di HRIS mini, ingin langsung ganti password?"
							buttonText="Iya"
							cancelText="Tidak"
							onConfirm={handleWelcomeConfirm}
							onCancel={handleWelcomeCancel}
							btnConfirmVariant="info"
							btnCancelVariant="danger"
							className="shadow-2xl"
						/>
					</div>,
					document.body,
				)}

			{/* Reset Password Modal */}
			<Modal
				isOpen={isResetPasswordModalOpen}
				onClose={() => setIsResetPasswordModalOpen(false)}
				title="Ganti password"
			>
				<div className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm font-medium text-gray-600">
							Password Lama
						</label>
						<Input
							type="password"
							placeholder="Password..."
							value={oldPassword}
							onChange={(e) => setOldPassword(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium text-gray-600">
							Password Baru
						</label>
						<Input
							type="password"
							placeholder="Password..."
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium text-gray-600">
							Konfirmasi Password
						</label>
						<Input
							type="password"
							placeholder="Password..."
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
						/>
					</div>

					<div className="flex justify-end pt-4 gap-2">
						<Button
							variant="danger"
							onClick={() => navigate("/dashboard")}
							className="bg-orange-400 hover:bg-orange-500 border-none text-white"
						>
							batal
						</Button>
						<Button
							variant="primary"
							onClick={handlePasswordChange}
							className="bg-indigo-500 hover:bg-indigo-600 text-white"
						>
							Kirim
						</Button>
					</div>
				</div>
			</Modal>

			{/* Blocked Alert Overlay */}
			{isBlockedAlertOpen &&
				createPortal(
					<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
						<Alert
							variant="error"
							title="Akun anda terblokir, silahkan hubungi admin"
							buttonText="Tutup"
							onClose={() => setIsBlockedAlertOpen(false)}
						/>
					</div>,
					document.body,
				)}

			{/* Password Alert Overlay */}
			{passwordAlert &&
				createPortal(
					<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
						<Alert
							variant={passwordAlert.type}
							title={passwordAlert.type === "success" ? "Berhasil" : "Gagal"}
							message={passwordAlert.message}
							onClose={passwordAlert.onClose || (() => setPasswordAlert(null))}
						/>
					</div>,
					document.body,
				)}
		</div>
	);
}
