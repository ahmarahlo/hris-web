import LogoHris from "../../../assets/logo.svg";
import {
	HomeIcon,
	UserGroupIcon,
	DocumentTextIcon,
	UsersIcon,
	ShieldCheckIcon,
	UserPlusIcon,
	ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/solid";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../AuthContext";

export function SideBar({ activeMenu, isOpen, setIsOpen }) {
	const { user } = useAuth();
	const location = useLocation();

	const isManagement =
		user?.role === "hr" ||
		user?.role === "admin" ||
		user?.role === "superadmin";

	let menus;
	if (isManagement) {
		menus = [
			{ name: "Beranda", href: "/admin", icon: HomeIcon },
			{
				name: "Manajemen absensi",
				href: "/admin/absensi",
				icon: ClipboardDocumentCheckIcon,
			},
			{ name: "Manajemen cuti", href: "/admin/cuti", icon: DocumentTextIcon },
			{ name: "Manajemen akun user", href: "/admin/akun", icon: UserPlusIcon },
			...(user?.role === "superadmin"
				? [
						{
							name: "Manajemen admin",
							href: "/admin/super/admin",
							icon: UsersIcon,
						},
					]
				: []),
			{ name: "Pengajuan cuti", href: "/cuti", icon: DocumentTextIcon },
		];
	} else {
		menus = [
			{ name: "Beranda", href: "/dashboard", icon: HomeIcon },
			{ name: "Pengajuan Cuti", href: "/cuti", icon: UserGroupIcon },
		];
	}

	return (
		<>
			{/* Backdrop for mobile */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black/50 z-40 xl:hidden backdrop-blur-sm transition-all duration-300"
					onClick={() => setIsOpen(false)}
				/>
			)}

			<aside
				className={`fixed left-0 top-0 h-screen w-80 bg-brand text-white flex flex-col shadow-xl z-50 transition-all duration-300 ease-in-out xl:translate-x-0 ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				{/* Logo */}
				<div className="flex text-center items-center justify-center pt-10 pb-8 w-29 mx-auto">
					<img
						src={LogoHris}
						alt="HRIS logo"
						className="w-full h-full object-contain"
					/>
				</div>

				{/* Menu */}
				<nav className="flex flex-col mt-6 flex-1 overflow-y-auto">
					{menus.map((menu, index) => {
						if (menu.type === "separator") {
							return (
								<div
									key={`sep-${index}`}
									className="px-6 py-4 mt-4 text-xs font-bold text-white/40 uppercase tracking-widest border-t border-white/10"
								>
									{menu.name}
								</div>
							);
						}

						const isActive =
							location.pathname === menu.href || activeMenu === menu.name;
						const Icon = menu.icon;

						return (
							<Link
								key={menu.name}
								to={menu.href}
								onClick={() => setIsOpen(false)}
								className={`relative flex items-center gap-3 px-6 py-3 w-full text-lg font-medium transition-all duration-300 ease-in-out ${
									isActive
										? "bg-white text-brand! font-bold"
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
		</>
	);
}
