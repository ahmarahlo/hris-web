import React from "react";
import { SideBar } from "../navigation/sidebar.jsx";
import { TopBar } from "../navigation/topbar.jsx";

export function Layout({ children, title, activeMenu }) {
	// Simulasi data user yang login (Nanti ambil dari database/session)
	const currentUser = {
		name: "Reza Ariandi",
		role: "Divisi UI/UX",
		avatar:
			"https://ui-avatars.com/api/?name=Reza+Ariandi&background=0D8ABC&color=fff",
	};

	return (
		<div className="min-h-screen bg-[#F5F5F5] font-sans flex">
			<SideBar activeMenu={activeMenu} />

			<main className="flex-1 ml-64 min-h-screen bg-[#F5F5F5] flex flex-col">
				<div>
					<TopBar title={title} user={currentUser} />
				</div>

				<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
					{children}
				</div>
			</main>
		</div>
	);
}
