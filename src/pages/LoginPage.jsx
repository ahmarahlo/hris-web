import React, { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Input, Button, AlertBanner } from "../lib/components";
import logoSvg from "../assets/logo.svg";
import homeGambar from "../assets/home-gambar.svg";
import { useAuth } from "../lib/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
	const [showPassword, setShowPassword] = useState(false);
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const { login } = useAuth();
	const navigate = useNavigate();

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		// Clear error saat user mulai mengetik
		if (error) setError("");
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Validasi form
		if (!formData.email || !formData.password) {
			setError("Email atau password masih kosong");
			return;
		}

		setIsLoading(true);
		setError("");

		try {
			const data = await login(formData.email, formData.password);
			console.log("Login success:", data);

			// Redirect based on role
			if (data.role === "hr") {
				navigate("/dashboard"); // Sementara ke dashboard dulu, nanti ke /admin jika sudah ada
			} else {
				navigate("/dashboard");
			}
		} catch (err) {
			setError(err.message || "Terjadi kesalahan saat login");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen w-full overflow-hidden bg-white font-sans">
			{/* Left Side - Form */}
			<div className="flex w-full flex-col items-center justify-center px-8 lg:w-1/2 lg:px-16 xl:px-24 relative z-20">
				<div className="w-full max-w-md">
					{/* Logo */}
					<div className="mb-8 flex justify-center">
						<img src={logoSvg} alt="HRIS Logo" className="h-24 w-auto" />
					</div>

					{/* Title */}
					<div className="mb-8 text-center">
						<h1 className="mb-2 text-3xl font-bold text-gray-900">
							Log In to your account
						</h1>
						<p className="text-sm text-gray-500">Welcome back</p>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className="space-y-5">
						{/* Alert Banner */}

						{/* Email Input */}
						<Input
							type="email"
							name="email"
							placeholder="Email"
							value={formData.email}
							onChange={handleChange}
							disabled={isLoading}
						/>

						{/* Password Input */}
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
						{/* Login Button */}
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
		</div>
	);
}
