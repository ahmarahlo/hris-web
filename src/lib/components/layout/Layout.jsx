import { SideBar } from "../navigation/SideBar";
import { TopBar } from "../navigation/TopBar";
import { useAuth } from "../../AuthContext";

export function Layout({ children, title, activeMenu }) {
	const { user, logout } = useAuth();

	// Use real user data or fallback
	const currentUser = user || {
		name: "Guest",
		role: "Guest",
		avatar:
			"https://ui-avatars.com/api/?name=Guest&background=0D8ABC&color=fff",
	};

	// Construct avatar URL if not in user object (assuming user object only has name)
	if (user && !user.avatar) {
		currentUser.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`;
	}

	return (
		<div className="min-h-screen bg-brand font-sans flex">
			<SideBar activeMenu={activeMenu} />

			<main className="flex-1 ml-64 min-h-screen bg-white flex flex-col">
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
