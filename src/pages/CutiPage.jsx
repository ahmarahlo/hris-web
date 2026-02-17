import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Layout, Table, Badge, Button, Modal, Alert } from "../lib/components";
import { DatePicker } from "../lib/components/datepicker/DatePicker";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { api } from "../lib/api";

export default function CutiPage() {
	const [formData, setFormData] = useState({
		startDate: null,
		endDate: null,
		reason: "",
	});

	const [leaveHistory, setLeaveHistory] = useState([]);
	const [leaveBalance, setLeaveBalance] = useState(0);
	const [loading, setLoading] = useState(true);

	const [showStartPicker, setShowStartPicker] = useState(false);
	const [showEndPicker, setShowEndPicker] = useState(false);

	// Submit flow: null | "loading" | "success" | "error"
	const [submitStep, setSubmitStep] = useState(null);
	const [submitError, setSubmitError] = useState("");

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [leaves, profile] = await Promise.all([
					api.getLeaves().catch(() => []),
					api.getMe().catch(() => ({ leaveBalance: 0 })),
				]);
				setLeaveHistory(leaves);
				setLeaveBalance(profile.leaveBalance || profile.leave_balance || 0);
			} catch (error) {
				console.error("Error fetching cuti data:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	// --- Format Helpers ---

	const formatDateDisplay = (date) => {
		if (!date) return "";
		const d = new Date(date);
		const day = d.getDate().toString().padStart(2, "0");
		const month = (d.getMonth() + 1).toString().padStart(2, "0");
		const year = d.getFullYear();
		return `${day}/${month}/${year}`;
	};

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
		if (field === "startDate") setShowStartPicker(false);
		if (field === "endDate") setShowEndPicker(false);
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
		{ header: "No", accessor: "no" },
		{
			header: "Tanggal cuti",
			accessor: "dateRange",
			render: (row) => (
				<span>
					{formatDateIndo(row.startDate)} - {formatDateIndo(row.endDate)}
				</span>
			),
		},
		{ header: "Alasan cuti", accessor: "reason" },
		{ header: "Catatan HR", accessor: "hrNote" },
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
		}));

	const approvedOrRejected = leaveHistory
		.filter((l) => l.status !== "pending")
		.map((item, index) => ({
			...item,
			no: index + 1,
			hrNote: item.hr_note || item.note || "-",
		}));

	return (
		<Layout activeMenu="Pengajuan Cuti" title="Pengajuan cuti">
			<div className="p-8 space-y-8 max-w-5xl">
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
							<div className="relative">
								<div
									className="relative cursor-pointer"
									onClick={() => {
										setShowStartPicker(!showStartPicker);
										setShowEndPicker(false);
									}}
								>
									<input
										type="text"
										readOnly
										placeholder="dd/mm/yyyy"
										value={formatDateDisplay(formData.startDate)}
										className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-brand cursor-pointer bg-white text-black"
									/>
									<CalendarDaysIcon className="w-5 h-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
								</div>
								{showStartPicker && (
									<div className="absolute z-50 top-full mt-2 left-0 shadow-xl rounded-lg">
										<DatePicker
											value={formData.startDate}
											onChange={(d) => handleDateSelect("startDate", d)}
											onClose={() => setShowStartPicker(false)}
											minDate={new Date()}
										/>
									</div>
								)}
							</div>
						</div>

						{/* Tanggal Selesai */}
						<div className="grid grid-cols-[150px_1fr] items-center gap-4">
							<label className="text-gray-600 font-medium">
								Tanggal selesai <span className="float-right">:</span>
							</label>
							<div className="relative">
								<div
									className="relative cursor-pointer"
									onClick={() => {
										setShowEndPicker(!showEndPicker);
										setShowStartPicker(false);
									}}
								>
									<input
										type="text"
										readOnly
										placeholder="dd/mm/yyyy"
										value={formatDateDisplay(formData.endDate)}
										className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-brand cursor-pointer bg-white text-black"
									/>
									<CalendarDaysIcon className="w-5 h-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
								</div>
								{showEndPicker && (
									<div className="absolute z-50 top-full mt-2 left-0 shadow-xl rounded-lg">
										<DatePicker
											value={formData.endDate}
											onChange={(d) => handleDateSelect("endDate", d)}
											onClose={() => setShowEndPicker(false)}
											minDate={formData.startDate || new Date()}
										/>
									</div>
								)}
							</div>
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
									className="w-full border border-gray-300 rounded-lg px-4 py-2 h-24 resize-none focus:outline-none focus:border-brand bg-white text-black"
								/>
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
