import { useState, useEffect } from "react";
import { Layout, Table } from "../../lib/components";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { api } from "../../lib/api";

export default function ManajemenAbsensiPage() {
	const [attendanceData, setAttendanceData] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		try {
			const attendance = await api.getDashboardAttendance();

			const mapped = (Array.isArray(attendance) ? attendance : []).map(
				(item, i) => ({
					no: i + 1,
					name: item.full_name || item.employee_name || item.name || "-",
					nip: item.nik || item.nip || "-",
					date: formatDate(item.date || item.created_at),
					division: item.department || item.division || "-",
					clockIn: formatTime(item.clock_in || item.clockIn),
					clockOut: formatTime(item.clock_out || item.clockOut),
				}),
			);
			setAttendanceData(mapped);
		} catch (error) {
			console.error("Error fetching attendance:", error);
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (dateStr) => {
		if (!dateStr) return "-";
		try {
			const d = new Date(dateStr);
			return d.toLocaleDateString("id-ID", {
				day: "numeric",
				month: "short",
				year: "numeric",
			});
		} catch {
			return dateStr;
		}
	};

	const formatTime = (timeStr) => {
		if (!timeStr) return "-";
		try {
			if (timeStr.includes("T") || timeStr.includes("-")) {
				const d = new Date(timeStr);
				return d
					.toLocaleTimeString("id-ID", {
						hour: "2-digit",
						minute: "2-digit",
						hour12: false,
					})
					.replace(":", ".");
			}
			return timeStr.replace(":", ".");
		} catch {
			return timeStr;
		}
	};

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

	return (
		<Layout activeMenu="Manajemen absensi" title="Manajemen absensi">
			<div className="p-8 space-y-8 w-full">
				<div className="space-y-4">
					<div className="flex justify-start">
						<h3 className="text-gray-600 font-medium text-lg">
							Manajemen absensi karyawan
						</h3>
					</div>
					<div>
						<Table columns={columns} data={attendanceData} />
					</div>
				</div>
			</div>
		</Layout>
	);
}
