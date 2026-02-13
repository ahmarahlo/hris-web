import React, { useEffect, useState } from "react";
import { Layout, Card, Table, Badge, Modal, Alert } from "../lib/components";
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
		totalLeaves: 0,
	});
	const [loading, setLoading] = useState(true);
	const [isEarlyLeaveModalOpen, setIsEarlyLeaveModalOpen] = useState(false);
	const [pendingClockOutTime, setPendingClockOutTime] = useState(null);
	const [earlyClockOutReason, setEarlyClockOutReason] = useState("");

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

	// Helper untuk hitung durasi
	const calculateDuration = (startTime, endTime) => {
		if (!startTime || !endTime) return "-";

		// Parse "HH:mm:ss" or "HH:mm"
		// Asumsi format timeString dari API konsisten, tapi kita handle basic
		const [startHour, startMinute] = startTime.split(":").map(Number);
		const [endHour, endMinute] = endTime.split(":").map(Number);

		let durationHour = endHour - startHour;
		let durationMinute = endMinute - startMinute;

		if (durationMinute < 0) {
			durationHour -= 1;
			durationMinute += 60;
		}

		return `${durationHour} Jam ${durationMinute > 0 ? `${durationMinute} Menit` : ""}`;
	};

	// Helper untuk mendapatkan format jam:menit dari Date object
	const getHHMM = (date) => {
		return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
	};

	const handleClockIn = async () => {
		try {
			const now = new Date();
			const defaultTime = getHHMM(now);

			const customTime = window.prompt(
				"Masukkan jam Clock In (HH:mm)",
				defaultTime,
			);
			if (!customTime) return; // Cancelled

			await api.clockIn(customTime);
			// Refresh data
			const updatedToday = await api.getAttendanceToday();
			const updatedHistory = await api.getAttendanceHistory(); // Refresh history juga biar tabel update
			setStats((prev) => ({
				...prev,
				attendanceToday: updatedToday,
				attendanceHistory: updatedHistory,
			}));
		} catch (error) {
			alert(error.message);
		}
	};

	const handleClockOut = async () => {
		const now = new Date();
		const defaultTime = getHHMM(now);

		const customTime = window.prompt(
			"Masukkan jam Clock Out (HH:mm)",
			defaultTime,
		);
		if (!customTime) return; // Cancelled

		const [hour] = customTime.split(":").map(Number);

		// Logic validasi pulang cepat (< 17:00) - Gunakan threshold normal 17:00
		// Untuk testing sekarang, anggap jam < 19:00 = pulang cepat
		if (hour < 19) {
			setPendingClockOutTime(customTime);
			setIsEarlyLeaveModalOpen(true);
			return;
		}

		// Jika tidak pulang cepat, langsung clock out
		await processClockOut(customTime);
	};

	const processClockOut = async (time, reason = null) => {
		try {
			await api.clockOut(time, reason);
			// Refresh data
			const updatedToday = await api.getAttendanceToday();
			const updatedHistory = await api.getAttendanceHistory();
			setStats((prev) => ({
				...prev,
				attendanceToday: updatedToday,
				attendanceHistory: updatedHistory,
			}));
		} catch (error) {
			alert(error.message);
		}
	};

	const confirmEarlyClockOut = async () => {
		if (pendingClockOutTime) {
			await processClockOut(pendingClockOutTime, earlyClockOutReason);
			setIsEarlyLeaveModalOpen(false);
			setPendingClockOutTime(null);
			setEarlyClockOutReason("");
		}
	};

	// --- Data Transformation for Tables ---

	// --- Data Transformation for Tables ---

	const absensiData = stats.attendanceHistory.map((item, index) => {
		// Logic Telat: Jika jam masuk > 08:00
		const isLate = item.clockIn > "08:00";

		return {
			no: index + 1,
			tanggal: formatDate(item.date),
			bulan: formatMonth(item.date),
			durasi: item.clockOut
				? calculateDuration(item.clockIn, item.clockOut)
				: "-", // Pakai fungsi yang sudah ada
			clockIn: formatTime(item.clockIn),
			clockOut: formatTime(item.clockOut),
			isLate: isLate, // Flag untuk styling
		};
	});

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
			header: "Jam Masuk",
			accessor: "clockIn",
			render: (row) => (
				<span className={row.isLate ? "text-danger" : "text-success-600"}>
					{row.clockIn}
				</span>
			),
		},
		{
			header: "Jam Pulang",
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
								durasi={
									stats.attendanceToday?.clockOut
										? calculateDuration(
												formatTime(stats.attendanceToday?.clockIn),
												formatTime(stats.attendanceToday?.clockOut),
											)
										: "-"
								}
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

						<Modal
							isOpen={isEarlyLeaveModalOpen}
							onClose={() => setIsEarlyLeaveModalOpen(false)}
							title="Konfirmasi Pulang Cepat"
						>
							<div className="flex flex-col items-center w-full">
								<p className="text-center text-gray-500 mt-2 text-sm mb-4">
									Anda pulang sebelum jam 17:00. Durasi kerja anda akan tercatat
									kurang dari 8 jam.
									<br />
									Silakan isi alasan kepulangan anda.
								</p>

								<textarea
									className="w-full border border-gray-300 rounded-lg p-2 mb-4 text-sm focus:outline-none focus:border-brand text-black"
									placeholder="Alasan pulang cepat..."
									rows={3}
									value={earlyClockOutReason}
									onChange={(e) => setEarlyClockOutReason(e.target.value)}
								/>

								<Alert
									variant="question"
									title="Pulang Lebih Cepat?"
									buttonText="Ya, Pulang"
									cancelText="Batal"
									onConfirm={confirmEarlyClockOut}
									onCancel={() => setIsEarlyLeaveModalOpen(false)}
									shadow={false}
									className="border-0 p-0 w-full"
								/>
							</div>
						</Modal>
					</>
				)}
			</div>
		</Layout>
	);
}
