import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { Layout, Table, Badge, Alert, Card } from "../../lib/components";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import { useLoading } from "../../lib/LoadingContext";
import { LOADING_DELAY, USER_ROLES } from "../../lib/constants";
import {
	ArrowLeftIcon,
	CalendarDaysIcon,
	BriefcaseIcon,
	EnvelopeIcon,
	PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { getAvatarUrl } from "../../lib/user";

export default function EditAkunPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { user: currentUser } = useAuth();
	const [employee, setEmployee] = useState(null);
	const [attendanceHistory, setAttendanceHistory] = useState([]);
	const { showLoading, hideLoading } = useLoading();
	const [isEditing, setIsEditing] = useState(false);

	const isSelf = String(currentUser?.id) === String(id);
	const isAdmin = currentUser?.role === USER_ROLES.ADMIN;
	const isSuperAdmin =
		String(currentUser?.role).toLowerCase().replace(/\s/g, "") === "superadmin";
	const isHR = currentUser?.role === USER_ROLES.HR;
	const isManagement = isAdmin || isSuperAdmin || isHR;
	const [formData, setFormData] = useState({
		full_name: "",
		email: "",
		nik: "",
		department: "",
		role: "",
		phone: "",
		annual_leave_quota: "",
		leave_balance: "",
	});
	const [alert, setAlert] = useState(null);

	useEffect(() => {
		fetchData();
	}, [id]);

	const fetchData = async () => {
		showLoading("Memuat Data Akun...");
		setAlert(null);
		let history = [];
		try {
			const minDelay = new Promise((resolve) =>
				setTimeout(resolve, LOADING_DELAY),
			);

			let detail = null;
			// If isSelf and NOT management, we must use getMe
			// If management, we try to get richer detail from employee endpoint first
			if (isManagement) {
				try {
					detail = await api.getEmployeeDetail(id);
				} catch (err) {
					console.warn(
						"[EditAkunPage] Rich detail failed, falling back to getMe:",
						err,
					);
					if (isSelf) detail = await api.getMe();
					else throw err;
				}
			} else if (isSelf) {
				detail = await api.getMe();
			}

			await minDelay;

			if (detail) {
				history = detail.attendance_history || [];
				setEmployee(detail);
				const name =
					detail.full_name ||
					detail.fullName ||
					detail.name ||
					detail.employee_name ||
					"";
				setFormData({
					full_name:
						detail.full_name ||
						detail.name ||
						detail.fullName ||
						detail.employee_name ||
						detail.employeeName ||
						"",
					email: detail.email || "",
					nik:
						detail.nik ||
						detail.nip ||
						detail.employee_id ||
						detail.employeeId ||
						"",
					department:
						detail.department || detail.position || detail.division || "",
					role: detail.role || detail.user_role || detail.level || "employee",
					phone:
						detail.phone_number ||
						detail.phone ||
						detail.no_hp ||
						detail.phoneNumber ||
						"",
					employment_duration: detail.employment_duration || "",
					annual_leave_quota:
						detail.annual_leave_quota ??
						detail.annualLeaveQuota ??
						(detail.total_leaves_taken !== undefined &&
						detail.leave_balance !== undefined
							? Number(detail.total_leaves_taken) + Number(detail.leave_balance)
							: "80"),
					leave_balance:
						detail.leave_balance ??
						detail.leaveBalance ??
						detail.sisa_cuti ??
						"3",
				});
				setAttendanceHistory(history);
			} else {
				throw new Error("Data karyawan tidak ditemukan");
			}
		} catch (error) {
			console.error("[EditAkunPage] Global fetch error:", error);
			setAlert({
				type: "error",
				message: `Gagal memuat data: ${error.message || "Endpoint error"}`,
			});
		} finally {
			hideLoading();
		}
	};

	const handleSave = async () => {
		showLoading("Menyimpan Perubahan...");
		try {
			// Send full formData to satisfy backend validation (e.g., Department is required)
			// UI already restricts changing other fields for employees
			// Include all known variations for maximum compatibility
			const payload = {
				department: formData.department,
				email: formData.email,
				name: formData.full_name,
				phone: formData.phone,
				role: formData.role,
				last_action_type: "update_data", // Action type hint
			};
			console.log("[EditProfile] Sending Strict Payload:", payload);
			await api.updateEmployee(id, payload);

			setEmployee({ ...employee, ...formData });
			setIsEditing(false);
			setAlert({
				type: "success",
				message: "Perubahan profil berhasil disimpan",
			});
			// Removed fetchData() so it doesn't clear the success alert immediately
			setTimeout(() => {
				setAlert(null);
			}, 3000);
		} catch (error) {
			setAlert({
				type: "error",
				message: error.message || "Gagal memperbarui data",
			});
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

	const calculateDuration = (startTime, endTime) => {
		if (!startTime || !endTime || startTime === "-" || endTime === "-")
			return "-";
		try {
			const [startHour, startMinute] = startTime.split(".").map(Number);
			const [endHour, endMinute] = endTime.split(".").map(Number);
			if (isNaN(startHour) || isNaN(endHour)) return "-";
			let durationHour = endHour - startHour;
			let durationMinute = endMinute - startMinute;
			if (durationMinute < 0) {
				durationHour -= 1;
				durationMinute += 60;
			}
			if (durationHour < 0) return "-";
			return `${durationHour} Jam ${durationMinute > 0 ? `${durationMinute} Menit` : ""}`;
		} catch {
			return "-";
		}
	};

	const historyColumns = useMemo(
		() => [
			{ header: "No", accessor: "no", className: "w-16" },
			{ header: "Tanggal", accessor: "date" },
			{ header: "Durasi kerja", accessor: "duration" },
			{
				header: "Clock In",
				accessor: "clockIn",
				render: (row) => (
					<span className="text-success-600 font-medium">{row.clockIn}</span>
				),
			},
			{
				header: "Clock Out",
				accessor: "clockOut",
				render: (row) => {
					const [hour] = (row.clockOut || "").split(".").map(Number);
					const isEarly = hour < 17;
					return (
						<span
							className={
								isEarly
									? "text-danger-600 font-medium"
									: "text-brand-600 font-medium"
							}
						>
							{row.clockOut}
						</span>
					);
				},
			},
		],
		[],
	);

	const mappedHistory = attendanceHistory.map((item, i) => {
		const cIn = formatTime(item.clock_in || item.clockIn);
		const cOut = formatTime(item.clock_out || item.clockOut);
		return {
			no: i + 1,
			date: formatDate(item.date || item.created_at),
			clockIn: cIn,
			clockOut: cOut,
			duration: calculateDuration(cIn, cOut),
		};
	});

	return (
		<Layout
			activeMenu={isManagement && !isSelf ? "Manajemen akun user" : "Beranda"}
			title={isSelf ? "Profil Saya" : "Detail Akun"}
		>
			<div className="lg:p-8 p-4 space-y-8 w-full">
				{/* Loading / Alert Portal */}

				{alert &&
					createPortal(
						<div
							className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all duration-300"
							style={{ zIndex: 1001 }}
						>
							<Alert
								variant={alert.type}
								message={alert.message}
								onClose={() => setAlert(null)}
								showCloseIcon={false}
								{...alert}
							/>
						</div>,
						document.body,
					)}

				{/* Header Section */}
				<div className="flex justify-between items-start">
					<div className="space-y-1">
						{!isSelf && isManagement ? (
							<button
								onClick={() => navigate("/admin/akun")}
								className="flex items-center gap-2 text-gray-500 hover:text-brand transition-colors text-sm font-medium mb-4 group"
							>
								<ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
								Kembali ke daftar akun
							</button>
						) : (
							<button
								onClick={() => navigate("/dashboard")}
								className="flex items-center gap-2 text-gray-500 hover:text-brand transition-colors text-sm font-medium mb-4 group"
							>
								<ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
								Kembali ke Beranda
							</button>
						)}
						<h1 className="text-3xl font-bold text-gray-800">
							{isSelf
								? "Profil Saya"
								: `Detail Akun: ${employee?.full_name || employee?.name || employee?.fullName || employee?.employee_name || "Karyawan"}`}
						</h1>
						<div className="flex items-center gap-2 text-gray-500 font-medium uppercase tracking-wider text-sm">
							<span>
								{employee?.role ||
									employee?.user_role ||
									employee?.level ||
									formData?.role ||
									"Employee"}
							</span>
							<span>•</span>
							<span className="text-brand font-bold">
								{employee?.nik || employee?.nip || employee?.employee_id || "-"}
							</span>
						</div>
					</div>

					{/* Tombol edit HANYA muncul jika ADMIN/SUPERADMIN melihat profil ORANG LAIN */}
					{!isSelf && (isAdmin || isSuperAdmin) && !isEditing && (
						<div className="flex gap-2">
							<button
								onClick={() => setIsEditing(true)}
								className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-xl font-bold hover:bg-brand-700 transition-all active:scale-95 shadow-lg shadow-brand/20"
							>
								<PencilSquareIcon className="w-5 h-5" />
								Profil
							</button>
						</div>
					)}
					{!isSelf && (isAdmin || isSuperAdmin) && isEditing && (
						<div className="flex gap-3">
							<button
								onClick={() => setIsEditing(false)}
								className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-95"
							>
								Batal
							</button>
							<button
								onClick={handleSave}
								className="px-6 py-2.5 bg-brand text-white rounded-xl font-bold hover:bg-brand-700 transition-all active:scale-95 shadow-lg shadow-brand/20"
							>
								Simpan Perubahan
							</button>
						</div>
					)}
				</div>

				{/* Profile Card / Detail Section */}
				<div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-100 overflow-hidden border border-gray-100 p-10 relative group">
					{/* Decorative element */}
					<div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

					<div className="flex flex-col lg:flex-row gap-12 items-center lg:items-start text-center lg:text-left relative z-10">
						{/* Left: Avatar */}
						<div className="shrink-0">
							<div className="w-56 h-56 rounded-[3rem] bg-gray-50 border-4 border-gray-100 flex items-center justify-center overflow-hidden shadow-inner group-hover:shadow-brand/10 transition-shadow duration-500 relative">
								<img
									src={getAvatarUrl(
										employee?.full_name ||
											employee?.name ||
											employee?.fullName ||
											employee?.employee_name,
									)}
									alt="Profile avatar"
									className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
								/>
								<div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-10 transition-opacity" />
							</div>
						</div>

						{/* Right: Details */}
						<div className="flex-1 w-full lg:max-w-2xl">
							<div className="grid grid-cols-1 gap-y-4">
								<DetailRow
									label="Nama"
									isEditing={isEditing}
									value={
										isEditing ? (
											<input
												className={`w-full p-2 border rounded-lg outline-none font-bold ${
													isAdmin || isSuperAdmin
														? "border-brand-200 focus:ring-1 focus:ring-brand focus:border-brand bg-gray-50/30 text-brand-900"
														: "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
												}`}
												value={formData.full_name}
												onChange={(e) =>
													setFormData({
														...formData,
														full_name: e.target.value,
													})
												}
												readOnly={!(isAdmin || isSuperAdmin)}
											/>
										) : (
											employee?.full_name ||
											employee?.name ||
											employee?.fullName ||
											employee?.employee_name ||
											"-"
										)
									}
								/>
								<DetailRow
									label="Email"
									isEditing={isEditing}
									value={
										isEditing ? (
											<input
												className={`w-full p-2 border rounded-lg outline-none font-bold ${
													isAdmin || isSuperAdmin
														? "border-brand-200 focus:ring-1 focus:ring-brand focus:border-brand bg-gray-50/30 text-brand-900"
														: "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
												}`}
												value={formData.email}
												onChange={(e) =>
													setFormData({ ...formData, email: e.target.value })
												}
												readOnly={!(isAdmin || isSuperAdmin)}
											/>
										) : (
											employee?.email || "-"
										)
									}
								/>
								<DetailRow
									label="NIP"
									isEditing={isEditing}
									value={
										isEditing ? (
											<input
												className={`w-full p-2 border rounded-lg outline-none font-bold ${
													isSuperAdmin
														? "border-brand-200 focus:ring-1 focus:ring-brand focus:border-brand bg-gray-50/30 text-brand-900"
														: "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
												}`}
												value={formData.nik}
												onChange={(e) =>
													setFormData({ ...formData, nik: e.target.value })
												}
												readOnly={!isSuperAdmin}
											/>
										) : (
											employee?.nik ||
											employee?.nip ||
											employee?.employee_id ||
											"-"
										)
									}
								/>
								<DetailRow
									label="No Telepon"
									isEditing={isEditing}
									value={
										isEditing ? (
											<input
												type="number"
												className="w-full p-2 border border-brand-200 rounded-lg focus:ring-1 focus:ring-brand focus:border-brand outline-none text-brand-900 font-bold bg-gray-50/30"
												value={formData.phone}
												onChange={(e) =>
													setFormData({ ...formData, phone: e.target.value })
												}
											/>
										) : (
											employee?.phone_number ||
											employee?.phone ||
											employee?.no_hp ||
											"-"
										)
									}
								/>
								<DetailRow
									label="Divisi"
									isEditing={isEditing}
									value={
										isEditing ? (
											<select
												className="w-full p-2 border border-brand-200 rounded-lg focus:ring-1 focus:ring-brand focus:border-brand outline-none text-brand-900 font-bold bg-gray-50/30"
												value={formData.department}
												onChange={(e) =>
													setFormData({
														...formData,
														department: e.target.value,
													})
												}
											>
												<option value="">Pilih Divisi</option>
												<option value="UI/UX Designer">UI/UX Designer</option>
												<option value="IT OPS">IT OPS</option>
												<option value="Engineering">Engineering</option>
												<option value="System Analyst">System Analyst</option>
												<option value="QA">QA</option>
												<option value="HR">HR</option>
											</select>
										) : (
											employee?.department || employee?.position || "-"
										)
									}
								/>
								<DetailRow
									label="Role"
									isEditing={isEditing}
									value={
										isEditing ? (
											<select
												className={`w-full p-2 border rounded-lg outline-none font-bold ${
													isSuperAdmin
														? "border-brand-200 focus:ring-1 focus:ring-brand focus:border-brand bg-gray-50/30 text-brand-900"
														: "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
												}`}
												value={formData.role}
												onChange={(e) =>
													setFormData({ ...formData, role: e.target.value })
												}
												disabled={!isSuperAdmin}
											>
												<option value="employee">Employee</option>
												<option value="admin">Admin</option>
												<option value="superadmin">Superadmin</option>
											</select>
										) : (
											employee?.role ||
											employee?.user_role ||
											employee?.level ||
											formData?.role ||
											"-"
										)
									}
								/>
								<DetailRow
									label="Lama bekerja"
									isEditing={isEditing}
									value={
										isEditing ? (
											<input
												className="w-full p-2 border border-gray-200 rounded-lg outline-none font-bold bg-gray-100 text-gray-500 cursor-not-allowed"
												value={formData.employment_duration}
												readOnly
											/>
										) : (
											employee?.employment_duration || "-"
										)
									}
								/>
								<DetailRow
									label="Banyaknya cuti"
									isEditing={isEditing}
									value={
										isEditing ? (
											<input
												className={`w-full p-2 border rounded-lg outline-none font-bold ${
													isSuperAdmin
														? "border-brand-200 focus:ring-1 focus:ring-brand focus:border-brand bg-gray-50/30 text-brand-900"
														: "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
												}`}
												type="number"
												value={formData.annual_leave_quota}
												onChange={(e) =>
													setFormData({
														...formData,
														annual_leave_quota: e.target.value,
													})
												}
												readOnly={!isSuperAdmin}
											/>
										) : (
											employee?.annual_leave_quota ||
											(employee?.total_leaves_taken !== undefined &&
											employee?.leave_balance !== undefined
												? Number(employee.total_leaves_taken) +
													Number(employee.leave_balance)
												: "80")
										)
									}
								/>
								<DetailRow
									label="Sisa cuti"
									isEditing={isEditing}
									value={
										isEditing ? (
											<input
												className={`w-full p-2 border rounded-lg outline-none font-bold ${
													isSuperAdmin
														? "border-brand-200 focus:ring-1 focus:ring-brand focus:border-brand bg-gray-50/30 text-brand-900"
														: "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
												}`}
												type="number"
												value={formData.leave_balance}
												onChange={(e) =>
													setFormData({
														...formData,
														leave_balance: e.target.value,
													})
												}
												readOnly={!isSuperAdmin}
											/>
										) : (
											(employee?.leave_balance ?? "3")
										)
									}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Attendance History Section */}
				<div className="space-y-6 pt-4">
					<h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
						Riwayat absensi
					</h3>
					<div className="w-full">
						<Table columns={historyColumns} data={mappedHistory} />
					</div>
				</div>
			</div>
		</Layout>
	);
}

function DetailRow({ label, value }) {
	return (
		<div className="flex items-center group py-1 border-b border-transparent hover:border-gray-50 transition-colors">
			<span className="text-gray-500 font-semibold w-40 shrink-0 text-sm lg:text-base">
				{label}
			</span>
			<span className="text-gray-400 font-medium px-4">:</span>
			<span className="text-gray-700 font-bold text-sm lg:text-base break-all">
				{value}
			</span>
		</div>
	);
}
