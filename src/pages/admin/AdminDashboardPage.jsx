import { Layout, StatsCard, Table, Badge, Button } from "../../lib/components";
import { FunnelIcon } from "@heroicons/react/24/solid";
import {
	MagnifyingGlassIcon,
	XCircleIcon,
	CheckIcon,
} from "@heroicons/react/24/outline";

export default function AdminDashboardPage() {
	// Mock Data
	const stats = [
		{
			title: "Total karyawan",
			value: "3000",
			variant: "info",
		},
		{
			title: "Jumlah cuti pending",
			value: "10",
			variant: "info",
		},
		{
			title: "Karyawan masuk hari ini",
			value: "200",
			variant: "success",
		},
		{
			title: "Karyawan tidak masuk hari ini",
			value: "20",
			variant: "danger",
		},
	];

	const pendingLeaveColumns = [
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
			render: () => <Badge variant="pending">Pending</Badge>,
		},
		{ header: "User approve", accessor: "approver" },
		{
			header: "Action",
			accessor: "action",
			render: () => (
				<div className="flex gap-2 justify-center">
					<button className="p-1 rounded bg-danger text-white hover:bg-danger-600">
						<XCircleIcon className="w-5 h-5 stroke-2" />
					</button>
					<button className="p-1 rounded bg-success text-white hover:bg-success-600">
						<CheckIcon className="w-5 h-5 stroke-2" />
					</button>
				</div>
			),
		},
	];

	const pendingLeaveData = [
		{
			no: 1,
			name: "Ariandi",
			date: "8 Jan 2026",
			reason: "Sakit",
			hrNote: "",
			approver: "",
		},
		{
			no: 2,
			name: "Raffi",
			date: "7 Jan 2026",
			reason: "Acara keluarga",
			hrNote: "",
			approver: "",
		},
		{
			no: 3,
			name: "Dimas",
			date: "5 Jan 2026",
			reason: "Sakit",
			hrNote: "",
			approver: "",
		},
		{
			no: 4,
			name: "Ahmad",
			date: "5 Jan 2026",
			reason: "Keluar kota",
			hrNote: "",
			approver: "",
		},
		{
			no: 5,
			name: "Fandi",
			date: "1 Jan 2026",
			reason: "Sakit",
			hrNote: "",
			approver: "",
		},
	];

	// Validation Logic
	const isEarlyLeave = (timeStr) => {
		if (!timeStr || timeStr === "-") return false;
		// Convert "HH.MM" or "HH:MM" to float for comparison
		const time = parseFloat(timeStr.replace(":", "."));
		return time < 17.0;
	};

	const attendanceColumns = [
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
		{ header: "Clock In", accessor: "clockIn" },
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

	const attendanceData = [
		{
			no: 1,
			name: "Ariandi",
			nip: "N.1924.1003",
			date: "1 Jan 2026",
			division: "UI/UX Designer",
			clockIn: "07.54",
			clockOut: "18.09",
		},
		{
			no: 2,
			name: "Rizki",
			nip: "N.1924.1003",
			date: "1 Jan 2026",
			division: "IT OPS",
			clockIn: "08.00",
			clockOut: "17.00",
		},
		{
			no: 3,
			name: "Reno",
			nip: "N.1924.1003",
			date: "1 Jan 2026",
			division: "IT OPS",
			clockIn: "09.23",
			clockOut: "17.39",
		},
		{
			no: 4,
			name: "Fandi",
			nip: "N.1924.1003",
			date: "1 Jan 2026",
			division: "System Analyst",
			clockIn: "07.24",
			clockOut: "13.09",
		},
	];

	return (
		<Layout activeMenu="Beranda" title="Beranda">
			<div className="p-8 space-y-8 w-full">
				{/* STATS CARDS */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{stats.map((stat, index) => (
						<StatsCard
							key={index}
							title={stat.title}
							value={stat.value}
							variant={stat.variant}
						/>
					))}
				</div>

				{/* PENDING CUTI TABLE */}
				<div className="space-y-4">
					<div className="flex justify-start">
						<h3 className="text-gray-600 font-medium text-lg">
							Pengajuan cuti pending
						</h3>
					</div>
					<div>
						<Table columns={pendingLeaveColumns} data={pendingLeaveData} />
					</div>
				</div>

				{/* ABSENSI HARI INI TABLE */}
				<div className="space-y-4">
					<div className="flex justify-start">
						<h3 className="text-gray-600 font-medium text-lg">
							Absensi hari ini
						</h3>
					</div>
					<div>
						<Table columns={attendanceColumns} data={attendanceData} />
					</div>
				</div>
			</div>
		</Layout>
	);
}
