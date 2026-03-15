import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { getAvatarUrl } from "../../user";
import { useAuth } from "../../AuthContext";
import {
	ArrowLeftOnRectangleIcon,
	KeyIcon,
	ChevronDownIcon,
	UserIcon,
	Bars3Icon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { ResetPasswordModal } from "../modal/ResetPasswordModal";
import { Alert } from "../alert/Alert";

export function TopBar({ toggleSideBar }) {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [isOpen, setIsOpen] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
	const [passwordAlert, setPasswordAlert] = useState(null);
	const dropdownRef = useRef(null);

	// Default display if user is not loaded yet
	const displayUser = user || {
		name: "User",
		role: "Guest",
	};

	const handleLogout = async () => {
		setIsOpen(false);
		setIsLoggingOut(true);

		// Artificial delay for premium feel
		await new Promise((resolve) => setTimeout(resolve, 1000));

		logout();
		navigate("/login");
	};

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// Auto-close success alert
	useEffect(() => {
		if (passwordAlert) {
			const timer = setTimeout(() => {
				setPasswordAlert(null);
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [passwordAlert]);

	return (
		<>
			<header className="flex justify-between items-center w-full border-b-2 border-disable-hover xl:p-4 px-4 py-3 bg-white sticky top-0 z-40">
				<div className="flex items-center gap-3">
					<button
						onClick={toggleSideBar}
						className="p-2 -ml-2 xl:hidden hover:bg-gray-100 rounded-lg transition-colors duration-200 text-gray-600"
					>
						<Bars3Icon className="w-6 h-6" />
					</button>

					<div className="text-border xl:ml-5">
						<h1 className="text-xl xl:text-2xl font-bold text-disable-color">
							Hello, {displayUser.name}
						</h1>
						<p className="text-xs xl:text-sm text-gray-500 capitalize">
							{displayUser.role}
						</p>
					</div>
				</div>

				<div className="lg:mr-5 relative" ref={dropdownRef}>
					<button
						onClick={() => setIsOpen(!isOpen)}
						className="flex items-center gap-2 focus:outline-none hover:bg-gray-50 p-2 rounded-xl transition-colors duration-200"
					>
						<img
							src={getAvatarUrl(displayUser.name || displayUser.full_name)}
							alt="Profile"
							className="w-10 h-10 rounded-full border border-gray-200 object-cover"
						/>
						<ChevronDownIcon
							className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
								isOpen ? "rotate-180" : ""
							}`}
						/>
					</button>

					{/* Dropdown Menu */}
					{isOpen && (
						<div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-200 overflow-hidden z-50">
							{/* Header for mobile primarily */}
							<div className="px-4 py-3 border-b border-gray-100 sm:hidden">
								<p className="text-sm font-semibold text-gray-900">
									{displayUser.name}
								</p>
								<p className="text-xs text-gray-500 truncate">
									{displayUser.email}
								</p>
							</div>

							{/* Menu Items */}
							<div className="flex flex-col">
								<button
									onClick={() => {
										setIsOpen(false);
										navigate(`/admin/akun/${displayUser.id}`);
									}}
									className="w-full text-left px-4 py-3 text-sm text-brand-600 hover:bg-brand hover:text-white flex items-center gap-2 transition-all duration-200 font-medium rounded-none active:scale-95 border-b border-gray-50"
								>
									<UserIcon className="w-5 h-5" />
									Profil
								</button>

								{displayUser.role !== "hr" && (
									<button
										onClick={() => {
											setIsOpen(false);
											setIsResetPasswordOpen(true);
										}}
										className="w-full text-left px-4 py-3 text-sm text-success hover:bg-success hover:text-white flex items-center gap-2 transition-all duration-200 font-medium rounded-none active:scale-95 border-b border-gray-50"
									>
										<KeyIcon className="w-5 h-5" />
										Ganti Password
									</button>
								)}

								<button
									onClick={handleLogout}
									className="w-full text-left px-4 py-3 text-sm text-danger hover:bg-danger hover:text-white flex items-center gap-2 transition-all duration-200 font-medium rounded-none active:scale-95"
								>
									<ArrowLeftOnRectangleIcon className="w-5 h-5" />
									Logout
								</button>
							</div>
						</div>
					)}
				</div>
			</header>

			<ResetPasswordModal
				isOpen={isResetPasswordOpen}
				onClose={() => setIsResetPasswordOpen(false)}
				onSuccess={(msg) => setPasswordAlert({ type: "success", message: msg })}
			/>

			{isLoggingOut &&
				createPortal(
					<div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60  p-4 text-center">
						<Alert variant="loading" title="Logging out..." hideButtons />
					</div>,
					document.body,
				)}

			{passwordAlert &&
				createPortal(
					<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60  p-4 text-center">
						<Alert
							variant={passwordAlert.type}
							message={passwordAlert.message}
							hideButtons
							hideTitle
						/>
					</div>,
					document.body,
				)}
		</>
	);
}
