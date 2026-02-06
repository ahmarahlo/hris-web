import React from "react";
import { SideBar } from "../navigation/SideBar.jsx";
import { TopBar } from "../navigation/TopBar.jsx";

export function Layout({ children, title, activeMenu }) {
	// Simulasi data user yang login (Nanti ambil dari database/session)
	const currentUser = {
		name: "Reza Ariandi",
		role: "Divisi UI/UX",
		avatar:
			"https://ui-avatars.com/api/?name=Reza+Ariandi&background=0D8ABC&color=fff",
	};

	return (
		<div className="flex h-screen bg-gray-50 w-full">
			{/* Sidebar (Fixed width) */}
			<SideBar />

			{/* Main Content Area */}
			<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
				{/* TopBar */}
				<TopBar user={currentUser} />

				{/* Page Content */}
				<main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
					{children}
				</main>
			</div>
		</div>
	);
}
