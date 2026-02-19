import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Layout, Card, Table, Badge, Modal, Alert } from "../lib/components";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { LOADING_DELAY } from "../lib/constants";

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

const formatDateIndo = (dateString) => {
	if (!dateString) return "-";
	const d = new Date(dateString);
	return d.toLocaleDateString("id-ID", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
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
	const [alert, setAlert] = useState(null);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const [userData, attendanceToday, attendanceHistory, leaves] =
					await Promise.all([
						api.getMe().catch(() => ({ leaveBalance: 0 })),
						api.getAttendanceToday().catch(() => null),
						api.getAttendanceHistory().catch(() => []),
						api.getLeaves().catch(() => []),
						new Promise((resolve) => setTimeout(resolve, LOADING_DELAY)),
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
		if (!startTime || !endTime || startTime === "-" || endTime === "-")
			return "-";

		try {
			const [startHour, startMinute] = startTime.split(":").map(Number);
			const [endHour, endMinute] = endTime.split(":").map(Number);

			if (isNaN(startHour) || isNaN(endHour)) return "-";

			let durationHour = endHour - startHour;
			let durationMinute = endMinute - startMinute;

			if (durationMinute < 0) {
				durationHour -= 1;
				durationMinute += 60;
			}

			if (durationHour < 0) return "-";

			return `${durationHour} Jam ${durationMinute > 0 ? `${durationMinute} Menit` : ""}`;
		} catch (e) {
			return "-";
		}
	};

	const getHHMM = (date) => {
		return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
	};

	const handleClockIn = async () => {
		setAlert({ type: "loading" });
		try {
			await api.clockIn();

			const updatedToday = await api.getAttendanceToday();
			const updatedHistory = await api.getAttendanceHistory();
			setStats((prev) => ({
				...prev,
				attendanceToday: updatedToday,
				attendanceHistory: updatedHistory,
			}));
			setAlert({
				type: "success",
				message: "Clock In berhasil!",
			});
			setTimeout(() => setAlert(null), 2000);
		} catch (error) {
			setAlert({
				type: "error",
				message: error.message || "Gagal melakukan clock in",
			});
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

	const getBadgeVariant = (status) => {
		const s = status?.toLowerCase() || "";
		if (s === "approved" || s === "approve") return "approve";
		if (s === "rejected" || s === "reject") return "reject";
		if (s === "blocked" || s === "blokir") return "blokir";
		return "pending";
	};

	const executeClockOut = async (time, reason) => {
		try {
			setClockOutStep("loading");
			await api.clockOut(reason);

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
			setAlert({
				type: "error",
				message: error.message || "Gagal melakukan clock out",
			});
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
		const isEarlyOut = item.clockOut && item.clockOut < "17:00";

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
			isEarlyOut,
		};
	});

	const cutiData = stats.leaves.map((item, index) => ({
		no: index + 1,
		dateRange: `${formatDateIndo(item.startDate)} - ${formatDateIndo(item.endDate)}`,
		reason: item.reason,
		hrNote: item.notes || item.hrNote || "-",
		approver: item.approver || "-",
		status: item.status,
	}));

	// --- Columns Definition ---

	const absensiColumns = [
		{ header: "No", accessor: "no", className: "w-16" },
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
			render: (row) => (
				<span className={row.isEarlyOut ? "text-danger" : "text-info"}>
					{row.clockOut}
				</span>
			),
		},
	];

	const cutiColumns = [
		{ header: "No", accessor: "no", className: "w-16" },
		{ header: "Tanggal cuti", accessor: "dateRange" },
		{
			header: "Alasan cuti",
			accessor: "reason",
			className: "min-w-[200px] max-w-[300px]",
			render: (row) => (
				<div className="text-left line-clamp-2" title={row.reason}>
					{row.reason}
				</div>
			),
		},
		{ header: "Catatan HR", accessor: "hrNote" },
		{ header: "User approve", accessor: "approver" },
		{
			header: "Status cuti",
			accessor: "status",
			render: (row) => (
				<div className="flex justify-center">
					<Badge variant={getBadgeVariant(row.status)}>{row.status}</Badge>
				</div>
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
			<div className="p-6 space-y-8 min-h-screen">
				{loading && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
						<Alert
							variant="loading"
							title="Memuat Dashboard..."
							shadow={true}
						/>
					</div>
				)}

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
							<h2 className="text-xl font-bold text-brand-900">Riwayat Cuti</h2>
						</div>
						<Table columns={cutiColumns} data={cutiData} />
					</div>

					{/* Clock Out Step 1: Konfirmasi pulang cepat */}
					<Modal
						isOpen={clockOutStep === "confirm"}
						onClose={resetClockOutFlow}
						hideCloseButton={true}
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
			</div>

			{/* Alert Overlay */}
			{alert &&
				createPortal(
					<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
						<Alert
							variant={alert.type}
							message={alert.message}
							onClose={() => setAlert(null)}
							{...alert} // Pass extra props (like loading variant behavior)
						/>
					</div>,
					document.body,
				)}
		</Layout>
	);
}
