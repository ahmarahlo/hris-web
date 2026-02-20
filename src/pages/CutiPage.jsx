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
	const [errors, setErrors] = useState({});

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
	const calculateDuration = (start, end) => {
		if (!start || !end) return 0;
		const s = new Date(start);
		const e = new Date(end);
		const diffTime = Math.abs(e - s);
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
		return diffDays;
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

			// Hapus error saat input berubah
			if (errors[field]) {
				setErrors((e) => ({ ...e, [field]: "" }));
			}

			return updated;
		});
	};

	const handleSubmit = async () => {
		const newErrors = {};
		if (!formData.startDate) newErrors.startDate = "Tanggal mulai wajib diisi";
		if (!formData.endDate) newErrors.endDate = "Tanggal selesai wajib diisi";
		if (!formData.reason.trim()) newErrors.reason = "Alasan cuti wajib diisi";

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		if (new Date(formData.startDate) > new Date(formData.endDate)) {
			setErrors({
				endDate: "Tanggal selesai tidak boleh sebelum tanggal mulai",
			});
			return;
		}

		const duration = calculateDuration(formData.startDate, formData.endDate);
		if (duration > leaveBalance) {
			setSubmitError(
				`Durasi cuti (${duration} hari) melebihi sisa cuti tersedia!`,
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
		{
			header: "Catatan HR",
			accessor: "hrNote",
			render: (row) => (
				<div
					className={`text-sm ${row.status === "rejected" ? "text-danger-600 font-medium" : "text-gray-600"}`}
				>
					{row.hrNote || "-"}
				</div>
			),
		},
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
		{
			header: "Durasi",
			accessor: "duration",
			render: (row) => (
				<span className="font-medium text-gray-700">{row.duration} Hari</span>
			),
		},
	];

	const pendingLeaves = leaveHistory
		.filter((l) => l.status === "pending")
		.map((item, index) => ({
			...item,
			no: index + 1,
			hrNote:
				item.hr_note ||
				item.note ||
				item.admin_note ||
				item.rejection_note ||
				"-",
			approver:
				item.approved_by_name || item.approved_by || item.approver || "-",
			duration: calculateDuration(
				item.startDate || item.start_date,
				item.endDate || item.end_date,
			),
		}));

	const approvedOrRejected = leaveHistory
		.filter((l) => l.status !== "pending")
		.map((item, index) => ({
			...item,
			no: index + 1,
			hrNote:
				item.hr_note ||
				item.note ||
				item.admin_note ||
				item.rejection_note ||
				"-",
			approver:
				item.approved_by_name || item.approved_by || item.approver || "-",
			duration: calculateDuration(
				item.startDate || item.start_date,
				item.endDate || item.end_date,
			),
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
							<div className="space-y-1">
								<DateInput
									value={formData.startDate}
									onChange={(d) => handleDateSelect("startDate", d)}
									placeholder="dd/mm/yyyy"
									minDate={new Date()}
									hasError={!!errors.startDate}
								/>
								{errors.startDate && (
									<p className="text-xs text-danger font-medium">
										{errors.startDate}
									</p>
								)}
							</div>
						</div>

						{/* Tanggal Selesai */}
						<div className="grid grid-cols-[150px_1fr] items-center gap-4">
							<label className="text-gray-600 font-medium">
								Tanggal selesai <span className="float-right">:</span>
							</label>
							<div className="space-y-1">
								<DateInput
									value={formData.endDate}
									onChange={(d) => handleDateSelect("endDate", d)}
									placeholder="dd/mm/yyyy"
									minDate={formData.startDate || new Date()}
									disabled={!formData.startDate}
									hasError={!!errors.endDate}
								/>
								{errors.endDate && (
									<p className="text-xs text-danger font-medium">
										{errors.endDate}
									</p>
								)}
							</div>
						</div>

						{/* Alasan Cuti */}
						<div className="grid grid-cols-[150px_1fr] items-start gap-4">
							<label className="text-gray-600 font-medium mt-2">
								Alasan cuti <span className="float-right">:</span>
							</label>
							<div className="w-full space-y-1">
								<textarea
									placeholder="Input text"
									value={formData.reason}
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											reason: e.target.value,
										}));
										if (errors.reason)
											setErrors((err) => ({ ...err, reason: "" }));
									}}
									maxLength={50}
									className={`w-full border rounded-lg px-4 py-2 h-24 resize-none focus:outline-none bg-white text-black ${
										errors.reason
											? "border-danger focus:border-danger-700"
											: formData.reason.length >= 50
												? "border-danger focus:border-danger-700"
												: "border-gray-300 focus:border-brand"
									}`}
								/>
								<div className="flex justify-between items-start">
									<div className="flex-1">
										{errors.reason && (
											<p className="text-xs text-danger font-medium">
												{errors.reason}
											</p>
										)}
									</div>
									<p
										className={`text-xs mt-1 ${
											formData.reason.length >= 50
												? "text-danger font-semibold"
												: "text-gray-400"
										}`}
									>
										{formData.reason.length}/50 Karakter
									</p>
								</div>
							</div>
						</div>

						{/* Total Hari Indicator */}
						{formData.startDate && formData.endDate && (
							<div className="grid grid-cols-[150px_1fr] items-center gap-4 animate-in fade-in slide-in-from-top-1">
								<div></div>
								<div className="bg-brand-50 border border-brand-100 rounded-lg px-4 py-2 flex items-center justify-between">
									<span className="text-sm text-brand-700 font-medium">
										Total durasi pengajuan:
									</span>
									<span className="text-sm font-bold text-brand-900 bg-white px-3 py-1 rounded-md shadow-sm">
										{calculateDuration(formData.startDate, formData.endDate)}{" "}
										Hari
									</span>
								</div>
							</div>
						)}

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
								disabled={loading}
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
