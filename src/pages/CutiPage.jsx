import React, { useState, useEffect, useRef } from "react";
import { Layout, Table, Badge, Button, Input } from "../lib/components";
import { DatePicker } from "../lib/components/datepicker/DatePicker";
import { InputModal } from "../lib/components/modal/InputModal";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";

export default function CutiPage() {
	// --- STATE ---
	const [formData, setFormData] = useState({
		startDate: null,
		endDate: null,
		reason: "",
	});

	// Modals & Popups
	const [showStartPicker, setShowStartPicker] = useState(false);
	const [showEndPicker, setShowEndPicker] = useState(false);

	// Mock Data for Tables
	const pendingData = [
		{
			id: 1,
			startDate: "1 Jul - 5 Jul 2026",
			reason: "Keluar kota",
			hrNote: "",
			approver: "",
			status: "pending",
		},
	];

	const historyData = [
		{
			id: 1,
			startDate: "24 Jun - 26 Jun 2026",
			reason: "Sakit",
			hrNote: "",
			approver: "Admin01",
			status: "success",
		},
		{
			id: 2,
			startDate: "19 Mar - 25 Mar 2026",
			reason: "Sakit",
			hrNote: "Terlalu sering cuti",
			approver: "Admin01",
			status: "rejected",
		},
		{
			id: 3,
			startDate: "19 Feb - 20 Feb 2026",
			reason: "Sakit",
			hrNote: "Terlalu sering cuti",
			approver: "Admin01",
			status: "rejected",
		},
		{
			id: 4,
			startDate: "24 Jan - 27 Jan 2026",
			reason: "Sakit",
			hrNote: "",
			approver: "Admin01",
			status: "success",
		},
		{
			id: 5,
			startDate: "10 Jan - 13 Jan 2026",
			reason: "Sakit",
			hrNote: "",
			approver: "Admin01",
			status: "success",
		},
	];

	// --- HANDLERS ---
	const formatDate = (date) => {
		if (!date) return "";
		// Format: dd/mm/yyyy
		const d = new Date(date);
		const day = d.getDate().toString().padStart(2, "0");
		const month = (d.getMonth() + 1).toString().padStart(2, "0");
		const year = d.getFullYear();
		return `${day}/${month}/${year}`;
	};

	const handleDateSelect = (field, date) => {
		setFormData((prev) => ({ ...prev, [field]: date }));
		if (field === "startDate") setShowStartPicker(false);
		if (field === "endDate") setShowEndPicker(false);
	};

	// Close pickers when clicking outside (Simple implementation)
	// For now, relies on the "Tutup" button in DatePicker

	const columns = [
		{ header: "No", accessor: "no" },
		{ header: "Tanggal cuti", accessor: "startDate" },
		{ header: "Alasan cuti", accessor: "reason" },
		{ header: "Catatan HR", accessor: "hrNote" },
		{ header: "User approve", accessor: "approver" },
		{
			header: "Status cuti",
			accessor: "status",
			render: (row) => {
				let variant = "pending";
				let label = "Pending";
				if (row.status === "success" || row.status === "approved") {
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

	// Prepare data for Table component
	const prepareTableData = (rawData) =>
		rawData.map((item, index) => ({
			...item,
			no: index + 1,
		}));

	return (
		<Layout activeMenu="Pengajuan Cuti" title="Pengajuan cuti">
			<div className="p-8 space-y-8 max-w-5xl">
				{/* --- SECTION 1: FORM --- */}
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
										value={formatDate(formData.startDate)}
										className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-brand cursor-pointer bg-white text-black"
									/>
									<CalendarDaysIcon className="w-5 h-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
								</div>
								{/* Popup DatePicker */}
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
										value={formatDate(formData.endDate)}
										className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-brand cursor-pointer bg-white text-black"
									/>
									<CalendarDaysIcon className="w-5 h-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
								</div>
								{/* Popup DatePicker */}
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
									value="40"
									className="w-full bg-gray-200 border border-gray-300 rounded-lg px-4 py-2 text-gray-600 cursor-not-allowed"
								/>
							</div>
						</div>

						{/* Button Kirim */}
						<div className="flex justify-end pt-2">
							<Button variant="primary" className="px-8 bg-[#6B7FD7]">
								Kirim
							</Button>
						</div>
					</div>
				</div>

				{/* --- SECTION 2: PENDING TABLE --- */}
				<div>
					<h3 className="text-lg font-semibold text-gray-600 mb-4">
						Pengajuan cuti pending
					</h3>
					<div className="bg-white rounded-lg shadow overflow-hidden">
						<Table columns={columns} data={prepareTableData(pendingData)} />
					</div>
				</div>

				{/* --- SECTION 3: HISTORY TABLE --- */}
				<div>
					<div className="flex justify-between items-end mb-2">
						<h3 className="text-lg font-bold text-gray-700">Riwayat cuti</h3>
					</div>
					<div className="bg-white rounded-lg shadow overflow-hidden">
						<Table columns={columns} data={prepareTableData(historyData)} />
					</div>
				</div>
			</div>

			{/* --- MODALS --- */}
			{/* --- MODALS --- */}
			{/* InputModal removed as per request */}
		</Layout>
	);
}
