import LogoHris from "../../../assets/logo.svg";
import {
	HomeIcon,
	UserGroupIcon,
	DocumentTextIcon,
	UsersIcon,
	ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/solid";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";

export function SideBar({ activeMenu }) {
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	// Define menus based on role
	let menus = [];

	if (user?.role === "hr") {
		menus = [
			{ name: "Beranda", href: "/admin", icon: HomeIcon },
			{ name: "Manajemen Karyawan", href: "/admin/karyawan", icon: UsersIcon },
			{ name: "Manajemen Cuti", href: "/admin/cuti", icon: DocumentTextIcon },
		];
	} else {
		// Default to employee
		menus = [
			{ name: "Beranda", href: "/dashboard", icon: HomeIcon },
			{ name: "Pengajuan Cuti", href: "/cuti", icon: UserGroupIcon },
		];
	}

	return (
		<aside className="fixed left-0 top-0 h-screen w-64 bg-brand text-white flex flex-col shadow-2xl z-50">
			{/* LOGO SECTION */}
			<div className="flex text-center items-center justify-center pt-10 pb-8 w-29 mx-auto">
				<img
					src={LogoHris}
					alt="HRIS logo"
					className="w-full h-full object-contain"
				/>
			</div>

			{/* MENU SECTION */}
			<nav className="flex flex-col gap-2 mt-4 flex-1">
				{menus.map((menu) => {
					const isActive = activeMenu === menu.name;
					const Icon = menu.icon;

					return (
						<Link
							key={menu.name}
							to={menu.href}
							className={`
                relative flex items-center gap-3 px-6 py-3 w-full
                text-lg font-medium transition-all duration-300 ease-in-out
                ${
									isActive
										? "bg-white text-brand! font-bold shadow-lg"
										: "text-white opacity-90 hover:opacity-100 hover:bg-brand-650 hover:font-bold hover:shadow-inner"
								}
              `}
						>
							<Icon className="w-5 h-5" />
							{menu.name}
						</Link>
					);
				})}
			</nav>

			{/* LOGOUT BUTTON */}
			<div className="p-4 mb-4">
				<button
					onClick={handleLogout}
					className="flex items-center gap-3 px-6 py-3 w-full text-lg font-medium text-white opacity-90 hover:opacity-100 hover:bg-brand-650 hover:font-bold rounded-lg transition-all"
				>
					<ArrowLeftOnRectangleIcon className="w-5 h-5" />
					Logout
				</button>
			</div>
		</aside>
	);
}
