import { useState, useEffect } from "react";
import { Layout, StatsCard, Card, Alert } from "../../lib/components";
import { api } from "../../lib/api";
import { USER_ROLES, LOADING_DELAY } from "../../lib/constants";
import {
	ShieldCheckIcon,
	UsersIcon,
	UserPlusIcon,
	KeyIcon,
} from "@heroicons/react/24/outline";

export default function SuperAdminPage() {
	const [stats, setStats] = useState({
		total: 0,
		admin: 0,
		hr: 0,
		employee: 0,
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchSystemStats();
	}, []);

	const fetchSystemStats = async () => {
		setLoading(true);
		try {
			const minDelay = new Promise((resolve) =>
				setTimeout(resolve, LOADING_DELAY),
			);
			const [rawResponse] = await Promise.all([
				api.getDashboardEmployees({ limit: 1000 }),
				minDelay,
			]);

			const response = rawResponse.data || [];
			const total = rawResponse.total ?? response.length;

			const counts = {
				total: total,
				admin: response.filter((u) => u.role === USER_ROLES.ADMIN).length,
				hr: response.filter((u) => u.role === USER_ROLES.HR).length,
				employee: response.filter((u) => u.role === USER_ROLES.EMPLOYEE).length,
				superadmin: response.filter((u) => u.role === USER_ROLES.SUPERADMIN)
					.length,
			};
			setStats(counts);
		} catch (error) {
			console.error("Error fetching super admin stats:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Layout activeMenu="System Control" title="Super Admin Dashboard">
			<div className="p-8 space-y-8">
				{loading && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 ">
						<Alert
							variant="loading"
							title="Initializing System Control..."
							shadow={true}
						/>
					</div>
				)}

				<div className="flex items-center gap-4 mb-2">
					<div className="p-3 bg-brand-100 rounded-2xl text-brand">
						<ShieldCheckIcon className="w-8 h-8" />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-brand-900">
							System Control Panel
						</h1>
						<p className="text-gray-500">
							Manage global roles and system-wide configurations
						</p>
					</div>
				</div>

				{/* System Stats */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<StatsCard
						title="Total Users"
						value={String(stats.total)}
						variant="info"
					/>
					<StatsCard
						title="Admins"
						value={String(stats.admin)}
						variant="success"
					/>
					<StatsCard
						title="HR Personnel"
						value={String(stats.hr)}
						variant="info"
					/>
					<StatsCard
						title="Employees"
						value={String(stats.employee)}
						variant="info"
					/>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Quick Actions */}
					<div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
						<h3 className="text-lg font-bold text-brand-900 flex items-center gap-2">
							<KeyIcon className="w-5 h-5" />
							Privileged Actions
						</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="p-4 border border-brand-100 rounded-2xl hover:bg-brand-50 transition-colors cursor-pointer group">
								<UsersIcon className="w-6 h-6 text-brand mb-2 group-hover:scale-110 transition-transform" />
								<p className="font-semibold text-brand-900">Role Management</p>
								<p className="text-xs text-gray-500">
									Promote or demote users across the system
								</p>
							</div>
							<div className="p-4 border border-brand-100 rounded-2xl hover:bg-brand-50 transition-colors cursor-pointer group">
								<UserPlusIcon className="w-6 h-6 text-brand mb-2 group-hover:scale-110 transition-transform" />
								<p className="font-semibold text-brand-900">System Logs</p>
								<p className="text-xs text-gray-500">
									Monitor all administrative activities (Coming Soon)
								</p>
							</div>
						</div>
					</div>

					{/* Role Distribution Chart Placeholder / Info */}
					<div className="bg-brand-900 p-8 rounded-3xl text-white relative overflow-hidden">
						<div className="relative z-10">
							<h3 className="text-xl font-bold mb-4">Security Advisory</h3>
							<p className="text-brand-100 text-sm leading-relaxed mb-6">
								As a Super Admin, you have the authority to modify roles of all
								users. Exercise caution when assigning administrative privileges
								to ensure system integrity.
							</p>
							<div className="flex gap-4">
								<div className="px-4 py-2 bg-white/10 rounded-xl text-xs backdrop-blur-md">
									Role Auditing Active
								</div>
								<div className="px-4 py-2 bg-white/10 rounded-xl text-xs backdrop-blur-md">
									SSL Encrypted
								</div>
							</div>
						</div>
						<ShieldCheckIcon className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 rotate-12" />
					</div>
				</div>
			</div>
		</Layout>
	);
}
