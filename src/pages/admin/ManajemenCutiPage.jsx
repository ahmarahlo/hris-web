import { Layout, Table, Badge, StatsCard } from "../../lib/components";
import { FunnelIcon } from "@heroicons/react/24/outline";

export default function ManajemenCutiPage() {
	// Mock Data
	// Data will be fetched from API
	const stats = [];

	const columns = [
		{ header: "No", accessor: "no" },
		{ header: "Nama karyawan", accessor: "name" },
		{
			header: (
				<div className="flex items-center gap-1">
					Tanggal cuti <FunnelIcon className="w-3 h-3" />
				</div>
			),
			accessor: "date",
		},
		{ header: "Alasan", accessor: "reason" },
		{ header: "Catatan HR", accessor: "hrNote" },
		{
			header: (
				<div className="flex items-center gap-1">
					Status <FunnelIcon className="w-3 h-3" />
				</div>
			),
			accessor: "status",
			render: (row) => <Badge variant={row.status}>{row.status}</Badge>,
		},
		{ header: "User approve", accessor: "approver" },
		{
			header: "Action",
			accessor: "action",
			render: () => (
				<div className="flex gap-2 justify-center">{/* Action buttons */}</div>
			),
		},
	];

	const data = [];

	return (
		<Layout activeMenu="Manajemen cuti" title="Manajemen cuti">
			<div className="p-8 space-y-8 w-full">
				{/* STATS CARDS */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{stats.map((stat, index) => (
						<StatsCard
							key={index}
							title={stat.title}
							value={stat.value}
							variant={stat.variant}
						/>
					))}
				</div>

				{/* TABLE */}
				<div className="space-y-4">
					<div className="flex justify-start">
						<h3 className="text-gray-600 font-medium text-lg">
							Manajemen cuti karyawan
						</h3>
					</div>
					<div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
						<Table columns={columns} data={data} />
					</div>
				</div>
			</div>
		</Layout>
	);
}
