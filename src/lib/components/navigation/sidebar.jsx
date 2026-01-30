import React from "react";
import LogoHris from "../../../assets/logo.svg";

export function SideBar({ activeMenu }) {
	const menus = [
		{ name: "Beranda", href: "/dashboard" },
		{ name: "Pengajuan Cuti", href: "/pengajuan" },
	];

	return (
		<aside className="fixed left-0 top-0 h-screen w-64 bg-brand text-white flex flex-col shadow-2xl z-50">
			{/* LOGO SECTION */}
			<div className="flex text-center items-center justify-center pt-10 pb-8 w-[116px] mx-auto">
				<img
					src={LogoHris}
					alt="HRIS logo"
					className="w-full h-full object-contain"
				/>
			</div>

			{/* MENU SECTION */}
			<nav className="flex flex-col gap-2 mt-4">
				{menus.map((menu) => {
					const isActive = activeMenu === menu.name;

					return (
						<a
							key={menu.name}
							href={menu.href}
							className={`
                                relative flex items-center px-6 py-3 w-ful
                                text-lg font-medium transition-all duration-300 ease-in-out
                                text-white
                                
                                /* EFEK HOVER DI SINI */
                                hover:bg-brand-650 hover:font-bold hover:shadow-inner
                                
                                /* LOGIKA MENU AKTIF */
                                ${
																	isActive
																		? "bg-white text-brand font-bold shadow-lg translate-x-2"
																		: "opacity-90 hover:opacity-100"
																}
                            `}
						>
							{menu.name}
						</a>
					);
				})}
			</nav>
		</aside>
	);
}
