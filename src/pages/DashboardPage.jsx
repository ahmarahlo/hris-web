import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Layout, Card, Table, Badge, Modal, Alert } from "../lib/components";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

// --- Helper: Format tanggal/waktu ---

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
	const navigate = useNavigate();
	const [stats, setStats] = useState({
		attendanceToday: null,
		leaves: [],
		attendanceHistory: [],
		leaveBalance: 0,
		totalLeaves: 0,
	});
	const [loading, setLoading] = useState(true);

	// Clock Out flow: null | "confirm" | "reason" | "loading" | "success"
	const [clockOutStep, setClockOutStep] = useState(null);
	const [pendingClockOutTime, setPendingClockOutTime] = useState(null);
	const [earlyClockOutReason, setEarlyClockOutReason] = useState("");
	const [errorAlert, setErrorAlert] = useState(null);

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

	const calculateDuration = (startTime, endTime) => {
		if (!startTime || !endTime) return "-";

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
			if (!customTime) return;

			await api.clockIn(customTime);

			const updatedToday = await api.getAttendanceToday();
			const updatedHistory = await api.getAttendanceHistory();
			setStats((prev) => ({
				...prev,
				attendanceToday: updatedToday,
				attendanceHistory: updatedHistory,
			}));
		} catch (error) {
			setErrorAlert(error.message || "Gagal melakukan clock in");
		}
	};

	// --- Clock Out Flow ---

	const handleClockOut = () => {
		const now = new Date();
		const time = getHHMM(now);
		setPendingClockOutTime(time);

		const [hour] = time.split(":").map(Number);

		if (hour < 17) {
			setClockOutStep("confirm");
		} else {
			executeClockOut(time, null);
		}
	};

	const handleConfirmEarly = () => {
		setClockOutStep("reason");
	};

	const handleSubmitReason = async () => {
		setClockOutStep("loading");
		await executeClockOut(pendingClockOutTime, earlyClockOutReason);
	};

	const executeClockOut = async (time, reason) => {
		try {
			setClockOutStep("loading");
			await api.clockOut(time, reason);

			const updatedToday = await api.getAttendanceToday();
			const updatedHistory = await api.getAttendanceHistory();
			setStats((prev) => ({
				...prev,
				attendanceToday: updatedToday,
				attendanceHistory: updatedHistory,
			}));

			setClockOutStep("success");
			setTimeout(() => resetClockOutFlow(), 2000);
		} catch (error) {
			console.error("Clock out error:", error);
			setClockOutStep(null);
			setErrorAlert(error.message || "Gagal melakukan clock out");
		}
	};

	const resetClockOutFlow = () => {
		setClockOutStep(null);
		setPendingClockOutTime(null);
		setEarlyClockOutReason("");
	};

	// --- Data Transformation for Tables ---

	const absensiData = stats.attendanceHistory.map((item, index) => {
		const isLate = item.clockIn > "08:00";

		return {
			no: index + 1,
			tanggal: formatDate(item.date),
			bulan: formatMonth(item.date),
			durasi: item.clockOut
				? calculateDuration(item.clockIn, item.clockOut)
				: "-",
			clockIn: formatTime(item.clockIn),
			clockOut: formatTime(item.clockOut),
			isLate,
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
						{/* Cards */}
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
								tanggal={new Date().toLocaleDateString("id-ID", {
									day: "numeric",
									month: "long",
									year: "numeric",
								})}
							/>
							<Card
								variant="cuti"
								totalCuti={stats.totalLeaves}
								sisaCuti={stats.leaveBalance}
								onAction={() => navigate("/cuti")}
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

						{/* Riwayat Cuti */}
						<div>
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-xl font-bold text-brand-900">
									Riwayat Cuti
								</h2>
							</div>
							<Table columns={cutiColumns} data={cutiData} />
						</div>

						{/* Clock Out Step 1: Konfirmasi pulang cepat */}
						<Modal
							isOpen={clockOutStep === "confirm"}
							onClose={resetClockOutFlow}
						>
							<Alert
								variant="question"
								title="Pulang Lebih Cepat?"
								buttonText="Ya, Pulang"
								cancelText="Batal"
								onConfirm={handleConfirmEarly}
								onCancel={resetClockOutFlow}
								shadow={false}
								className="border-0 p-0 w-full"
							/>
						</Modal>

						{/* Clock Out Step 2: Input alasan */}
						<Modal
							isOpen={clockOutStep === "reason"}
							onClose={resetClockOutFlow}
							title="Alasan pulang cepat"
						>
							<div className="flex flex-col w-full">
								<p className="text-xs text-gray-500 mb-2">
									<span className="text-danger">*</span> Wajib diisi
								</p>
								<textarea
									className={`w-full border rounded-lg p-3 mb-1 text-sm focus:outline-none text-black resize-none ${
										earlyClockOutReason.length >= 50
											? "border-danger focus:border-danger-700"
											: "border-gray-300 focus:border-brand"
									}`}
									placeholder="Text"
									rows={4}
									maxLength={50}
									value={earlyClockOutReason}
									onChange={(e) => setEarlyClockOutReason(e.target.value)}
								/>
								<p
									className={`text-xs text-right mb-4 ${
										earlyClockOutReason.length >= 50
											? "text-danger font-semibold"
											: "text-gray-400"
									}`}
								>
									{earlyClockOutReason.length}/50 Karakter
								</p>
								<div className="flex gap-3 w-full">
									<button
										onClick={resetClockOutFlow}
										className="flex-1 py-2 px-4 rounded-lg bg-danger text-white font-semibold hover:bg-danger-600 transition-colors"
									>
										Batal
									</button>
									<button
										onClick={handleSubmitReason}
										disabled={earlyClockOutReason.trim().length === 0}
										className={`flex-1 py-2 px-4 rounded-lg text-white font-semibold transition-colors ${
											earlyClockOutReason.trim().length === 0
												? "bg-disable-color cursor-not-allowed"
												: "bg-info hover:bg-info-650"
										}`}
									>
										Kirim
									</button>
								</div>
							</div>
						</Modal>

						{/* Clock Out Step 3: Loading */}
						<Modal isOpen={clockOutStep === "loading"} onClose={() => {}}>
							<Alert
								variant="loading"
								title="Mohon Menunggu..."
								shadow={false}
								hideButtons
								className="border-0 p-0 w-full"
							/>
						</Modal>

						{/* Clock Out Step 4: Success */}
						<Modal
							isOpen={clockOutStep === "success"}
							onClose={resetClockOutFlow}
						>
							<Alert
								variant="success"
								title="Berhasil!"
								shadow={false}
								hideButtons
								className="border-0 p-0 w-full"
							/>
						</Modal>
					</>
				)}
			</div>

			{/* Error Alert Overlay */}
			{errorAlert &&
				createPortal(
					<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
						<Alert
							variant="error"
							message={errorAlert}
							onClose={() => setErrorAlert(null)}
						/>
					</div>,
					document.body,
				)}
		</Layout>
	);
}
