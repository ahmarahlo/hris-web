import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
	Layout,
	Table,
	Badge,
	StatsCard,
	Alert,
	Modal,
	Button,
} from "../../lib/components";
import {
	FunnelIcon,
	XCircleIcon,
	CheckIcon,
} from "@heroicons/react/24/outline";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import { LOADING_DELAY } from "../../lib/constants";

export default function ManajemenCutiPage() {
	const { user } = useAuth();
	const [stats, setStats] = useState([]);
	const [leaveData, setLeaveData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [alert, setAlert] = useState(null);
	const [processingId, setProcessingId] = useState(null);
	const [processModal, setProcessModal] = useState({
		isOpen: false,
		id: null,
		status: null,
		name: "",
	});
	const [adminNote, setAdminNote] = useState("");

	const [params, setParams] = useState({
		page: 1,
		limit: 5,
		search: "",
		status: "",
		start_date: "",
		end_date: "",
	});
	const [totalCount, setTotalCount] = useState(0);

	useEffect(() => {
		fetchData();
	}, [params]);

	const fetchData = async () => {
		setLoading(true);
		try {
			const apiParams = {
				page: params.page,
				limit: params.limit,
				search: params.search,
				status: params.status,
				start_date: params.start_date,
				end_date: params.end_date,
			};
			const minDelay = new Promise((resolve) =>
				setTimeout(resolve, LOADING_DELAY),
			);

			const [leaveStats, response] = await Promise.all([
				api.getDashboardLeaveStats(),
				api.getDashboardLeaves(apiParams),
				minDelay,
			]);

			const leaves = response.data || response || [];
			// Strict slice to handle backend ignoring limit param
			const effectiveLeaves = Array.isArray(leaves)
				? leaves.slice(0, params.limit)
				: [];
			const total = response.total ?? leaves.length;
			setTotalCount(total);

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
			// Map leave data
			const mapped = effectiveLeaves.map((item, i) => ({
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

	const handleProcessLeave = (row, status) => {
		setProcessModal({
			isOpen: true,
			id: row.id,
			status: status,
			name: row.name,
		});
		setAdminNote("");
	};

	const submitProcessLeave = async () => {
		const { id, status } = processModal;
		if (!id) return;

		setProcessingId(id);
		setProcessModal((prev) => ({ ...prev, isOpen: false })); // Close modal immediately to show loading on table or global

		// Optional: Show loading alert if preferred, or rely on processingId + Table disabled state
		setAlert({ type: "loading", title: "Memproses..." });

		try {
			await api.processLeave(id, {
				note: adminNote,
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
			// Reset modal state completely usually handled by close
		}
	};

	const columns = [
		{ header: "No", accessor: "no", className: "w-16" },
		{ header: "Nama karyawan", accessor: "name" },
		{
			header: "Tanggal cuti",
			accessor: "date",
			filterRender: () => (
				<div className="flex flex-col gap-2 p-1 min-w-[200px]">
					<span className="text-xs font-semibold text-gray-500">
						Filter Tanggal
					</span>
					<input
						type="date"
						className="w-full text-xs p-2 border border-gray-200 rounded focus:outline-none focus:border-brand text-black"
						value={params.start_date}
						onChange={(e) => handleFilterChange("start_date", e.target.value)}
					/>
					<span className="text-center text-xs text-gray-400">s/d</span>
					<input
						type="date"
						className="w-full text-xs p-2 border border-gray-200 rounded focus:outline-none focus:border-brand text-black"
						value={params.end_date}
						onChange={(e) => handleFilterChange("end_date", e.target.value)}
					/>
					<button
						className="mt-1 text-[10px] text-brand hover:underline text-right"
						onClick={() => {
							handleFilterChange("start_date", "");
							handleFilterChange("end_date", "");
						}}
					>
						Reset Tanggal
					</button>
				</div>
			),
		},
		{
			header: "Alasan",
			accessor: "reason",
			className: "min-w-[200px] max-w-[300px]",
			render: (row) => (
				<div className="text-left line-clamp-2" title={row.reason}>
					{row.reason}
				</div>
			),
		},
		{ header: "Catatan HR", accessor: "hrNote" },
		{
			header: "Status",
			accessor: "status",
			filterOptions: [
				{ label: "Semua Status", value: "" },
				{ label: "Pending", value: "pending" },
				{ label: "Approved", value: "approved" },
				{ label: "Rejected", value: "rejected" },
			],
			onFilterSelect: (opt) => handleFilterChange("status", opt.value),
			render: (row) => {
				const variant =
					row.status === "approved"
						? "approve"
						: row.status === "rejected"
							? "reject"
							: "pending";
				const label =
					row.status === "approved"
						? "Approved"
						: row.status === "rejected"
							? "Rejected"
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
							onClick={() => handleProcessLeave(row, "rejected")}
							title="Tolak Cuti"
						>
							<XCircleIcon className="w-5 h-5 stroke-2" />
						</button>
						<button
							className="p-1.5 rounded-lg bg-success text-white hover:bg-success-700 disabled:opacity-50 transition-all duration-200 active:scale-95 hover:shadow-md"
							disabled={processingId === row.id}
							onClick={() => handleProcessLeave(row, "approved")}
							title="Setujui Cuti"
						>
							<CheckIcon className="w-5 h-5 stroke-2" />
						</button>
					</div>
				);
			},
		},
	];

	const handleParamsChange = (newParams) => {
		setParams((prev) => ({
			...prev,
			page: newParams.page,
			limit: newParams.pageSize,
			search: newParams.search || prev.search,
		}));
	};

	const handleFilterChange = (key, value) => {
		setParams((prev) => ({
			...prev,
			[key]: value,
			page: 1,
		}));
	};

	return (
		<Layout activeMenu="Manajemen cuti" title="Manajemen cuti">
			<div className="p-8 space-y-8 w-full">
				{/* Alert */}
				{alert &&
					createPortal(
						<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
							<Alert
								variant={alert.type}
								message={alert.message}
								onClose={() => setAlert(null)}
							/>
						</div>,
						document.body,
					)}

				{/* Process Modal */}
				<Modal
					isOpen={processModal.isOpen}
					onClose={() =>
						setProcessModal((prev) => ({ ...prev, isOpen: false }))
					}
					title={
						processModal.status === "approved"
							? "Setujui Pengajuan Cuti"
							: "Tolak Pengajuan Cuti"
					}
				>
					<div className="space-y-4">
						<p className="text-sm text-gray-600">
							Anda akan{" "}
							<span
								className={`font-bold ${
									processModal.status === "approved"
										? "text-success-600"
										: "text-danger-600"
								}`}
							>
								{processModal.status === "approved" ? "MENYETUJUI" : "MENOLAK"}
							</span>{" "}
							pengajuan cuti dari <strong>{processModal.name}</strong>.
						</p>

						<div className="space-y-1">
							<label className="text-sm font-medium text-gray-700">
								Catatan HR (Opsional)
							</label>
							<textarea
								className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand transition-all text-sm"
								rows={3}
								placeholder="Contoh: Disetujui, selamat berlibur!"
								value={adminNote}
								onChange={(e) => setAdminNote(e.target.value)}
							/>
						</div>

						<div className="flex justify-end gap-3 pt-2">
							<Button
								variant="outline"
								onClick={() =>
									setProcessModal((prev) => ({ ...prev, isOpen: false }))
								}
							>
								Batal
							</Button>
							<Button
								variant={
									processModal.status === "approved" ? "success" : "danger"
								}
								onClick={submitProcessLeave}
							>
								Konfirmasi
							</Button>
						</div>
					</div>
				</Modal>

				{/* Stats Cards */}
				{loading && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
						<Alert
							variant="loading"
							title="Memuat Data Cuti..."
							shadow={true}
						/>
					</div>
				)}

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
					<div className="flex justify-between items-center sm:flex-row flex-col gap-4">
						<h3 className="text-gray-600 font-medium text-lg">
							Manajemen cuti karyawan
						</h3>
					</div>
					<div className="bg-white rounded-lg overflow-hidden">
						<Table
							columns={columns}
							data={leaveData}
							manual={true}
							totalCount={totalCount}
							currentPage={params.page}
							pageSize={params.limit}
							search={params.search}
							onParamsChange={handleParamsChange}
						/>
					</div>
				</div>
			</div>
		</Layout>
	);
}
