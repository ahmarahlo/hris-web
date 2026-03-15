import { useState } from "react";
import { SideBar } from "../navigation/SideBar";
import { TopBar } from "../navigation/TopBar";
import { useAuth } from "../../AuthContext";
import { getAvatarUrl } from "../../user";

export function Layout({ children, title, activeMenu }) {
	const { user, logout } = useAuth();
	const [isSideBarOpen, setIsSideBarOpen] = useState(false);

	// Use real user data or fallback
	const currentUser = user || {
		name: "Guest",
		role: "Guest",
	};

	// Construct avatar URL using centralized utility
	currentUser.avatar = getAvatarUrl(currentUser.name || currentUser.full_name);

	return (
		<div className="min-h-screen bg-brand font-sans flex overflow-x-hidden">
			<SideBar
				activeMenu={activeMenu}
				isOpen={isSideBarOpen}
				setIsOpen={setIsSideBarOpen}
			/>

			<main className="flex-1 xl:ml-80 min-h-screen bg-white flex flex-col transition-all duration-300">
				<TopBar
					title={title}
					user={currentUser}
					toggleSideBar={() => setIsSideBarOpen(!isSideBarOpen)}
				/>

				<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
					{children}
				</div>
			</main>
		</div>
	);
}
