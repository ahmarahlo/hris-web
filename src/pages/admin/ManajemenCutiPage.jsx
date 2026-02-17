import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Layout, Table, Badge, StatsCard, Alert } from "../../lib/components";
import {
	FunnelIcon,
	XCircleIcon,
	CheckIcon,
} from "@heroicons/react/24/outline";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";

export default function ManajemenCutiPage() {
	const { user } = useAuth();
	const [stats, setStats] = useState([]);
	const [leaveData, setLeaveData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [alert, setAlert] = useState(null);
	const [processingId, setProcessingId] = useState(null);

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		try {
			const [leaveStats, leaves] = await Promise.all([
				api.getDashboardLeaveStats(),
				api.getDashboardLeaves(),
			]);

			// Map stats
			const statsArr = [];
			if (leaveStats.total_pending != null || leaveStats.totalPending != null) {
				statsArr.push({
					title: "Cuti pending",
					value: String(
						leaveStats.total_pending ?? leaveStats.totalPending ?? 0,
					),
					variant: "info",
				});
			}
			if (
				leaveStats.total_approved != null ||
				leaveStats.totalApproved != null
			) {
				statsArr.push({
					title: "Cuti disetujui",
					value: String(
						leaveStats.total_approved ?? leaveStats.totalApproved ?? 0,
					),
					variant: "success",
				});
			}
			if (
				leaveStats.total_rejected != null ||
				leaveStats.totalRejected != null
			) {
				statsArr.push({
					title: "Cuti ditolak",
					value: String(
						leaveStats.total_rejected ?? leaveStats.totalRejected ?? 0,
					),
					variant: "danger",
				});
			}
			// Fallback: tampilkan semua key numerik
			if (statsArr.length === 0 && typeof leaveStats === "object") {
				Object.entries(leaveStats).forEach(([key, value]) => {
					if (typeof value === "number") {
						statsArr.push({
							title: key.replace(/_/g, " "),
							value: String(value),
							variant: "info",
						});
					}
				});
			}
			setStats(statsArr);

			console.log("[ManajemenCuti] Raw leaves:", leaves);
			// Map leave data
			const mapped = (Array.isArray(leaves) ? leaves : []).map((item, i) => ({
				id: item.id,
				no: i + 1,
				name: item.full_name || item.employee_name || item.name || "-",
				date: formatDateRange(item.start_date, item.end_date),
				reason: item.reason || "-",
				hrNote: item.hr_note || item.note || "",
				status: item.status || "pending",
				approver:
					item.approved_by_name || item.approved_by || item.approver || "",
			}));
			console.log("[ManajemenCuti] Mapped leaves:", mapped);
			setLeaveData(mapped);
		} catch (error) {
			console.error("Error fetching leave management data:", error);
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

	const handleProcessLeave = async (id, status) => {
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

	const columns = [
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
			render: (row) => {
				const variant =
					row.status === "approved"
						? "approve"
						: row.status === "rejected"
							? "reject"
							: "pending";
				const label =
					row.status === "approved"
						? "Approve"
						: row.status === "rejected"
							? "Reject"
							: "Pending";
				return <Badge variant={variant}>{label}</Badge>;
			},
		},
		{ header: "User approve", accessor: "approver" },
		{
			header: "Action",
			accessor: "action",
			render: (row) => {
				if (row.status !== "pending") return null;
				return (
					<div className="flex gap-2 justify-center">
						<button
							className="p-1.5 rounded-lg bg-danger text-white hover:bg-danger-600 disabled:opacity-50 transition-all duration-200 active:scale-95 hover:shadow-md"
							disabled={processingId === row.id}
							onClick={() => handleProcessLeave(row.id, "rejected")}
							title="Tolak Cuti"
						>
							<XCircleIcon className="w-5 h-5 stroke-2" />
						</button>
						<button
							className="p-1.5 rounded-lg bg-success text-white hover:bg-success-700 disabled:opacity-50 transition-all duration-200 active:scale-95 hover:shadow-md"
							disabled={processingId === row.id}
							onClick={() => handleProcessLeave(row.id, "approved")}
							title="Setujui Cuti"
						>
							<CheckIcon className="w-5 h-5 stroke-2" />
						</button>
					</div>
				);
			},
		},
	];

	return (
		<Layout activeMenu="Manajemen cuti" title="Manajemen cuti">
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
				{stats.length > 0 && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
						{stats.map((stat, index) => (
							<StatsCard
								key={index}
								title={stat.title}
								value={stat.value}
								variant={stat.variant}
								className="w-full"
							/>
						))}
					</div>
				)}

				{/* Leave Table */}
				<div className="space-y-4">
					<div className="flex justify-start">
						<h3 className="text-gray-600 font-medium text-lg">
							Manajemen cuti karyawan
						</h3>
					</div>
					<div className="bg-white rounded-lg overflow-hidden">
						<Table columns={columns} data={leaveData} />
					</div>
				</div>
			</div>
		</Layout>
	);
}
