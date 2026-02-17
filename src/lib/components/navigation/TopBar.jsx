import { useState, useRef, useEffect } from "react";
import avatar from "../../../assets/avatar.svg";
import { useAuth } from "../../AuthContext";
import {
	ArrowLeftOnRectangleIcon,
	KeyIcon,
	ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { ResetPasswordModal } from "../modal/ResetPasswordModal";

export function TopBar() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [isOpen, setIsOpen] = useState(false);
	const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
	const dropdownRef = useRef(null);

	// Default display if user is not loaded yet
	const displayUser = user || {
		name: "User",
		role: "Guest",
	};

	const handleLogout = () => {
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

	return (
		<>
			<header className="flex justify-between items-center w-full border-b-2 border-disable-hover p-4 bg-white sticky top-0 z-40">
				<div className="text-border ml-5">
					<h1 className="text-2xl font-bold text-disable-color">
						Hello, {displayUser.name}
					</h1>
					<p className="text-sm text-gray-500 capitalize">{displayUser.role}</p>
				</div>

				<div className="mr-5 relative" ref={dropdownRef}>
					<button
						onClick={() => setIsOpen(!isOpen)}
						className="flex items-center gap-2 focus:outline-none hover:bg-gray-50 p-2 rounded-xl transition-colors duration-200"
					>
						<img
							src={avatar}
							alt="Profile"
							className="w-10 h-10 rounded-full border border-gray-200"
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
								{displayUser.role !== "hr" && (
									<button
										onClick={() => {
											setIsOpen(false);
											setIsResetPasswordOpen(true);
										}}
										className="w-full text-left px-4 py-3 text-sm text-success hover:bg-success hover:text-white flex items-center gap-2 transition-all duration-200 font-medium rounded-none active:scale-95"
									>
										<KeyIcon className="w-5 h-5" />
										Reset Password
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
			/>
		</>
	);
}
