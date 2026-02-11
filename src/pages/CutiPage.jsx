import React, { useState, useEffect } from "react";
import { Layout, Table, Badge, Button, Input } from "../lib/components";
import { api } from "../lib/api";

const formatDate = (dateString) => {
	if (!dateString) return "-";
	const date = new Date(dateString);
	return date.toLocaleDateString("id-ID", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
};

export default function CutiPage() {
	const [leaves, setLeaves] = useState([]);
	const [loading, setLoading] = useState(true);
	const [formData, setFormData] = useState({
		startDate: "",
		endDate: "",
		reason: "",
	});
	const [submitting, setSubmitting] = useState(false);

	const fetchLeaves = async () => {
		try {
			const data = await api.getLeaves();
			setLeaves(data);
		} catch (error) {
			console.error("Failed to fetch leaves", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLeaves();
	}, []);

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSubmitting(true);
		try {
			await api.createLeave(formData);
			alert("Pengajuan cuti berhasil dikirim!");
			setFormData({ startDate: "", endDate: "", reason: "" });
			fetchLeaves(); // Refresh list
		} catch (error) {
			alert(error.message);
		} finally {
			setSubmitting(false);
		}
	};

	const columns = [
		{ header: "No", accessor: "no" },
		{ header: "Mulai", accessor: "startDate" },
		{ header: "Selesai", accessor: "endDate" },
		{ header: "Alasan", accessor: "reason" },
		{
			header: "Status",
			accessor: "status",
			render: (r) => (
				<Badge variant={r.status}>
					{r.status === "approved"
						? "Approved"
						: r.status === "rejected"
							? "Rejected"
							: "Pending"}
				</Badge>
			),
		},
	];

	const data = leaves.map((item, index) => ({
		no: index + 1,
		startDate: formatDate(item.startDate),
		endDate: formatDate(item.endDate),
		reason: item.reason,
		status: item.status,
	}));

	return (
		<Layout activeMenu="Pengajuan Cuti" title="Manajemen Cuti">
			<div className="p-6 space-y-8">
				{/* Form Pengajuan */}
				<div className="bg-white rounded-lg shadow p-6">
					<h2 className="text-xl font-bold text-gray-800 mb-4">
						Ajukan Cuti Baru
					</h2>
					<form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Tanggal Mulai
								</label>
								<Input
									type="date"
									name="startDate"
									value={formData.startDate}
									onChange={handleChange}
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Tanggal Selesai
								</label>
								<Input
									type="date"
									name="endDate"
									value={formData.endDate}
									onChange={handleChange}
									required
								/>
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Alasan Cuti
							</label>
							<textarea
								name="reason"
								value={formData.reason}
								onChange={handleChange}
								className="w-full border border-gray-300 rounded-lg p-2 focus:ring-brand focus:border-brand outline-none"
								rows="3"
								required
							/>
						</div>
						<Button type="submit" variant="primary" disabled={submitting}>
							{submitting ? "Mengirim..." : "Ajukan Cuti"}
						</Button>
					</form>
				</div>

				{/* Tabel Riwayat */}
				<div className="bg-white rounded-lg shadow p-6">
					<h2 className="text-xl font-bold text-gray-800 mb-6">
						Riwayat Pengajuan Cuti
					</h2>
					{loading ? (
						<div>Loading...</div>
					) : (
						<Table columns={columns} data={data} />
					)}
				</div>
			</div>
		</Layout>
	);
}
