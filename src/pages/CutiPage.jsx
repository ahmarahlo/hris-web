import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Layout, Table, Badge, Button, Modal, Alert } from "../lib/components";
import { DateInput } from "../lib/components/datepicker/DateInput";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { api } from "../lib/api";
import { LOADING_DELAY } from "../lib/constants";

export default function CutiPage() {
	const [formData, setFormData] = useState({
		startDate: null,
		endDate: null,
		reason: "",
	});

	const [leaveHistory, setLeaveHistory] = useState([]);
	const [leaveBalance, setLeaveBalance] = useState(0);
	const [loading, setLoading] = useState(true);

	// Submit flow: null | "loading" | "success" | "error"
	const [submitStep, setSubmitStep] = useState(null);
	const [submitError, setSubmitError] = useState("");

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		setLoading(true);
		try {
			const minDelay = new Promise((resolve) =>
				setTimeout(resolve, LOADING_DELAY),
			);

			const [leaves, profile] = await Promise.all([
				api.getLeaves().catch(() => []),
				api.getMe().catch(() => ({ leaveBalance: 0 })),
				minDelay,
			]);
			setLeaveHistory(leaves);
			setLeaveBalance(profile.leaveBalance || profile.leave_balance || 0);
		} catch (error) {
			console.error("Error fetching cuti data:", error);
		} finally {
			setLoading(false);
		}
	};

	// --- Format Helpers ---

	const formatDateAPI = (date) => {
		if (!date) return "";
		const d = new Date(date);
		const year = d.getFullYear();
		const month = (d.getMonth() + 1).toString().padStart(2, "0");
		const day = d.getDate().toString().padStart(2, "0");
		return `${year}-${month}-${day}`;
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

	const checkOverlap = (start, end) => {
		const newStart = new Date(start);
		const newEnd = new Date(end);

		return leaveHistory.some((l) => {
			// Hanya cek pengajuan yang statusnya pending atau approved
			if (l.status === "rejected") return false;

			const existingStart = new Date(l.startDate);
			const existingEnd = new Date(l.endDate);

			// Logic overlap: (StartA <= EndB) and (EndA >= StartB)
			return newStart <= existingEnd && newEnd >= existingStart;
		});
	};

	// --- Handlers ---

	const handleDateSelect = (field, date) => {
		setFormData((prev) => {
			const updated = { ...prev, [field]: date };

			// Reset tanggal selesai jika tanggal mulai lebih besar
			if (
				field === "startDate" &&
				prev.endDate &&
				new Date(date) > new Date(prev.endDate)
			) {
				updated.endDate = null;
			}

			return updated;
		});
	};

	const handleSubmit = async () => {
		if (!formData.startDate || !formData.endDate || !formData.reason.trim()) {
			setSubmitError("Semua field wajib diisi!");
			setSubmitStep("error");
			return;
		}

		if (new Date(formData.startDate) > new Date(formData.endDate)) {
			setSubmitError(
				"Tanggal mulai tidak boleh lebih besar dari tanggal selesai!",
			);
			setSubmitStep("error");
			return;
		}

		if (leaveBalance <= 0) {
			setSubmitError("Sisa cuti anda sudah habis!");
			setSubmitStep("error");
			return;
		}

		if (checkOverlap(formData.startDate, formData.endDate)) {
			setSubmitError(
				"Anda sudah memiliki pengajuan cuti pada rentang tanggal tersebut!",
			);
			setSubmitStep("error");
			return;
		}

		setSubmitStep("loading");

		try {
			await api.createLeave({
				start_date: formatDateAPI(formData.startDate),
				end_date: formatDateAPI(formData.endDate),
				reason: formData.reason.trim(),
			});

			setSubmitStep("success");

			setTimeout(async () => {
				setSubmitStep(null);
				setFormData({ startDate: null, endDate: null, reason: "" });

				const [leaves, profile] = await Promise.all([
					api.getLeaves().catch(() => []),
					api.getMe().catch(() => ({ leaveBalance: 0 })),
				]);
				setLeaveHistory(leaves);
				setLeaveBalance(profile.leaveBalance || profile.leave_balance || 0);
			}, 2000);
		} catch (error) {
			console.error("Error creating leave:", error);
			setSubmitError(
				error.response?.data?.message ||
					error.message ||
					"Gagal mengajukan cuti",
			);
			setSubmitStep("error");
		}
	};

	// --- Table Config ---

	const columns = [
		{ header: "No", accessor: "no", className: "w-16" },
		{
			header: "Tanggal cuti",
			accessor: "dateRange",
			render: (row) => (
				<span>
					{formatDateIndo(row.startDate)} - {formatDateIndo(row.endDate)}
				</span>
			),
		},
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
			render: (row) => {
				let variant = "pending";
				let label = "Pending";
				if (row.status === "approved") {
					variant = "approve";
					label = "Approve";
				} else if (row.status === "rejected") {
					variant = "reject";
					label = "Reject";
				}
				return <Badge variant={variant}>{label}</Badge>;
			},
		},
	];

	const pendingLeaves = leaveHistory
		.filter((l) => l.status === "pending")
		.map((item, index) => ({
			...item,
			no: index + 1,
			hrNote: item.hr_note || item.note || "-",
			approver: item.approver || "-",
		}));

	const approvedOrRejected = leaveHistory
		.filter((l) => l.status !== "pending")
		.map((item, index) => ({
			...item,
			no: index + 1,
			hrNote: item.hr_note || item.note || "-",
			approver: item.approver || "-",
		}));

	return (
		<Layout activeMenu="Pengajuan Cuti" title="Pengajuan cuti">
			<div className="p-8 space-y-8 max-w-5xl w-full">
				{loading && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
						<Alert
							variant="loading"
							title="Memuat Data Cuti..."
							shadow={true}
						/>
					</div>
				)}

				{/* Form Pengajuan Cuti */}
				<div className="bg-white p-6 rounded-lg space-y-6">
					<h2 className="text-xl font-semibold text-gray-800 border-b border-gray-100 pb-4">
						Pengajuan cuti
					</h2>

					<div className="space-y-4 max-w-xl">
						{/* Tanggal Mulai */}
						<div className="grid grid-cols-[150px_1fr] items-center gap-4">
							<label className="text-gray-600 font-medium">
								Tanggal mulai <span className="float-right">:</span>
							</label>
							<DateInput
								value={formData.startDate}
								onChange={(d) => handleDateSelect("startDate", d)}
								placeholder="dd/mm/yyyy"
								minDate={new Date()}
							/>
						</div>

						{/* Tanggal Selesai */}
						<div className="grid grid-cols-[150px_1fr] items-center gap-4">
							<label className="text-gray-600 font-medium">
								Tanggal selesai <span className="float-right">:</span>
							</label>
							<DateInput
								value={formData.endDate}
								onChange={(d) => handleDateSelect("endDate", d)}
								placeholder="dd/mm/yyyy"
								minDate={formData.startDate || new Date()}
								disabled={!formData.startDate}
							/>
						</div>

						{/* Alasan Cuti */}
						<div className="grid grid-cols-[150px_1fr] items-start gap-4">
							<label className="text-gray-600 font-medium mt-2">
								Alasan cuti <span className="float-right">:</span>
							</label>
							<div className="w-full">
								<textarea
									placeholder="Input text"
									value={formData.reason}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, reason: e.target.value }))
									}
									maxLength={50}
									className={`w-full border rounded-lg px-4 py-2 h-24 resize-none focus:outline-none bg-white text-black ${
										formData.reason.length >= 50
											? "border-danger focus:border-danger-700"
											: "border-gray-300 focus:border-brand"
									}`}
								/>
								<p
									className={`text-xs text-right mt-1 ${
										formData.reason.length >= 50
											? "text-danger font-semibold"
											: "text-gray-400"
									}`}
								>
									{formData.reason.length}/50 Karakter
								</p>
							</div>
						</div>

						{/* Sisa Cuti */}
						<div className="grid grid-cols-[150px_1fr] items-center gap-4">
							<label className="text-gray-600 font-medium">
								Sisa cuti tersedia <span className="float-right">:</span>
							</label>
							<div>
								<input
									type="text"
									disabled
									value={loading ? "..." : leaveBalance}
									className="w-full bg-gray-200 border border-gray-300 rounded-lg px-4 py-2 text-gray-600 cursor-not-allowed"
								/>
							</div>
						</div>

						{/* Button Kirim */}
						<div className="flex justify-end pt-2">
							<Button
								variant="primary"
								className="px-8 bg-info"
								onClick={handleSubmit}
								disabled={
									!formData.startDate ||
									!formData.endDate ||
									!formData.reason.trim()
								}
							>
								Kirim
							</Button>
						</div>
					</div>
				</div>

				{/* Tabel Pending */}
				<div>
					<h3 className="text-lg font-semibold text-gray-600 mb-4">
						Pengajuan cuti pending
					</h3>
					<div className="bg-white rounded-lg overflow-hidden">
						{loading ? (
							<p className="p-4 text-gray-400 text-center">Memuat data...</p>
						) : (
							<Table columns={columns} data={pendingLeaves} />
						)}
					</div>
				</div>

				{/* Tabel Riwayat */}
				<div>
					<div className="flex justify-between items-end mb-2">
						<h3 className="text-lg font-bold text-gray-700">Riwayat cuti</h3>
					</div>
					<div className="bg-white rounded-lg overflow-hidden">
						{loading ? (
							<p className="p-4 text-gray-400 text-center">Memuat data...</p>
						) : (
							<Table columns={columns} data={approvedOrRejected} />
						)}
					</div>
				</div>
			</div>

			{submitStep === "loading" &&
				createPortal(
					<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
						<Alert
							variant="loading"
							title="Mohon Menunggu..."
							shadow={false}
							hideButtons
						/>
					</div>,
					document.body,
				)}

			{submitStep === "success" &&
				createPortal(
					<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
						<Alert
							variant="success"
							title="Pengajuan Cuti Berhasil!"
							shadow={false}
							hideButtons
							onClose={() => setSubmitStep(null)}
						/>
					</div>,
					document.body,
				)}

			{submitStep === "error" &&
				createPortal(
					<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
						<Alert
							variant="error"
							title={submitError || "Gagal mengajukan cuti"}
							shadow={false}
							onClose={() => setSubmitStep(null)}
						/>
					</div>,
					document.body,
				)}
		</Layout>
	);
}
