import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
	Layout,
	StatsCard,
	Table,
	Badge,
	Alert,
	Modal,
	Card,
	LocationVerification,
	FaceVerification,
	ResetPasswordModal,
} from "../../lib/components";
import { FunnelIcon } from "@heroicons/react/24/solid";
import { XCircleIcon, CheckIcon } from "@heroicons/react/24/outline";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import { useLoading } from "../../lib/LoadingContext";
import { LOADING_DELAY, DEPARTMENTS } from "../../lib/constants";

export default function AdminDashboardPage() {
	const { user } = useAuth();
	const navigate = useNavigate();

	// Management States
	const [stats, setStats] = useState([]);
	const [pendingLeaveData, setPendingLeaveData] = useState([]);
	const [employeeAttendanceToday, setEmployeeAttendanceToday] = useState([]);
	const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
	const [employeeAttendanceCount, setEmployeeAttendanceCount] = useState(0);

	const [pendingLeaveParams, setPendingLeaveParams] = useState({
		page: 1,
		limit: 5,
		search: "",
		start_date: "",
		end_date: "",
	});
	const [employeeAttendanceParams, setEmployeeAttendanceParams] = useState({
		page: 1,
		limit: 5,
		search: "",
		department: "",
		start_date: "",
		end_date: "",
	});
	const [debouncedPendingSearch, setDebouncedPendingSearch] = useState("");
	const [debouncedAttendanceSearch, setDebouncedAttendanceSearch] =
		useState("");

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedPendingSearch(pendingLeaveParams.search.trim());
		}, 500);
		return () => clearTimeout(timer);
	}, [pendingLeaveParams.search]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedAttendanceSearch(employeeAttendanceParams.search.trim());
		}, 500);
		return () => clearTimeout(timer);
	}, [employeeAttendanceParams.search]);

	// Personal States
	const [personalStats, setPersonalStats] = useState({
		attendanceToday: null,
		attendanceHistory: [],
		leaveBalance: 0,
		totalLeaves: 0,
	});

	// UI States
	const { showLoading, hideLoading } = useLoading();
	const [alert, setAlert] = useState(null);
	const [processingId, setProcessingId] = useState(null);

	// Clock Out flow states
	const [clockOutStep, setClockOutStep] = useState(null);
	const [pendingClockOutTime, setPendingClockOutTime] = useState(null);
	const [earlyClockOutReason, setEarlyClockOutReason] = useState("");
	const [showLocationVerification, setShowLocationVerification] =
		useState(false);
	const [showFaceVerification, setShowFaceVerification] = useState(false);
	const [confirmAction, setConfirmAction] = useState(null);
	const [pendingAttendanceAction, setPendingAttendanceAction] = useState(null); // 'clockIn' | 'clockOut'
	const [pendingCoords, setPendingCoords] = useState(null);
	const [showNewUserPrompt, setShowNewUserPrompt] = useState(false);
	const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);

	const [processModal, setProcessModal] = useState({
		isOpen: false,
		id: null,
		status: null,
		name: "",
	});
	const [adminNote, setAdminNote] = useState("");

	useEffect(() => {
		fetchInitialData();
	}, []);

	useEffect(() => {
		fetchPendingLeaves();
	}, [
		pendingLeaveParams.page,
		pendingLeaveParams.limit,
		pendingLeaveParams.start_date,
		pendingLeaveParams.end_date,
		debouncedPendingSearch,
	]);

	useEffect(() => {
		fetchEmployeeAttendance();
	}, [
		employeeAttendanceParams.page,
		employeeAttendanceParams.limit,
		employeeAttendanceParams.department,
		employeeAttendanceParams.start_date,
		employeeAttendanceParams.end_date,
		debouncedAttendanceSearch,
	]);

	const fetchInitialData = async (silent = false) => {
		if (!silent) showLoading("Memuat Dashboard Admin...");
		try {
			const minDelay = new Promise((resolve) =>
				setTimeout(resolve, LOADING_DELAY),
			);

			const [
				dashStats,
				userData,
				personalToday,
				personalHistory,
				personalLeaves,
			] = await Promise.all([
				api.getDashboardStats().catch(() => ({})),
				api.getMe().catch(() => ({ leaveBalance: 0 })),
				api.getAttendanceToday().catch(() => null),
				api.getAttendanceHistory().catch(() => []),
				api.getLeaves().catch(() => []),
				silent ? Promise.resolve() : minDelay,
			]);

			// Management Stats Mapping
			setStats([
				{
					title: "Total karyawan",
					value: String(
						dashStats.total_employees ??
							dashStats.totalEmployees ??
							dashStats.total_user ??
							dashStats.totalUsers ??
							dashStats.employee_count ??
							dashStats.count ??
							0,
					),
					variant: "info",
				},
				{
					title: "Jumlah cuti pending",
					value: String(
						dashStats.pending_leaves ??
							dashStats.total_pending_leaves ??
							dashStats.pendingLeaves ??
							0,
					),
					variant: "info",
				},
				{
					title: "Karyawan masuk hari ini",
					value: String(
						dashStats.employees_present_today ??
							dashStats.present_today ??
							dashStats.presentToday ??
							0,
					),
					variant: "success",
				},
				{
					title: "Karyawan tidak masuk hari ini",
					value: String(
						dashStats.employees_absent_today ??
							dashStats.absent_today ??
							dashStats.absentToday ??
							0,
					),
					variant: "danger",
				},
			]);

			const totalPersonalLeaveDays = personalLeaves.reduce((acc, curr) => {
				if (!curr.start_date || !curr.end_date) return acc;
				if (curr.status === "rejected") return acc;
				const s = new Date(curr.start_date);
				const e = new Date(curr.end_date);
				const diff = Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1;
				return acc + diff;
			}, 0);

			// Personal Mapping
			setPersonalStats({
				attendanceToday: personalToday,
				attendanceHistory: personalHistory,
				leaveBalance: userData.leaveBalance,
				totalLeaves: totalPersonalLeaveDays,
			});

			// Check for New User alert using fresh data from getMe
			console.log("[AdminDashboard] Fresh userData:", userData);
			if (userData?.isNewUser) {
				const dismissed = localStorage.getItem(
					`dismissed_new_user_prompt_${userData?.id || user?.id}`,
				);
				console.log("[AdminDashboard] Alert dismissed status:", dismissed);
				if (!dismissed) {
					setShowNewUserPrompt(true);
				}
			}
		} catch (error) {
			console.error("Error fetching initial admin data:", error);
		} finally {
			if (!silent) hideLoading();
		}
	};

	const fetchPendingLeaves = async () => {
		try {
			// API search is broken for names. We pull 100 raw items instead.
			const response = await api
				.getDashboardPendingLeaves({
					...pendingLeaveParams,
					limit: debouncedPendingSearch ? 100 : pendingLeaveParams.limit,
					search: "",
				})
				.catch(() => ({ data: [], total: 0 }));
			const raw = response.data || [];
			setPendingLeaveCount(response.total ?? raw.length);
			const currentUserId = user?.id || user?.user_id || user?.employee_id;
			const currentUserName = user?.name || user?.full_name;

			setPendingLeaveData(
				raw.map((item, i) => {
					const itemId =
						item.employee_id ||
						item.user_id ||
						item.id_user ||
						item.id_employee ||
						item.userId ||
						item.employeeId ||
						null;
					const itemName =
						item.full_name || item.employee_name || item.name || "-";

					const isSelfId =
						itemId && currentUserId && String(itemId) === String(currentUserId);
					const isSelfName =
						itemName &&
						currentUserName &&
						itemName.trim().toLowerCase() ===
							currentUserName.trim().toLowerCase();

					return {
						id: item.id,
						no:
							(pendingLeaveParams.page - 1) * pendingLeaveParams.limit +
							(i + 1),
						name: itemName,
						isSelf: isSelfId || isSelfName,
						date: formatDateRange(item.start_date, item.end_date),
						reason: item.reason || "-",
						hrNote: item.hr_note || item.note || "",
						approver:
							item.approver ||
							item.approved_by ||
							item.admin_name ||
							item.reviewer ||
							item.approvedBy ||
							"-",
						employee_id: itemId,
						requesterRole:
							item.role || item.user_role || item.employee_role || "",
						status: item.status || "pending",
						isRequesterSuperAdmin:
							String(item.role || "")
								.toLowerCase()
								.includes("superadmin") ||
							String(itemName).toLowerCase().includes("super admin"),
					};
				}),
			);
			// Sort: push isSelf requests to the bottom
			setPendingLeaveData((prev) => {
				const sorted = [...prev].sort((a, b) => {
					if (a.isSelf && !b.isSelf) return 1;
					if (!a.isSelf && b.isSelf) return -1;
					return 0;
				});
				return sorted.map((item, i) => ({ ...item, no: i + 1 }));
			});
		} catch (e) {
			console.error("Error fetching pending leaves:", e);
		}
	};

	const fetchEmployeeAttendance = async () => {
		try {
			const response = await api
				.getDashboardAttendanceToday({
					...employeeAttendanceParams,
					limit: debouncedAttendanceSearch
						? 100
						: employeeAttendanceParams.limit,
					search: "",
				})
				.catch(() => ({ data: [], total: 0 }));
			const raw = response.data || [];
			setEmployeeAttendanceCount(response.total ?? raw.length);
			setEmployeeAttendanceToday(
				raw.map((item, i) => {
					const clockInTime = item.clock_in || item.clockIn;
					const clockOutTime = item.clock_out || item.clockOut;
					const ftClockIn = formatTime(clockInTime);
					const ftClockOut = formatTime(clockOutTime);

					return {
						no:
							(employeeAttendanceParams.page - 1) *
								employeeAttendanceParams.limit +
							(i + 1),
						name: item.full_name || item.employee_name || item.name || "-",
						nip: item.nik || item.nip || "-",
						date: formatDate(item.date || item.created_at),
						division: item.department || item.division || "-",
						clockIn: ftClockIn,
						clockOut: ftClockOut,
						isLate: isLateArrival(ftClockIn),
						isEarlyOut: isEarlyLeave(ftClockOut),
					};
				}),
			);
		} catch (e) {
			console.error("Error fetching employee attendance:", e);
		}
	};

	// --- Handlers ---

	const handlePendingLeaveParamsChange = (newParams) => {
		setPendingLeaveParams((prev) => {
			if (
				prev.page === newParams.page &&
				prev.limit === newParams.pageSize &&
				prev.search === newParams.search
			)
				return prev;
			return {
				...prev,
				page: newParams.page,
				limit: newParams.pageSize,
				search: newParams.search ?? "",
			};
		});
	};

	const handlePendingLeaveFilterChange = (key, value) => {
		setPendingLeaveParams((prev) => ({
			...prev,
			[key]: value,
			page: 1,
		}));
	};

	const handlePendingLeaveMultiFilterChange = (updates) => {
		setPendingLeaveParams((prev) => ({
			...prev,
			...updates,
			page: 1,
		}));
	};

	const handleEmployeeAttendanceParamsChange = (newParams) => {
		setEmployeeAttendanceParams((prev) => {
			if (
				prev.page === newParams.page &&
				prev.limit === newParams.pageSize &&
				prev.search === newParams.search
			)
				return prev;
			return {
				...prev,
				page: newParams.page,
				limit: newParams.pageSize,
				search: newParams.search ?? "",
			};
		});
	};

	const handleEmployeeAttendanceFilterChange = (key, value) => {
		setEmployeeAttendanceParams((prev) => ({
			...prev,
			[key]: value,
			page: 1,
		}));
	};

	const handleEmployeeAttendanceMultiFilterChange = (updates) => {
		setEmployeeAttendanceParams((prev) => ({
			...prev,
			...updates,
			page: 1,
		}));
	};

	// --- Helper Functions ---

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
		} catch {
			return "-";
		}
	};

	const getHHMM = (date) => {
		return `${date.getHours().toString().padStart(2, "0")}.${date.getMinutes().toString().padStart(2, "0")}`;
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

	const formatDateRange = (start, end) => {
		if (!start) return "-";
		const s = formatDate(start);
		const e = formatDate(end);
		return s === e ? s : `${s} - ${e}`;
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
			const parts = timeStr.split(":");
			if (parts.length >= 2) {
				return `${parts[0].padStart(2, "0")}.${parts[1].padStart(2, "0")}`;
			}
			return timeStr.replace(":", ".");
		} catch {
			return "-";
		}
	};

	// --- Actions ---

	const handleClockIn = () => {
		setPendingAttendanceAction("clockIn");
		setShowLocationVerification(true);
	};

	const executeClockIn = async (photo = null) => {
		setAlert({ type: "loading" });
		try {
			// 1. Cek lokasi dulu ke backend
			if (pendingCoords) {
				await api.checkLocation(pendingCoords.lat, pendingCoords.lng);
			}
			// 2. Clock in dengan foto
			await api.clockIn(photo);
			fetchInitialData();
			setAlert({ type: "success", message: "Clock In berhasil!" });
			setTimeout(() => setAlert(null), 2000);
		} catch (error) {
			setAlert({
				type: "error",
				message: error.message || "Gagal melakukan clock in",
			});
		} finally {
			setPendingCoords(null);
		}
	};

	const handleClockOut = () => {
		setPendingAttendanceAction("clockOut");
		setClockOutStep("initial_confirm");
	};

	const prepareClockOut = () => {
		const now = new Date();
		const time = getHHMM(now);
		setPendingClockOutTime(time);
		const [hour] = time.split(".").map(Number);

		if (hour < 17) {
			setClockOutStep("confirm");
		} else {
			executeClockOut(time, null);
		}
	};

	const handleVerificationSuccess = useCallback(
		(coords) => {
			console.log("Verified at location:", coords);
			// coords is an array [lat, lng] from LocationVerification
			setPendingCoords({ lat: coords[0], lng: coords[1] });
			setShowLocationVerification(false);

			if (pendingAttendanceAction === "clockIn") {
				// Clock in: lanjut ke face verification
				setShowFaceVerification(true);
			}
		},
		[pendingAttendanceAction],
	);

	const handleLocationCancel = useCallback(() => {
		setShowLocationVerification(false);
		setPendingAttendanceAction(null);
	}, []);

	const handleFaceVerificationSuccess = useCallback(
		(imageData) => {
			console.log("Face verified, image captured");
			setShowFaceVerification(false);
			if (pendingAttendanceAction === "clockIn") {
				executeClockIn(imageData);
			}
			setPendingAttendanceAction(null);
		},
		[pendingAttendanceAction, executeClockIn],
	);

	const handleFaceCancel = useCallback(() => {
		setShowFaceVerification(false);
		setPendingAttendanceAction(null);
	}, []);

	const executeClockOut = async (time, reason) => {
		try {
			setClockOutStep("loading");
			await api.clockOut(reason);
			fetchInitialData();
			setClockOutStep("success");
			setTimeout(() => setClockOutStep(null), 2000);
		} catch (error) {
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

	const confirmDirectProcess = async (id, status, note) => {
		setProcessingId(id);
		setConfirmAction(null);
		showLoading("Memproses Cuti...");
		try {
			await api.processLeave(id, { note: note || "", status: status });
			await Promise.all([fetchInitialData(true), fetchPendingLeaves()]);
			hideLoading();
			setAlert({
				type: "success",
				message: `Cuti berhasil di-${status === "approved" ? "setujui" : "tolak"}`,
			});
		} catch (error) {
			hideLoading();
			setAlert({ type: "error", message: `Gagal: ${error.message}` });
		} finally {
			setProcessingId(null);
			setTimeout(() => setAlert(null), 3000);
		}
	};

	const handleProcessLeave = (row, status) => {
		if (status === "approved") {
			setConfirmAction({
				id: row.id,
				status: "approved",
				title: "Terima Pengajuan Cuti?",
				message: `Apakah anda yakin ingin menyetujui pengajuan cuti dari ${row.name}?`,
				btnConfirmVariant: "info",
				btnCancelVariant: "danger",
			});
		} else {
			setProcessModal({
				isOpen: true,
				id: row.id,
				status: "rejected",
				name: row.name || "-",
			});
			setAdminNote("");
		}
	};

	const isEarlyLeave = (formattedTime) => {
		if (!formattedTime || formattedTime === "-" || formattedTime === "00.00")
			return false;
		try {
			const [hour, min] = formattedTime.split(".").map(Number);
			return hour < 17;
		} catch {
			return false;
		}
	};

	const isLateArrival = (formattedTime) => {
		if (!formattedTime || formattedTime === "-") return false;
		try {
			// Threshold is 08.10
			const [hour, min] = formattedTime.split(".").map(Number);
			if (hour > 8) return true;
			if (hour === 8 && min > 10) return true;
			return false;
		} catch {
			return false;
		}
	};

	// --- Columns ---

	const personalAbsensiColumns = useMemo(
		() => [
			{ header: "No", accessor: "no", className: "w-16" },
			{
				header: "Tanggal",
				accessor: "date",
				filterType: "date",
			},
			{ header: "Durasi kerja", accessor: "duration" },
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
				render: (row) => (
					<span
						className={
							row.note ? "text-danger italic text-xs" : "text-gray-400"
						}
					>
						{row.note || "-"}
					</span>
				),
			},
		],
		[],
	);

	const pendingLeaveColumns = useMemo(
		() => [
			{ header: "No", accessor: "no", className: "w-16" },
			{ header: "Nama karyawan", accessor: "name" },
			{
				header: "Tanggal cuti",
				accessor: "date",
				filterType: "date",
				isRange: true,
			},
			{
				header: "Alasan",
				accessor: "reason",
				className: "min-w-[200px] max-w-[300px] break-words text-left",
				render: (row) => (
					<div className="line-clamp-2" title={row.reason}>
						{row.reason}
					</div>
				),
			},
			{
				header: "Catatan HR",
				accessor: "hrNote",
				className: "min-w-[150px] max-w-[200px] break-words text-left",
			},
			{
				header: "Status",
				accessor: "status",
				render: (row) => {
					const status = row.status || "pending";
					const variant =
						status === "approved"
							? "approve"
							: status === "rejected"
								? "reject"
								: "pending";
					return (
						<Badge variant={variant}>
							{status.charAt(0).toUpperCase() + status.slice(1)}
						</Badge>
					);
				},
			},
			{
				header: "User approve",
				accessor: "approver",
				render: (row) => {
					const adminName = row.approver || "-";
					if (adminName === "-") return "-";

					return (
						<div className="flex flex-col text-center">
							<span className="text-xs text-gray-600 font-medium whitespace-nowrap">
								{adminName}
							</span>
						</div>
					);
				},
			},
			{
				header: "Action",
				accessor: "action",
				render: (row) => {
					if (row.status && row.status !== "pending") return null;

					const isSuperAdmin =
						String(user?.role).toLowerCase().replace(/\s/g, "") ===
						"superadmin";

					const isRequesterSuperAdmin = !!row.isRequesterSuperAdmin;

					// Case 1: My own request (Admin cannot approve self, Super Admin can)
					if (row.isSelf && !isSuperAdmin) {
						return (
							<div className="flex justify-center">
								<Badge variant="self">Self</Badge>
							</div>
						);
					}

					// Case 2: Request from a Super Admin (Regular Admin cannot approve)
					if (isRequesterSuperAdmin && !isSuperAdmin) {
						return (
							<div className="flex justify-center">
								<Badge variant="no-access">No Access</Badge>
							</div>
						);
					}

					return (
						<div className="flex gap-2 justify-center">
							<button
								className="p-1.5 rounded-lg text-white bg-danger hover:bg-danger-600 transition-all duration-200 active:scale-95 hover:shadow-md"
								disabled={processingId === row.id}
								onClick={() => handleProcessLeave(row, "rejected")}
								title="Tolak"
							>
								<XCircleIcon className="w-5 h-5 stroke-2" />
							</button>
							<button
								className="p-1.5 rounded-lg text-white bg-success hover:bg-success-700 transition-all duration-200 active:scale-95 hover:shadow-md"
								disabled={processingId === row.id}
								onClick={() => handleProcessLeave(row, "approved")}
								title="Setujui"
							>
								<CheckIcon className="w-5 h-5 stroke-2" />
							</button>
						</div>
					);
				},
			},
		],
		[user, processingId],
	);

	const employeeAttendanceColumns = useMemo(
		() => [
			{ header: "No", accessor: "no", className: "w-16" },
			{ header: "Nama karyawan", accessor: "name" },
			{ header: "NIP", accessor: "nip" },
			{
				header: "Tanggal",
				accessor: "date",
				filterType: "date",
			},
			{
				header: "Divisi",
				accessor: "division",
				filterType: "select",
				filterOptions: [
					{ label: "Semua Divisi", value: "" },
					...DEPARTMENTS.map((dept) => ({ label: dept, value: dept })),
				],
			},
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
				className: "min-w-[180px] max-w-[250px] break-words text-left",
				render: (row) => (
					<span
						className={
							row.note ? "text-danger italic text-xs" : "text-gray-400"
						}
					>
						{row.note || "-"}
					</span>
				),
			},
		],
		[],
	);

	// --- Formatting Logic ---

	const personalHistoryMapped = personalStats.attendanceHistory.map(
		(item, i) => {
			const clockInTime = formatTime(item.clockIn);
			const clockOutTime = formatTime(item.clockOut);

			return {
				no: i + 1,
				date: formatDate(item.date),
				start_date: item.date, // Added for client-side filtering
				clockIn: clockInTime,
				clockOut: clockOutTime,
				duration: calculateDuration(clockInTime, clockOutTime),
				note: item.note || item.early_clock_out_reason || "",
				isLate: isLateArrival(clockInTime),
				isEarlyOut: isEarlyLeave(clockOutTime),
			};
		},
	);

	let personalCardVariant = "absen_belum";
	if (personalStats.attendanceToday) {
		if (
			personalStats.attendanceToday.clockIn &&
			!personalStats.attendanceToday.clockOut
		) {
			personalCardVariant = "absen_sudah";
		} else if (
			personalStats.attendanceToday.clockIn &&
			personalStats.attendanceToday.clockOut
		) {
			personalCardVariant = "absen_lengkap";
		}
	}

	return (
		<Layout activeMenu="Beranda" title="Beranda">
			<div className="lg:p-8 p-4 space-y-8 w-full">
				{/* Standardized Global Loading / Alert Portal */}
				{alert &&
					createPortal(
						<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300 p-4">
							<Alert
								variant={alert.type}
								message={alert.message}
								onClose={() => setAlert(null)}
								showCloseIcon={false}
							/>
						</div>,
						document.body,
					)}

				<div className="space-y-8">
					{/* Management Stats row */}
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

					{/* Personal Section row */}
					<div className="flex gap-6 flex-col lg:flex-row">
						<Card
							variant={personalCardVariant}
							jamMasuk={formatTime(personalStats.attendanceToday?.clockIn)}
							jamPulang={formatTime(personalStats.attendanceToday?.clockOut)}
							durasi={
								personalStats.attendanceToday?.clockOut
									? calculateDuration(
											formatTime(personalStats.attendanceToday?.clockIn),
											formatTime(personalStats.attendanceToday?.clockOut),
										)
									: "-"
							}
							onAction={
								personalCardVariant === "absen_belum"
									? handleClockIn
									: handleClockOut
							}
							tanggal={new Date().toLocaleDateString("id-ID", {
								day: "numeric",
								month: "long",
								year: "numeric",
							})}
						/>
						<Card
							variant="cuti"
							totalCuti={personalStats.totalLeaves}
							sisaCuti={personalStats.leaveBalance}
							onAction={() => navigate("/cuti")}
						/>
					</div>

					{/* Triple Tables */}
					<div className="space-y-10 pt-4">
						{/* Table 1: Personal History */}
						<div className="space-y-4">
							<h3 className="text-gray-600 font-bold text-lg">
								Absensi anda bulan ini
							</h3>
							<Table
								columns={personalAbsensiColumns}
								data={personalHistoryMapped}
							/>
						</div>

						{/* Table 2: Management Pending Leaves */}
						<div className="space-y-4">
							<h3 className="text-gray-600 font-bold text-lg">
								Pengajuan cuti pending
							</h3>
							<Table
								columns={pendingLeaveColumns}
								data={pendingLeaveData}
								manual={false} // Hybrid: instant client filters
								totalCount={pendingLeaveData.length}
								pageSize={5}
								search={pendingLeaveParams.search}
								onFilterChange={(accessor, value) => {
									if (accessor === "status") {
										handlePendingLeaveFilterChange("status", value);
									}
									if (accessor === "date") {
										handlePendingLeaveFilterChange("start_date", value.start);
										handlePendingLeaveFilterChange("end_date", value.end);
									}
								}}
							/>
						</div>

						{/* Table 3: Management Attendance Today */}
						<div className="space-y-4">
							<h3 className="text-gray-600 font-bold text-lg">
								Absensi karyawan
							</h3>
							<Table
								columns={employeeAttendanceColumns}
								data={employeeAttendanceToday}
								manual={false} // Hybrid: instant client filters
								totalCount={employeeAttendanceToday.length}
								pageSize={5}
								search={employeeAttendanceParams.search}
								onFilterChange={(accessor, value) => {
									if (accessor === "division") {
										handleEmployeeAttendanceFilterChange("department", value);
									}
									if (accessor === "date") {
										// single date mapping
										handleEmployeeAttendanceFilterChange(
											"start_date",
											value.start,
										);
										handleEmployeeAttendanceFilterChange(
											"end_date",
											value.start,
										); // Because it's a single day query
									}
								}}
							/>
						</div>
					</div>
				</div>

				{/* Modals for Clock out reason, etc */}
				{/* Location Verification Overlay */}
				{showLocationVerification &&
					createPortal(
						<div className="fixed inset-0 z-100 bg-black/40 p-4">
							<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
								<LocationVerification
									onVerify={handleVerificationSuccess}
									onCancel={handleLocationCancel}
								/>
							</div>
						</div>,
						document.body,
					)}

				{/* Face Verification Overlay */}
				{showFaceVerification &&
					createPortal(
						<div className="fixed inset-0 z-100 bg-black/40 p-4">
							<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
								<FaceVerification
									onVerify={handleFaceVerificationSuccess}
									onCancel={handleFaceCancel}
								/>
							</div>
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
								onConfirm={() => setClockOutStep("reason")}
								onCancel={resetClockOutFlow}
							/>
						</div>,
						document.body,
					)}

				<Modal
					isOpen={clockOutStep === "reason"}
					onClose={resetClockOutFlow}
					title="Alasan pulang cepat"
				>
					<div className="space-y-4">
						<textarea
							className="w-full p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand text-black resize-none h-32"
							placeholder="Masukkan alasan anda..."
							maxLength={50}
							value={earlyClockOutReason}
							onChange={(e) => setEarlyClockOutReason(e.target.value)}
						/>
						<div className="flex justify-end text-xs text-gray-400">
							{earlyClockOutReason.length}/50 Karakter
						</div>
						<div className="flex gap-3">
							<button
								className="flex-1 py-2 rounded-lg bg-danger text-white font-bold"
								onClick={resetClockOutFlow}
							>
								Batal
							</button>
							<button
								className="flex-1 py-2 rounded-lg bg-info text-white font-bold disabled:opacity-50"
								disabled={!earlyClockOutReason.trim()}
								onClick={() =>
									executeClockOut(pendingClockOutTime, earlyClockOutReason)
								}
							>
								Kirim
							</button>
						</div>
					</div>
				</Modal>

				<Modal
					isOpen={processModal.isOpen}
					onClose={() =>
						setProcessModal((prev) => ({ ...prev, isOpen: false }))
					}
					title="Catatan penolakan"
				>
					<div className="space-y-4">
						<div className="space-y-1">
							<textarea
								className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all text-sm h-32 resize-none text-gray-600 bg-white"
								placeholder="Masukkan Alasan"
								value={adminNote}
								onChange={(e) => setAdminNote(e.target.value)}
								autoFocus
							/>
							<div className="flex justify-end">
								<span
									className={`text-[10px] sm:text-xs ${
										adminNote.length > 50 ? "text-danger" : "text-gray-500"
									}`}
								>
									{adminNote.length}/50 Karakter
								</span>
							</div>
						</div>

						<div className="flex justify-end gap-3 pt-2">
							<button
								className="px-8 py-2 rounded-lg font-medium bg-[#FF8A65] hover:bg-[#ff7b52] text-white transition-all duration-200 active:scale-95 shadow-sm"
								onClick={() =>
									setProcessModal((prev) => ({ ...prev, isOpen: false }))
								}
							>
								Batal
							</button>
							<button
								className={`px-8 py-2 rounded-lg font-medium transition-all duration-200 active:scale-95 shadow-sm ${
									adminNote.trim() && adminNote.length <= 50
										? "bg-info hover:bg-info-600 text-white"
										: "bg-gray-300 text-gray-100 cursor-not-allowed"
								}`}
								disabled={!adminNote.trim() || adminNote.length > 50}
								onClick={() => {
									const { id, status, name } = processModal;
									setProcessModal((prev) => ({ ...prev, isOpen: false }));
									setConfirmAction({
										id,
										status,
										note: adminNote,
										title: "Tolak Pengajuan Cuti?",
										message: `Apakah anda yakin ingin menolak pengajuan cuti dari ${name || "karyawan"}?`,
										btnConfirmVariant: "info",
										btnCancelVariant: "danger",
									});
								}}
							>
								Kirim
							</button>
						</div>
					</div>
				</Modal>

				{/* Confirmation Alert Overlay */}
				{confirmAction &&
					createPortal(
						<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 text-center">
							<Alert
								variant="question"
								title={confirmAction.title}
								message={confirmAction.message}
								buttonText="Iya"
								cancelText="Batal"
								onConfirm={() =>
									confirmDirectProcess(
										confirmAction.id,
										confirmAction.status,
										confirmAction.note || "",
									)
								}
								onCancel={() => setConfirmAction(null)}
								btnConfirmVariant={confirmAction.btnConfirmVariant}
								btnCancelVariant={confirmAction.btnCancelVariant}
							/>
						</div>,
						document.body,
					)}

				{/* Success Alert Portal */}
				{clockOutStep === "success" &&
					createPortal(
						<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4">
							<Alert variant="success" title="Berhasil!" hideButtons />
						</div>,
						document.body,
					)}

				{/* New User Password Change Prompt */}
				{showNewUserPrompt &&
					createPortal(
						<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 text-center">
							<Alert
								variant="question"
								title="Halo User Baru! 👋"
								message="Demi keamanan, sebaiknya ganti password default kamu sekarang. Mau ganti sekarang?"
								buttonText="Ya, Ganti"
								cancelText="Nanti Saja"
								onConfirm={() => {
									setShowNewUserPrompt(false);
									setIsResetPasswordOpen(true);
								}}
								onCancel={() => {
									setShowNewUserPrompt(false);
									localStorage.setItem(
										`dismissed_new_user_prompt_${user?.id}`,
										"true",
									);
								}}
								btnConfirmVariant="info"
								btnCancelVariant="danger"
							/>
						</div>,
						document.body,
					)}

				{/* Alert Overlay */}
				{alert &&
					createPortal(
						<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4">
							<Alert
								variant={alert.type}
								message={alert.message}
								onClose={() => setAlert(null)}
								showCloseIcon={alert.type !== "success"}
								{...alert}
							/>
						</div>,
						document.body,
					)}

				<ResetPasswordModal
					isOpen={isResetPasswordOpen}
					onClose={() => setIsResetPasswordOpen(false)}
					onSuccess={(msg) => setAlert({ type: "success", message: msg })}
				/>
			</div>
		</Layout>
	);
}
