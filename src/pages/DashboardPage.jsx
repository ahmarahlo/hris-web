import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
	Layout,
	Card,
	Table,
	Badge,
	Modal,
	Alert,
	AlertBanner,
	StatsCard,
	LocationVerification,
	FaceVerification,
} from "../lib/components";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { useLoading } from "../lib/LoadingContext";
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
	if (!timeString || timeString === "-") return "-";
	try {
		if (timeString.includes("T") || timeString.includes("-")) {
			const date = new Date(timeString);
			if (isNaN(date.getTime())) return "-";
			return date
				.toLocaleTimeString("id-ID", {
					hour: "2-digit",
					minute: "2-digit",
					hour12: false,
				})
				.replace(":", ".");
		}
		const parts = timeString.split(":");
		if (parts.length >= 2) {
			return `${parts[0].padStart(2, "0")}.${parts[1].padStart(2, "0")}`;
		}
		return timeString.replace(":", ".");
	} catch {
		return "-";
	}
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
	const { showLoading, hideLoading } = useLoading();

	// Clock Out flow: null | "confirm" | "reason" | "loading" | "success"
	const [clockOutStep, setClockOutStep] = useState(null);
	const [pendingClockOutTime, setPendingClockOutTime] = useState(null);
	const [earlyClockOutReason, setEarlyClockOutReason] = useState("");
	const [alert, setAlert] = useState(null);
	const [showLocationVerification, setShowLocationVerification] =
		useState(false);
	const [showFaceVerification, setShowFaceVerification] = useState(false);
	const [pendingAttendanceAction, setPendingAttendanceAction] = useState(null); // 'clockIn' | 'clockOut'
	const [pendingCoords, setPendingCoords] = useState(null);

	useEffect(() => {
		const fetchData = async () => {
			showLoading("Memuat Dashboard...");
			try {
				const [userData, attendanceToday, attendanceHistory, leaves] =
					await Promise.all([
						api.getMe().catch(() => ({ leaveBalance: 0 })),
						api.getAttendanceToday().catch(() => null),
						api.getAttendanceHistory().catch(() => []),
						api.getLeaves().catch(() => []),
						new Promise((resolve) => setTimeout(resolve, LOADING_DELAY)),
					]);

				const totalDays = leaves.reduce((acc, curr) => {
					if (!curr.start_date || !curr.end_date) return acc;
					if (curr.status === "rejected") return acc;
					const s = new Date(curr.start_date);
					const e = new Date(curr.end_date);
					const diff = Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1;
					return acc + diff;
				}, 0);

				setStats({
					attendanceToday,
					leaves,
					attendanceHistory,
					leaveBalance: userData.leaveBalance,
					totalLeaves: totalDays,
				});
			} catch (error) {
				console.error("Error fetching dashboard data:", error);
			} finally {
				hideLoading();
			}
		};

		fetchData();
	}, [user]);

	const calculateDuration = (startTime, endTime) => {
		if (!startTime || !endTime || startTime === "-" || endTime === "-")
			return "-";

		try {
			const [startHour, startMinute] = startTime.split(".").map(Number);
			const [endHour, endMinute] = endTime.split(".").map(Number);

			if (
				isNaN(startHour) ||
				isNaN(endHour) ||
				isNaN(startMinute) ||
				isNaN(endMinute)
			)
				return "-";

			let durationHour = endHour - startHour;
			let durationMinute = endMinute - startMinute;

			if (durationMinute < 0) {
				durationHour -= 1;
				durationMinute += 60;
			}

			if (durationHour < 0) return "-";

			return `${durationHour} Jam${durationMinute > 0 ? ` ${durationMinute} Menit` : ""}`;
		} catch (e) {
			return "-";
		}
	};

	const getHHMM = (date) => {
		return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
	};

	const handleClockIn = () => {
		setPendingAttendanceAction("clockIn");
		setShowLocationVerification(true);
	};

	const executeClockIn = async (photo = null) => {
		setAlert({ type: "loading" });
		try {
			if (pendingCoords) {
				console.log("Checking location before clock in:", pendingCoords);
				await api.checkLocation(pendingCoords.lat, pendingCoords.lng);
			} else {
				console.warn("No pending coords for location check!");
			}
			await api.clockIn(photo);

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
			console.error("Error clocking in:", error);
			setAlert({
				type: "error",
				message: error.message || "Gagal melakukan clock in",
			});
		} finally {
			setPendingCoords(null);
		}
	};

	// --- Clock Out Flow ---

	const handleClockOut = () => {
		setPendingAttendanceAction("clockOut");
		setClockOutStep("initial_confirm");
	};

	const prepareClockOut = () => {
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

	const handleVerificationSuccess = (coords) => {
		console.log("Verified at location:", coords);
		setPendingCoords({ lat: coords[0], lng: coords[1] });
		setShowLocationVerification(false);
		if (pendingAttendanceAction === "clockIn") {
			setShowFaceVerification(true);
		}
	};

	const handleFaceSuccess = async (photo) => {
		setShowFaceVerification(false);
		if (pendingAttendanceAction === "clockIn") {
			await executeClockIn(photo);
		}
		setPendingAttendanceAction(null);
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
		const clockInTime = formatTime(item.clockIn);
		const clockOutTime = formatTime(item.clockOut);

		// Thresholds: In after 08:10 is late, Out before 17:00 is early
		let isLate = false;
		if (clockInTime !== "-") {
			const [h, m] = clockInTime.split(".").map(Number);
			if (h > 8 || (h === 8 && m > 10)) isLate = true;
		}

		let isEarlyOut = false;
		if (clockOutTime !== "-" && clockOutTime !== "00.00") {
			const [h, m] = clockOutTime.split(".").map(Number);
			if (h < 17) isEarlyOut = true;
		}

		return {
			no: index + 1,
			tanggal: formatDateIndo(item.date),
			durasi: item.clockOut
				? calculateDuration(item.clockIn, item.clockOut)
				: "-",
			clockIn: clockInTime,
			clockOut: clockOutTime,
			isLate,
			isEarlyOut,
			note:
				item.note ||
				item.notes ||
				item.reason ||
				item.early_clock_out_reason ||
				item.alasan ||
				item.keterangan ||
				"",
			_raw: item,
		};
	});

	const cutiData = stats.leaves
		.filter((l) => l.status !== "pending")
		.map((item, index) => ({
			no: index + 1,
			dateRange: `${formatDateIndo(item.startDate)} - ${formatDateIndo(item.endDate)}`,
			reason: item.reason,
			hrNote:
				item.notes || item.hrNote || item.hr_note || item.admin_note || "-",
			approver:
				item.approver ||
				item.approved_by ||
				item.admin_name ||
				item.reviewer ||
				item.approvedBy ||
				"-",
			status: item.status,
		}));

	// --- Columns Definition ---

	const absensiColumns = useMemo(
		() => [
			{ header: "No", accessor: "no", className: "w-16" },
			{ header: "Tanggal", accessor: "tanggal" },
			{ header: "Durasi kerja", accessor: "durasi" },
			{
				header: "Jam Masuk",
				accessor: "clockIn",
				render: (row) => (
					<span className={`${row.isLate ? "text-danger font-medium" : ""}`}>
						{row.clockIn}
					</span>
				),
			},
			{
				header: "Jam Pulang",
				accessor: "clockOut",
				render: (row) => (
					<span
						className={`${row.isEarlyOut ? "text-danger font-medium" : ""}`}
					>
						{row.clockOut}
					</span>
				),
			},
			{
				header: "Alasan",
				accessor: "note",
				className: "min-w-[150px] max-w-[250px] break-words text-left",
				render: (row) => {
					let finalNote = row.note;
					// For debugging empty early clock out notes
					if (!finalNote && row.isEarlyOut) {
						finalNote = `Debug Data: ${JSON.stringify(row._raw)}`;
					}
					return (
						<span
							className={
								finalNote ? "text-danger italic text-xs" : "text-gray-400"
							}
						>
							{finalNote || "-"}
						</span>
					);
				},
			},
		],
		[],
	);

	const cutiColumns = useMemo(
		() => [
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
		],
		[],
	);

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
		<Layout activeMenu="Beranda" title="Dashboard">
			<div className="lg:p-8 p-4 space-y-8 min-h-screen">
				<AlertBanner variant="info" message="Selamat datang kembali!" />

				<>
					{/* Cards */}
					<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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

					{/* Location Verification Overlay */}
					{showLocationVerification &&
						createPortal(
							<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60  p-4">
								<LocationVerification
									onVerify={handleVerificationSuccess}
									onCancel={() => {
										setShowLocationVerification(false);
										setPendingAttendanceAction(null);
									}}
								/>
							</div>,
							document.body,
						)}

					{/* Face Verification Overlay */}
					{showFaceVerification &&
						createPortal(
							<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60  p-4">
								<FaceVerification
									onVerify={handleFaceSuccess}
									onCancel={() => {
										setShowFaceVerification(false);
										setPendingAttendanceAction(null);
									}}
								/>
							</div>,
							document.body,
						)}

					{/* Clock Out Step 0: Konfirmasi awal */}
					{clockOutStep === "initial_confirm" &&
						createPortal(
							<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
								<Alert
									variant="question"
									title="Ingin Clock out"
									buttonText="Lanjut"
									cancelText="Batal"
									onConfirm={prepareClockOut}
									onCancel={resetClockOutFlow}
								/>
							</div>,
							document.body,
						)}

					{/* Clock Out Step 1: Konfirmasi pulang cepat */}
					{clockOutStep === "confirm" &&
						createPortal(
							<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
								<Alert
									variant="question"
									title=""
									message="Belum masuk jam pulang, ingin lanjut Clock out?"
									buttonText="Lanjut"
									cancelText="Batal"
									onConfirm={handleConfirmEarly}
									onCancel={resetClockOutFlow}
								/>
							</div>,
							document.body,
						)}

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
								placeholder="Masukkan Alasan"
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
					{clockOutStep === "loading" &&
						createPortal(
							<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
								<Alert
									variant="loading"
									title="Mohon Menunggu..."
									hideButtons
								/>
							</div>,
							document.body,
						)}

					{/* Clock Out Step 4: Success */}
					{clockOutStep === "success" &&
						createPortal(
							<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
								<Alert variant="success" title="Berhasil!" hideButtons />
							</div>,
							document.body,
						)}
				</>
			</div>

			{/* Alert Overlay */}
			{alert &&
				createPortal(
					<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4">
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
