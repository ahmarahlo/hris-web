import LogoHris from "../../../assets/logo.svg";
import {
	HomeIcon,
	UserGroupIcon,
	DocumentTextIcon,
	UsersIcon,
} from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";

export function SideBar({ activeMenu }) {
	const { user } = useAuth();

	let menus = [];

	if (user?.role === "hr" || user?.role === "admin") {
		menus = [
			{ name: "Beranda", href: "/admin", icon: HomeIcon },
			{
				name: "Manajemen absensi",
				href: "/admin/absensi",
				icon: UserGroupIcon,
			},
			{ name: "Manajemen cuti", href: "/admin/cuti", icon: DocumentTextIcon },
			{ name: "Manajemen akun", href: "/admin/akun", icon: UsersIcon },
		];
	} else {
		menus = [
			{ name: "Beranda", href: "/dashboard", icon: HomeIcon },
			{ name: "Pengajuan Cuti", href: "/cuti", icon: UserGroupIcon },
		];
	}

	return (
		<aside className="fixed left-0 top-0 h-screen w-80 bg-brand text-white flex flex-col shadow-xl z-50">
			{/* Logo */}
			<div className="flex text-center items-center justify-center pt-10 pb-8 w-29 mx-auto">
				<img
					src={LogoHris}
					alt="HRIS logo"
					className="w-full h-full object-contain"
				/>
			</div>

			{/* Menu */}
			<nav className="flex flex-col mt-6 flex-1">
				{menus.map((menu) => {
					const isActive = activeMenu === menu.name;
					const Icon = menu.icon;

					return (
						<Link
							key={menu.name}
							to={menu.href}
							className={`relative flex items-center gap-3 px-6 py-3 w-full text-lg font-medium transition-all duration-300 ease-in-out ${
								isActive
									? "bg-white text-brand! font-bold shadow-lg"
									: "text-white opacity-90 hover:opacity-100 hover:bg-brand-650 hover:font-bold hover:shadow-inner"
							}`}
						>
							<Icon className="w-5 h-5" />
							{menu.name}
						</Link>
					);
				})}
			</nav>
		</aside>
	);
}