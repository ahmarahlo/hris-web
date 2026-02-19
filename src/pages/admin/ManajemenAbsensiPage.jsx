import { useState, useEffect } from "react";
import { Layout, Table, Alert } from "../../lib/components";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { api } from "../../lib/api";
import { LOADING_DELAY } from "../../lib/constants";

export default function ManajemenAbsensiPage() {
	const [attendanceData, setAttendanceData] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		setLoading(true);
		try {
			const minDelay = new Promise((resolve) =>
				setTimeout(resolve, LOADING_DELAY),
			);

			const [attendance] = await Promise.all([
				api.getDashboardAttendance(),
				minDelay,
			]);

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
		if (!timeStr || timeStr === "-") return "-";
		try {
			if (timeStr.includes("T") || timeStr.includes("-")) {
				const d = new Date(timeStr);
				if (isNaN(d.getTime())) return "-";
				return d
					.toLocaleTimeString("id-ID", {
						hour: "2-digit",
						minute: "2-digit",
						hour12: false,
					})
					.replace(":", ".");
			}
			// Handle HH:mm:ss or HH:mm
			const parts = timeStr.split(":");
			if (parts.length >= 2) {
				return `${parts[0].padStart(2, "0")}.${parts[1].padStart(2, "0")}`;
			}
			return timeStr.replace(":", ".");
		} catch {
			return "-";
		}
	};

	const isEarlyLeave = (formattedTime) => {
		if (!formattedTime || formattedTime === "-") return false;
		try {
			const [hour] = formattedTime.split(".").map(Number);
			return hour < 17;
		} catch {
			return false;
		}
	};

	const columns = [
		{ header: "No", accessor: "no", className: "w-16" },
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
			header: "Jam Masuk",
			accessor: "clockIn",
			render: (row) => (
				<span className="text-success-600 font-medium">{row.clockIn}</span>
			),
		},
		{
			header: "Jam Pulang",
			accessor: "clockOut",
			render: (row) => (
				<span
					className={
						isEarlyLeave(row.clockOut) ? "text-danger font-medium" : "text-info"
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
				{loading && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
						<Alert
							variant="loading"
							title="Memuat Data Absensi..."
							shadow={true}
						/>
					</div>
				)}

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
