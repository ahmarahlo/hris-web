import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
	Layout,
	Table,
	Badge,
	StatsCard,
	Alert,
	Modal,
	Button,
	AlertBanner,
} from "../../lib/components";
import {
	FunnelIcon,
	XCircleIcon,
	CheckIcon,
} from "@heroicons/react/24/outline";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import { useLoading } from "../../lib/LoadingContext";
import { LOADING_DELAY } from "../../lib/constants";

export default function ManajemenCutiPage() {
	const { user } = useAuth();
	const { showLoading, hideLoading } = useLoading();
	const [stats, setStats] = useState([]);
	const [leaveData, setLeaveData] = useState([]);
	const [alert, setAlert] = useState(null);
	const [processingId, setProcessingId] = useState(null);
	const [processModal, setProcessModal] = useState({
		isOpen: false,
		id: null,
		status: null,
		name: "",
	});
	const [adminNote, setAdminNote] = useState("");
	const [confirmAction, setConfirmAction] = useState(null);

	const [params, setParams] = useState({
		page: 1,
		limit: 5,
		search: "",
		status: "",
		start_date: "",
		end_date: "",
	});
	const [debouncedSearch, setDebouncedSearch] = useState(params.search);
	const [totalCount, setTotalCount] = useState(0);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(params.search);
		}, 500);
		return () => clearTimeout(timer);
	}, [params.search]);

	useEffect(() => {
		fetchData(true);
	}, [debouncedSearch]);

	useEffect(() => {
		let ignore = false;
		const load = async () => {
			if (ignore) return;
			await fetchData(false);
		};
		load();
		return () => {
			ignore = true;
		};
	}, [
		params.page,
		params.limit,
		params.status,
		params.start_date,
		params.end_date,
	]);

	const fetchData = async (isSearch = false) => {
		if (!isSearch) showLoading("Memuat Data Cuti...");
		try {
			const minDelay = new Promise((resolve) =>
				setTimeout(resolve, LOADING_DELAY),
			);

			// Full Hybrid: Pull 500 items raw so client can do perfect filtering
			const apiParams = {
				...params,
				limit: 500,
				search: "",
			};

			const [leaveStats, response] = await Promise.all([
				api.getDashboardLeaveStats(),
				api.getDashboardLeaves(apiParams),
				minDelay,
			]);

			const leaves = response.data || [];
			const total = response.total ?? leaves.length;

			setTotalCount(total);

			// Map stats
			const statsArr = [];
			if (leaveStats.total_requests != null) {
				statsArr.push({
					title: "Total Pengajuan",
					value: String(leaveStats.total_requests),
					variant: "info",
				});
			}
			if (leaveStats.pending_requests != null) {
				statsArr.push({
					title: "Menunggu Persetujuan",
					value: String(leaveStats.pending_requests),
					variant: "info",
				});
			}
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
			const mapped = leaves.map((item, i) => {
				const currentUserId = user?.id || user?.user_id || user?.employee_id;
				const currentUserName = user?.name || user?.full_name;
				const itemId =
					item.employee_id ||
					item.user_id ||
					item.id_user ||
					item.id_employee ||
					item.userId ||
					item.employeeId ||
					"";
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
					no: (params.page - 1) * params.limit + (i + 1),
					name: itemName,
					isSelf: isSelfId || isSelfName,
					date: formatDateRange(item.start_date, item.end_date),
					reason: item.reason || "-",
					hrNote:
						item.hr_note ||
						item.note ||
						item.admin_note ||
						item.rejection_note ||
						"",
					status: item.status || "pending",
					approver:
						item.approver ||
						item.approved_by ||
						item.admin_name ||
						item.reviewer ||
						item.approvedBy ||
						"-",
					employee_id: itemId,
					duration: calculateDuration(item.start_date, item.end_date),
					start_date: item.start_date,
					end_date: item.end_date,
					requesterRole:
						item.role || item.user_role || item.employee_role || "",
					isRequesterSuperAdmin:
						String(item.role || "")
							.toLowerCase()
							.includes("superadmin") ||
						String(itemName).toLowerCase().includes("super admin"),
				};
			});
			console.log("[ManajemenCuti] Mapped leaves:", mapped);
			// Sort: push isSelf requests to the bottom
			const sorted = [...mapped].sort((a, b) => {
				if (a.isSelf && !b.isSelf) return 1;
				if (!a.isSelf && b.isSelf) return -1;
				return 0;
			});
			setLeaveData(sorted.map((item, i) => ({ ...item, no: i + 1 })));
		} catch (error) {
			console.error("Error fetching leave management data:", error);
		} finally {
			hideLoading();
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

	const calculateDuration = (start, end) => {
		if (!start || !end) return "-";
		try {
			const s = new Date(start);
			const e = new Date(end);
			const diffTime = Math.abs(e - s);
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
			return `${diffDays} Hari`;
		} catch {
			return "-";
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
				status: status,
				name: row.name,
			});
			setAdminNote("");
		}
	};

	const confirmDirectProcess = async (id, status, note = "") => {
		setConfirmAction(null);
		setProcessingId(id);
		showLoading("Memproses...");
		try {
			await api.processLeave(id, {
				note: note,
				status: status,
			});
			await fetchData(true);
			hideLoading();
			setAlert({
				type: "success",
				message: `Cuti berhasil di-${status === "approved" ? "approve" : "reject"}`,
			});
		} catch (error) {
			hideLoading();
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

	const submitProcessLeave = async () => {
		const { id, status, name } = processModal;
		if (!id) return;

		setConfirmAction({
			id,
			status,
			note: adminNote,
			title: "Tolak Pengajuan Cuti?",
			message: `Apakah anda yakin ingin menolak pengajuan cuti dari ${name || "karyawan"}?`,
			btnConfirmVariant: "info",
			btnCancelVariant: "danger",
		});
		setProcessModal((prev) => ({ ...prev, isOpen: false }));
	};

	const columns = useMemo(
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
				header: "Durasi",
				accessor: "duration",
				className: "w-24 text-center",
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
				className: "min-w-[180px] max-w-[250px] break-words text-left",
				render: (row) => (
					<div
						className={`text-sm ${row.status === "rejected" ? "text-danger-600 font-medium" : "text-gray-600"}`}
					>
						{row.hrNote || "-"}
					</div>
				),
			},
			{
				header: "Status",
				accessor: "status",
				filterType: "select",
				filterOptions: [
					{ label: "Semua Status", value: "" },
					{ label: "Pending", value: "pending" },
					{ label: "Approved", value: "approved" },
					{ label: "Rejected", value: "rejected" },
				],
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
					// Only pending requests can be processed
					if (row.status !== "pending") return null;

					const isSuperAdmin =
						String(user?.role || "")
							.toLowerCase()
							.replace(/\s/g, "") === "superadmin";

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

					// Case 3: Regular processable row
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
		],
		[user, processingId],
	);

	const handleParamsChange = (newParams) => {
		setParams((prev) => {
			// Only update if actually changed to avoid cycles
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
				search: newParams.search,
			};
		});
	};

	const handleFilterChange = (key, value) => {
		setParams((prev) => ({
			...prev,
			[key]: value,
			page: 1,
		}));
	};

	const handleMultiFilterChange = (updates) => {
		setParams((prev) => ({
			...prev,
			...updates,
			page: 1,
		}));
	};

	return (
		<Layout activeMenu="Manajemen cuti" title="Manajemen cuti">
			<div className="lg:p-8 p-4 space-y-8 w-full">
				{/* Alert */}
				{alert &&
					createPortal(
						<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4">
							<Alert
								variant={alert.type}
								message={alert.message}
								onClose={() => setAlert(null)}
								showCloseIcon={alert.type !== "success"}
							/>
						</div>,
						document.body,
					)}

				{/* Confirmation Modal */}
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

				{/* Process Modal */}
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
								onClick={submitProcessLeave}
								disabled={!adminNote.trim() || adminNote.length > 50}
							>
								Kirim
							</button>
						</div>
					</div>
				</Modal>

				{/* Stats Cards */}

				<AlertBanner
					variant="info"
					message="Data pengajuan cuti user dalam 1 bulan terakhir"
				/>

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
							manual={false} // Full Hybrid: instant client-side filtering
							totalCount={leaveData.length}
							pageSize={5}
							search={params.search}
							onFilterChange={(accessor, value) => {
								if (accessor === "status") {
									handleFilterChange("status", value);
								}
							}}
						/>
					</div>
				</div>
			</div>
		</Layout>
	);
}
