import { Layout, Table, StatsCard } from "../../lib/components";
import { FunnelIcon } from "@heroicons/react/24/outline";

export default function ManajemenAbsensiPage() {
	// Mock Data
	// Data will be fetched from API
	const stats = [];

	// Validation Logic
	const isEarlyLeave = (timeStr) => {
		if (!timeStr || timeStr === "-") return false;
		const time = parseFloat(timeStr.replace(":", "."));
		return time < 17.0;
	};

	const columns = [
		{ header: "No", accessor: "no" },
		{ header: "Nama karyawan", accessor: "name" },
		{ header: "NIP", accessor: "nip" },
		{
			header: (
				<div className="flex items-center gap-1">
					Tanggal <FunnelIcon className="w-3 h-3" />
				</div>
			),
			accessor: "date",
		},
		{
			header: (
				<div className="flex items-center gap-1">
					Divisi <FunnelIcon className="w-3 h-3" />
				</div>
			),
			accessor: "division",
		},
		// { header: "Clock In", accessor: "clockIn" }, // Hidden based on design ref
		{
			header: "Clock Out",
			accessor: "clockOut",
			render: (row) => (
				<span
					className={
						isEarlyLeave(row.clockOut) ? "text-danger font-medium" : ""
					}
				>
					{row.clockOut}
				</span>
			),
		},
	];

	const data = [];

	return (
		<Layout activeMenu="Manajemen absensi" title="Manajemen absensi">
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
							Manajemen absensi karyawan
						</h3>
					</div>
					<div>
						<Table columns={columns} data={data} />
					</div>
				</div>
			</div>
		</Layout>
	);
}
