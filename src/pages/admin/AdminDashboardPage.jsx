import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
	Layout,
	StatsCard,
	Table,
	Badge,
	Button,
	Alert,
} from "../../lib/components";
import { FunnelIcon } from "@heroicons/react/24/solid";
import { XCircleIcon, CheckIcon } from "@heroicons/react/24/outline";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";

export default function AdminDashboardPage() {
	const { user } = useAuth();
	const [stats, setStats] = useState([]);
	const [pendingLeaveData, setPendingLeaveData] = useState([]);
	const [attendanceData, setAttendanceData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [alert, setAlert] = useState(null);
	const [processingId, setProcessingId] = useState(null);

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		try {
			const [dashStats, pending, attendance] = await Promise.all([
				api.getDashboardStats(),
				api.getDashboardPendingLeaves(),
				api.getDashboardAttendanceToday(),
			]);

			setStats([
				{
					title: "Total karyawan",
					value: String(
						dashStats.total_employees ?? dashStats.totalEmployees ?? 0,
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

			console.log("[AdminDashboard] Raw pending leaves:", pending);
			// Map pending leaves
			const mappedPending = (Array.isArray(pending) ? pending : []).map(
				(item, i) => ({
					id: item.id || item.no,
					no: i + 1,
					name: item.full_name || item.employee_name || item.name || "-",
					date: formatDateRange(item.start_date, item.end_date),
					reason: item.reason || "-",
					hrNote: item.hr_note || item.note || "",
					approver:
						item.approved_by_name || item.approved_by || item.approver || "",
				}),
			);
			console.log("[AdminDashboard] Mapped pending leaves:", mappedPending);
			setPendingLeaveData(mappedPending);

			// Map attendance
			const mappedAttendance = (
				Array.isArray(attendance) ? attendance : []
			).map((item, i) => ({
				no: i + 1,
				name: item.full_name || item.employee_name || item.name || "-",
				nip: item.nik || item.nip || "-",
				date: formatDate(item.date || item.created_at),
				division: item.department || item.division || "-",
				clockIn: formatTime(item.clock_in || item.clockIn),
				clockOut: formatTime(item.clock_out || item.clockOut),
			}));
			setAttendanceData(mappedAttendance);
		} catch (error) {
			console.error("Error fetching admin dashboard:", error);
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

	const formatDateRange = (start, end) => {
		if (!start) return "-";
		const s = formatDate(start);
		const e = formatDate(end);
		return s === e ? s : `${s} - ${e}`;
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

	const handleProcessLeave = async (id, status) => {
		console.log("[AdminDashboard] Processing leave:", {
			id,
			status,
			userId: user?.id,
		});
		setProcessingId(id);
		try {
			await api.processLeave(id, {
				note: "",
				status: status,
			});
			setAlert({
				type: "success",
				message: `Cuti berhasil di-${status === "approved" ? "approve" : "reject"}`,
			});
			fetchData();
		} catch (error) {
			const errorMsg =
				error.response?.data?.message ||
				error.response?.data?.error ||
				error.message;
			setAlert({ type: "error", message: `Gagal: ${errorMsg}` });
		} finally {
			setProcessingId(null);
			setTimeout(() => setAlert(null), 3000);
		}
	};

	const isEarlyLeave = (timeStr) => {
		if (!timeStr || timeStr === "-") return false;
		const time = parseFloat(timeStr.replace(":", "."));
		return time < 17.0;
	};

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
			render: (row) => (
				<div className="flex gap-2 justify-center">
					<button
						className="p-1.5 rounded-lg bg-danger text-white hover:bg-danger-600 disabled:opacity-50 transition-all duration-200 active:scale-95 hover:shadow-md"
						disabled={processingId === row.id}
						onClick={() => handleProcessLeave(row.id, "rejected")}
						title="Tolak"
					>
						<XCircleIcon className="w-5 h-5 stroke-2" />
					</button>
					<button
						className="p-1.5 rounded-lg bg-success text-white hover:bg-success-700 disabled:opacity-50 transition-all duration-200 active:scale-95 hover:shadow-md"
						disabled={processingId === row.id}
						onClick={() => handleProcessLeave(row.id, "approved")}
						title="Setujui"
					>
						<CheckIcon className="w-5 h-5 stroke-2" />
					</button>
				</div>
			),
		},
	];

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

	return (
		<Layout activeMenu="Beranda" title="Beranda">
			<div className="p-8 space-y-8 w-full">
				{/* Alert */}
				{alert &&
					createPortal(
						<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
							<Alert
								variant={alert.type}
								title={alert.type === "success" ? "Berhasil" : "Gagal"}
								message={alert.message}
								onClose={() => setAlert(null)}
							/>
						</div>,
						document.body,
					)}

				{/* Stats Cards */}
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

				{/* Pending Cuti Table */}
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

				{/* Absensi Hari Ini Table */}
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
