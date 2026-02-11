import React, { useEffect, useState } from "react";
import { Layout, Card, Table, Badge } from "../lib/components";
import { FunnelIcon } from "@heroicons/react/24/solid";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

// Helper untuk format tanggal/waktu
const formatDate = (dateString) => {
	if (!dateString) return "-";
	const date = new Date(dateString);
	return date.getDate().toString().padStart(2, "0");
};

const formatMonth = (dateString) => {
	if (!dateString) return "-";
	const date = new Date(dateString);
	return date.toLocaleString("id-ID", { month: "long" });
};

const formatTime = (timeString) => {
	if (!timeString) return "-";
	// Asumsi format dari API bisa "HH:mm:ss" atau ISO
	// Jika ISO, ambil jam:menit
	if (timeString.includes("T")) {
		const date = new Date(timeString);
		return date
			.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
			.replace(".", ":");
	}
	return timeString.substring(0, 5);
};

export default function DashboardPage() {
	const { user } = useAuth();
	const [stats, setStats] = useState({
		attendanceToday: null,
		leaves: [],
		attendanceHistory: [],
		leaveBalance: 0,
		totalLeaves: 0, // Total cuti tahunan (hardcoded 12 for now or derived?)
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [userData, attendanceToday, attendanceHistory, leaves] =
					await Promise.all([
						api.getMe().catch(() => ({ leaveBalance: 0 })),
						api.getAttendanceToday().catch(() => null),
						api.getAttendanceHistory().catch(() => []),
						api.getLeaves().catch(() => []),
					]);

				// Hitung total pengajuan cuti tahun ini (approved?)
				// API leaves returns all requests.
				// Assuming "totalCuti" means "Cuti diambil" or "Jatah Cuti"?
				// Design says "Total pengajuan cuti tahun ini" and "Cuti tersisa".
				// Let's assume user.leaveBalance is remaining.
				// Total taken = 12 - remaining? Or just count from history.

				setStats({
					attendanceToday,
					leaves,
					attendanceHistory,
					leaveBalance: userData.leaveBalance,
					totalLeaves: leaves.length,
				});
			} catch (error) {
				console.error("Error fetching dashboard data:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	const handleClockIn = async () => {
		try {
			const now = new Date();
			const timeString = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
			await api.clockIn(timeString);
			// Refresh data
			const updatedToday = await api.getAttendanceToday();
			setStats((prev) => ({ ...prev, attendanceToday: updatedToday }));
		} catch (error) {
			alert(error.message);
		}
	};

	const handleClockOut = async () => {
		try {
			const now = new Date();
			const timeString = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
			await api.clockOut(timeString);
			// Refresh data
			const updatedToday = await api.getAttendanceToday();
			setStats((prev) => ({ ...prev, attendanceToday: updatedToday }));
		} catch (error) {
			alert(error.message);
		}
	};

	// --- Data Transformation for Tables ---

	const absensiData = stats.attendanceHistory
		.slice(0, 5)
		.map((item, index) => ({
			no: index + 1,
			tanggal: formatDate(item.date),
			bulan: formatMonth(item.date),
			durasi: item.clockOut ? "8 Jam" : "-", // Hitung durasi real later
			clockIn: formatTime(item.clockIn),
			clockOut: formatTime(item.clockOut),
			clockInColor: true, // Styling logic
			clockOutColor: !!item.clockOut,
		}));

	const cutiData = stats.leaves.slice(0, 5).map((item, index) => ({
		no: index + 1,
		mulai: formatDate(item.startDate),
		selesai: formatDate(item.endDate),
		alasan: item.reason,
		catatan: item.notes || "-",
		lastUser: item.approver || "-",
		status: item.status,
	}));

	// --- Columns Definition ---
	const absensiColumns = [
		{ header: "No", accessor: "no" },
		{ header: "Tanggal", accessor: "tanggal" },
		{ header: "Bulan", accessor: "bulan" },
		{ header: "Durasi kerja", accessor: "durasi" },
		{
			header: "Clock In",
			accessor: "clockIn",
			render: (row) => <span className="text-success-600">{row.clockIn}</span>,
		},
		{
			header: "Clock Out",
			accessor: "clockOut",
			render: (row) => <span className="text-info">{row.clockOut}</span>,
		},
	];

	const cutiColumns = [
		{ header: "No", accessor: "no" },
		{ header: "Mulai", accessor: "mulai" },
		{ header: "Selesai", accessor: "selesai" },
		{ header: "Alasan", accessor: "alasan" },
		{
			header: "Status",
			accessor: "status",
			render: (row) => (
				<Badge variant={row.status}>
					{row.status === "approved"
						? "Approved"
						: row.status === "rejected"
							? "Rejected"
							: "Pending"}
				</Badge>
			),
		},
	];

	// --- Card Variant Logic ---
	// absen_belum: jika attendanceToday null atau clockIn null
	// absen_sudah: jika clockIn ada tapi clockOut belum
	// absen_lengkap: jika clockIn dan clockOut ada

	let cardVariant = "absen_belum";
	if (stats.attendanceToday) {
		if (stats.attendanceToday.clockIn && !stats.attendanceToday.clockOut) {
			cardVariant = "absen_sudah";
		} else if (
			stats.attendanceToday.clockIn &&
			stats.attendanceToday.clockOut
		) {
			cardVariant = "absen_lengkap";
		}
	}

	return (
		<Layout activeMenu="Beranda">
			<div className="p-6 space-y-8">
				{loading ? (
					<div>Loading dashboard data...</div>
				) : (
					<>
						{/* Cards Section */}
						<div className="flex gap-6 flex-col lg:flex-row">
							<Card
								variant={cardVariant}
								jamMasuk={formatTime(stats.attendanceToday?.clockIn)}
								jamPulang={formatTime(stats.attendanceToday?.clockOut)}
								durasi="-"
								onAction={
									cardVariant === "absen_belum" ? handleClockIn : handleClockOut
								}
							/>
							<Card
								variant="cuti"
								totalCuti={stats.totalLeaves} // Total diajukan
								sisaCuti={stats.leaveBalance}
										onAction={() => {
									/* Navigate/Open Modal */
								}}
							/>
						</div>

						{/* Riwayat Absensi */}
						<div>
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-xl font-bold text-brand-900">
									Riwayat Absensi
								</h2>
							</div>
							<Table columns={absensiColumns} data={absensiData} />
						</div>

						{/* Riwayat Cuti Bulan Ini */}
						<div>
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-xl font-bold text-brand-900">
									Riwayat Cuti
								</h2>
							</div>
							<Table columns={cutiColumns} data={cutiData} />
						</div>
					</>
				)}
			</div>
		</Layout>
	);
}
