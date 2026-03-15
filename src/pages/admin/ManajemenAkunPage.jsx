import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
	Layout,
	Table,
	Button,
	Badge,
	Alert,
	Modal,
} from "../../lib/components";
import {
	PencilSquareIcon,
	TrashIcon,
	InformationCircleIcon,
	LockOpenIcon,
	ChevronLeftIcon,
} from "@heroicons/react/24/solid";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import { useLoading } from "../../lib/LoadingContext";
import { LOADING_DELAY, USER_ROLES, DEPARTMENTS } from "../../lib/constants";

/** Mengubah raw MySQL duplicate key error menjadi pesan yang ramah user. */
const parseDuplicateError = (msg = "") => {
	if (/Duplicate entry/i.test(msg)) {
		if (/nik/i.test(msg))
			return "NIK sudah digunakan. Gunakan NIK yang berbeda.";
		if (/email/i.test(msg))
			return "Email sudah terdaftar. Gunakan email yang berbeda.";
		if (/phone/i.test(msg)) return "Nomor telepon sudah terdaftar.";
		return "Data sudah terdaftar. Periksa kembali input kamu.";
	}
	return msg;
};

export default function ManajemenAkunPage() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const { showLoading, hideLoading } = useLoading();
	const [users, setUsers] = useState([]);
	const [deleteConfirm, setDeleteConfirm] = useState(null);
	const [unlockConfirm, setUnlockConfirm] = useState(null);
	const [updateUser, setUpdateUser] = useState(null);
	const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

	// Modal States for Adding User
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
	const [createdUser, setCreatedUser] = useState(null);
	const [isUnlockInProgress, setIsUnlockInProgress] = useState(false);
	const [alert, setAlert] = useState(null);

	const [params, setParams] = useState({
		page: 1,
		limit: 5,
		search: "",
		status: "",
		department: "",
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
		fetchEmployees(true);
	}, [debouncedSearch]);

	useEffect(() => {
		fetchEmployees(false);
	}, [params.page, params.limit, params.status, params.department]);

	const fetchEmployees = async (isSearch = false) => {
		if (!isSearch) showLoading("Memuat Data Akun...");
		try {
			// Convert params to API format (limit instead of pageSize)
			// Kita tarik semua akun (limit 500) agar pencarian Nama (Andi dkk) lancar
			// dan agar kita bisa mengurutkan dari akun tertua (Admins) di paling atas.
			const apiParams = {
				page: 1,
				limit: 500,
				search: "", // Gunakan pencarian client-side di komponen Table
			};

			const minDelay = new Promise((resolve) =>
				setTimeout(resolve, LOADING_DELAY),
			);

			// Teteh ubah bagian ini: Gunakan Promise.all agar API dan delay berjalan paralel dan saling menunggu
			const [rawResponse] = await Promise.all([
				api.getDashboardEmployees(apiParams),
				minDelay,
			]);

			// Handling direct array or { data, total } structure
			const employees = Array.isArray(rawResponse)
				? rawResponse
				: rawResponse.data || [];
			const total =
				rawResponse.total || rawResponse.total_elements || employees.length;

			console.log("[Account List Diagnostic]:", {
				raw: rawResponse,
				firstItem: employees[0],
				keys: employees[0] ? Object.keys(employees[0]) : [],
			});

			// Urutkan berdasarkan ID ASC agar Akun Terlama (biasanya Admin/Super Admin)
			// berada di paling atas daftar sesuai permintaan.
			const sortedEmployees = (Array.isArray(employees) ? employees : []).sort(
				(a, b) => (a.id || 0) - (b.id || 0),
			);

			const mapped = sortedEmployees.map((item, i) => {
				return {
					id: item.id,
					no: i + 1, // Penomoran urut dari yang tertua
					name:
						item.full_name ||
						item.fullName ||
						item.name ||
						item.employee_name ||
						"-",
					nip: item.nik || item.nip || "-",
					email: item.email || "-",
					phone: item.phone || "-",
					division: item.department || item.division || item.position || "-",
					status: item.status || "active",
					lastActionType:
						item.last_action_type || item.action_type || item.update_type || "",
					_raw: item,
				};
			});
			setUsers(mapped);
		} catch (error) {
			console.error("Error fetching employees:", error);
		} finally {
			hideLoading();
		}
	};
	const handleDelete = async (user) => {
		setDeleteConfirm(user);
	};

	const confirmDelete = async () => {
		const user = deleteConfirm;
		setDeleteConfirm(null);
		setAlert({ type: "loading" });
		try {
			await api.deleteEmployee(user.id);
			setAlert({
				type: "success",
				message: `Akun ${user.name} berhasil dihapus`,
			});
			fetchEmployees(); // Auto-refresh after delete
		} catch (error) {
			setAlert({ type: "error", message: `Gagal menghapus: ${error.message}` });
		}
		setTimeout(() => setAlert(null), 3000);
	};

	const handleUnlock = (user) => {
		setUnlockConfirm(user);
	};

	const confirmUnlock = async () => {
		const user = unlockConfirm;
		setUnlockConfirm(null);

		// Redirect to password generation modal
		setCreatedUser(user);
		setIsUnlockInProgress(true);
		setIsPasswordModalOpen(true);
	};

	const handleAccountSubmit = async (data, setErrors) => {
		// Prepare draft user (Creation path)
		const draftUser = {
			full_name: data.name,
			nik: data.nip,
			email: data.email,
			phone: data.phone,
			department: data.division,
		};

		setCreatedUser(draftUser);
		setIsCreateModalOpen(false);
		setIsPasswordModalOpen(true);
	};

	const handleSetPassword = async (password) => {
		if (!createdUser) return;

		setAlert({ type: "loading" });
		try {
			if (isUnlockInProgress) {
				// Unlock flow (Reset Password)
				await api.resetEmployeePassword(createdUser.id, {
					password: password,
					new_password: password,
					confirm_password: password,
					is_new_employee: 1, // Mark as new again after reset
					last_action_type: "unblock", // Action type hint
				});

				setAlert({
					type: "success",
					message: `Akun ${createdUser.name} berhasil diaktifkan kembali.`,
				});
			} else {
				// Create flow
				const payload = {
					...createdUser,
					password: password,
				};

				await api.createEmployee(payload);

				setAlert({
					type: "success",
					message: "Akun berhasil dibuat.",
				});
			}

			setIsPasswordModalOpen(false);
			setCreatedUser(null);
			setIsUnlockInProgress(false);
			fetchEmployees();
		} catch (error) {
			const raw = error.response?.data?.message || error.message || "";
			const friendlyMsg = parseDuplicateError(raw);
			setAlert({
				type: "error",
				message: `Gagal: ${friendlyMsg}`,
			});
		}
		setTimeout(() => setAlert(null), 3000);
	};

	const openCreateModal = () => {
		setCreatedUser(null);
		setIsCreateModalOpen(true);
	};

	const divisionOptions = useMemo(
		() =>
			DEPARTMENTS.map((dept) => ({
				label: dept,
				value: dept,
			})),
		[],
	);

	const columns = useMemo(
		() => [
			{ header: "No", accessor: "no", className: "w-16" },
			{ header: "Nama karyawan", accessor: "name" },
			{ header: "NIP", accessor: "nip" },
			{ header: "Email", accessor: "email" },
			{
				header: "Divisi",
				accessor: "division",
				filterType: "select",
				filterOptions: [
					{ label: "Semua Divisi", value: "" },
					...divisionOptions,
				],
			},
			{
				header: "Status",
				accessor: "status",
				filterType: "select",
				filterOptions: [
					{ label: "Semua Status", value: "" },
					{ label: "Active", value: "active" },
					{ label: "Blokir", value: "blocked" },
				],
				render: (row) => (
					<Badge variant={row.status === "active" ? "approve" : "blokir"}>
						{row.status === "active" ? "Active" : "Blokir"}
					</Badge>
				),
			},
			{
				header: "Action",
				accessor: "action",
				render: (row) => (
					<div className="flex gap-2 justify-center">
						<button
							className="p-1.5 rounded-lg bg-danger text-white hover:bg-danger-600 transition-all duration-200 active:scale-95 hover:shadow-md"
							onClick={() => handleDelete(row)}
							title="Hapus Akun"
						>
							<TrashIcon className="w-5 h-5" />
						</button>
						{row.status !== "active" ? (
							<button
								className="p-1.5 rounded-lg bg-info text-white hover:bg-info-600 transition-all duration-200 active:scale-95 hover:shadow-md"
								onClick={() => handleUnlock(row)}
								title="Buka Gembok"
							>
								<LockOpenIcon className="w-5 h-5" />
							</button>
						) : (
							<button
								className="p-1.5 rounded-lg bg-brand text-white hover:bg-brand-700 transition-all duration-200 active:scale-95 hover:shadow-md"
								onClick={() => navigate(`/admin/akun/${row.id}`)}
								title="Lihat Detail / Edit Akun"
							>
								<ChevronLeftIcon className="w-5 h-5" />
							</button>
						)}
					</div>
				),
			},
		],
		[divisionOptions, handleDelete, handleUnlock, navigate],
	);

	const handleParamsChange = (newParams) => {
		setParams((prev) => ({
			...prev,
			page: newParams.page,
			limit: newParams.pageSize,
			search: newParams.search,
		}));
	};

	const handleFilterChange = (key, value) => {
		setParams((prev) => ({
			...prev,
			[key]: value,
			page: 1, // Reset to page 1 on filter
		}));
	};

	// --- Create / Edit Account ---

	return (
		<Layout activeMenu="Manajemen akun user" title="Manajemen akun">
			<div className="lg:p-8 p-4 space-y-6 w-full relative">
				<div className="space-y-4">
					<div className="flex flex-col items-start gap-4">
						<h3 className="text-gray-600 font-medium text-lg">
							Manajemen akun karyawan
						</h3>
						<Button onClick={openCreateModal} variant="info">
							Tambah akun
						</Button>
					</div>

					<div>
						<Table
							columns={columns}
							data={users}
							manual={false} // Pindah ke client-side agar filter/search instan & dukung sort custom
							maxheight="620px"
							totalCount={users.length}
							pageSize={5}
							search={params.search}
							onFilterChange={(accessor, value) => {
								if (accessor === "division") {
									handleFilterChange("department", value);
								} else {
									handleFilterChange(accessor, value);
								}
							}}
						/>
					</div>
				</div>

				{/* Delete Confirmation Overlay */}
				{deleteConfirm &&
					createPortal(
						<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60  p-4">
							<Alert
								variant="question"
								title={`Yakin ingin menghapus akun ${deleteConfirm.name}?`}
								buttonText="Ya, Hapus"
								cancelText="Batal"
								onConfirm={confirmDelete}
								onCancel={() => setDeleteConfirm(null)}
								btnConfirmVariant="danger"
								btnCancelVariant="info"
							/>
						</div>,
						document.body,
					)}

				{/* Unlock Confirmation Overlay */}
				{unlockConfirm &&
					createPortal(
						<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60  p-4 text-center">
							<Alert
								variant="question"
								title="Apakah anda yakin ingin mengaktifkan akun ini?"
								buttonText="Lanjut"
								cancelText="Batal"
								onConfirm={confirmUnlock}
								onCancel={() => setUnlockConfirm(null)}
								btnConfirmVariant="info"
								btnCancelVariant="danger"
							>
								Mengaktifkan akun akan mereset password user secara otomatis.
							</Alert>
						</div>,
						document.body,
					)}

				{/* Alert Overlay */}
				{alert &&
					createPortal(
						<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60  p-4">
							<Alert
								variant={alert.type}
								onClose={() => setAlert(null)}
								message={alert.message}
							/>
						</div>,
						document.body,
					)}

				{/* Modal 1: Create Account */}
				<CreateAccountModal
					isOpen={isCreateModalOpen}
					onClose={() => setIsCreateModalOpen(false)}
					onSubmit={handleAccountSubmit}
					currentUserRole={user?.role}
				/>

				{/* Modal 2: Generate Password */}
				<GeneratePasswordModal
					isOpen={isPasswordModalOpen}
					onClose={() => {
						setIsPasswordModalOpen(false);
						setCreatedUser(null);
						setIsUnlockInProgress(false);
					}}
					onSubmit={handleSetPassword}
					userEmail={createdUser?.email}
				/>

				{/* Modal 3: Update Account (Full Edits for Admin) */}
				<UpdateAccountModal
					isOpen={isUpdateModalOpen}
					onClose={() => {
						setIsUpdateModalOpen(false);
						setUpdateUser(null);
					}}
					onSubmit={async (data) => {
						setAlert({ type: "loading" });
						try {
							await api.updateEmployee(updateUser.id, {
								...data,
								last_action_type: "update_data", // Action type hint
							});
							setAlert({
								type: "success",
								message: "Data karyawan berhasil diperbarui",
							});
							setIsUpdateModalOpen(false);
							setUpdateUser(null);
							fetchEmployees(); // Auto-refresh after update
						} catch (error) {
							setAlert({
								type: "error",
								message: error.message || "Gagal memperbarui data",
							});
						}
						setTimeout(() => setAlert(null), 3000);
					}}
					userData={updateUser}
					currentUserRole={user?.role}
					userRoleRaw={user?.role} // Pass raw role for debugging
				/>
			</div>
		</Layout>
	);
}

// --- Component: Update Account Modal ---
function UpdateAccountModal({
	isOpen,
	onClose,
	onSubmit,
	userData,
	currentUserRole,
}) {
	const [formData, setFormData] = useState({
		full_name: "",
		email: "",
		nik: "",
		department: "",
		role: "",
		phone: "",
	});

	useEffect(() => {
		if (isOpen && userData) {
			setFormData({
				full_name:
					userData.full_name ||
					userData.name ||
					userData.fullName ||
					userData.employeeName ||
					userData.employee_name ||
					"",
				email: userData.email || "",
				nik:
					userData.nik ||
					userData.nip ||
					userData.employeeId ||
					userData.employee_id ||
					"",
				department:
					userData.department || userData.position || userData.division || "",
				role: userData.role || "employee",
				phone: userData.phone || "",
			});
		}
	}, [isOpen, userData]);

	const divisionOptions = [
		{ label: "UI/UX Designer", value: "UI/UX Designer" },
		{ label: "IT OPS", value: "IT OPS" },
		{ label: "System Analyst", value: "System Analyst" },
		{ label: "QA", value: "QA" },
		{ label: "HR", value: "HR" },
	];

	const getInputClass = (isReadOnly = false) =>
		`w-full p-2.5 border border-gray-300 rounded-xl outline-none transition-all ${
			isReadOnly
				? "bg-gray-50 text-gray-500 cursor-not-allowed"
				: "bg-white text-gray-700 focus:border-brand-400 focus:ring-2 focus:ring-brand/10"
		}`;

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Edit akun user">
			<div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
				{/* Nama Karyawan */}
				<div className="space-y-1">
					<label className="text-sm font-semibold text-gray-600">
						Nama Karyawan
					</label>
					<input
						value={formData.full_name}
						onChange={(e) =>
							setFormData({ ...formData, full_name: e.target.value })
						}
						className={getInputClass(false)}
						placeholder="Nama lengkap..."
					/>
				</div>

				{/* Email */}
				<div className="space-y-1">
					<label className="text-sm font-semibold text-gray-600">Email</label>
					<input
						value={formData.email}
						onChange={(e) =>
							setFormData({ ...formData, email: e.target.value })
						}
						className={getInputClass(false)}
						placeholder="Email aktif..."
					/>
				</div>

				{/* NIP */}
				<div className="space-y-1">
					<label className="text-sm font-semibold text-gray-600">NIP</label>
					<input
						value={formData.nik}
						onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
						className={getInputClass(false)}
						placeholder="Nomor Induk Pegawai..."
					/>
				</div>

				{/* Divisi */}
				<div className="space-y-1">
					<label className="text-sm font-semibold text-gray-600">Divisi</label>
					<select
						value={formData.department}
						onChange={(e) =>
							setFormData({ ...formData, department: e.target.value })
						}
						className={getInputClass(false)}
					>
						<option value="">Pilih Divisi</option>
						{divisionOptions.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				</div>

				{/* Role (SUPER ADMIN ONLY) */}
				{String(currentUserRole).toLowerCase().replace(/\s/g, "") ===
					"superadmin" && (
					<div className="space-y-1">
						<label className="text-sm font-semibold text-gray-600">Role</label>
						<select
							value={formData.role}
							onChange={(e) =>
								setFormData({ ...formData, role: e.target.value })
							}
							className={getInputClass(false)}
						>
							<option value="employee">Employee</option>
							<option value="admin">Admin</option>
						</select>
					</div>
				)}

				{/* No Telepone */}
				<div className="space-y-1">
					<label className="text-sm font-semibold text-gray-600">
						No. Telepon
					</label>
					<input
						type="number"
						value={formData.phone}
						onChange={(e) =>
							setFormData({ ...formData, phone: e.target.value })
						}
						className={getInputClass(false)}
						placeholder="0812xxxx"
					/>
				</div>

				{/* Buttons */}
				<div className="flex justify-end gap-3 pt-2">
					<button
						onClick={onClose}
						className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-95"
					>
						Batal
					</button>
					<button
						onClick={() => {
							const payload = {
								department: formData.department,
								email: formData.email,
								name: formData.full_name,
								phone: formData.phone,
								role: formData.role,
							};
							console.log("[UpdateAccount] Sending Strict Payload:", payload);
							onSubmit(payload);
						}}
						className="px-6 py-2.5 bg-brand text-white rounded-xl font-bold hover:bg-brand-700 transition-all active:scale-95 shadow-lg shadow-brand/20"
					>
						Simpan Perubahan
					</button>
				</div>
			</div>
		</Modal>
	);
}

// --- Component: Create Account Modal (ONLY FOR CREATE) ---
function CreateAccountModal({ isOpen, onClose, onSubmit, currentUserRole }) {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
		nip: "",
		division: "",
		role: "employee",
	});
	const [errors, setErrors] = useState({});

	useEffect(() => {
		if (isOpen) {
			setFormData({
				name: "",
				email: "",
				phone: "",
				nip: "",
				division: "",
				role: "employee",
			});
			setErrors({});
		}
	}, [isOpen]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		if (errors[name]) {
			setErrors((prev) => ({ ...prev, [name]: "" }));
		}
	};

	const validate = () => {
		const newErrors = {};
		if (!formData.name) newErrors.name = "Nama wajib diisi";
		if (!formData.email) {
			newErrors.email = "Email wajib diisi";
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = "Email tidak valid";
		}
		if (!formData.phone) newErrors.phone = "No. HP wajib diisi";
		if (!formData.nip) newErrors.nip = "NIP wajib diisi";
		if (!formData.division) newErrors.division = "Divisi wajib dipilih";

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = () => {
		if (validate()) {
			onSubmit(formData, setErrors);
		}
	};

	const divisionOptions = [
		{ label: "UI/UX Designer", value: "UI/UX Designer" },
		{ label: "IT OPS", value: "IT OPS" },
		{ label: "System Analyst", value: "System Analyst" },
		{ label: "QA", value: "QA" },
		{ label: "HR", value: "HR" },
	];

	const getInputClass = (error) =>
		`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
			error
				? "border-danger focus:ring-danger-100 placeholder-danger-300 text-danger-900"
				: "border-brand-300 text-brand-900 focus:border-brand focus:ring-brand-100 placeholder-gray-400"
		}`;

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Akun Baru">
			<div className="space-y-4">
				{/* Nama */}
				<div className="space-y-1">
					<label className="text-sm font-medium text-gray-700">Nama</label>
					<input
						name="name"
						value={formData.name}
						onChange={handleChange}
						className={getInputClass(errors.name)}
						placeholder="Tomi darvito"
					/>
					{errors.name && (
						<p className="text-xs text-danger font-medium">{errors.name}</p>
					)}
				</div>

				{/* Email */}
				<div className="space-y-1">
					<label className="text-sm font-medium text-gray-700">Email</label>
					<input
						name="email"
						type="email"
						value={formData.email}
						onChange={handleChange}
						className={getInputClass(errors.email)}
						placeholder="Tomi@gmail.com"
					/>
					{errors.email && (
						<p className="text-xs text-danger font-medium">{errors.email}</p>
					)}
				</div>

				{/* No HP */}
				<div className="space-y-1">
					<label className="text-sm font-medium text-gray-700">No HP</label>
					<input
						name="phone"
						type="number"
						value={formData.phone}
						onChange={handleChange}
						className={getInputClass(errors.phone)}
						placeholder="0812xxxx"
					/>
					{errors.phone && (
						<p className="text-xs text-danger font-medium">{errors.phone}</p>
					)}
				</div>

				{/* NIP */}
				<div className="space-y-1">
					<label className="text-sm font-medium text-gray-700">NIP</label>
					<input
						name="nip"
						value={formData.nip}
						onChange={handleChange}
						className={getInputClass(errors.nip)}
						placeholder="98237443"
					/>
					{errors.nip && (
						<p className="text-xs text-danger font-medium">{errors.nip}</p>
					)}
				</div>

				{/* Divisi */}
				<div className="space-y-1">
					<label className="text-sm font-medium text-gray-700">Divisi</label>
					<select
						name="division"
						value={formData.division}
						onChange={handleChange}
						className={getInputClass(errors.division)}
					>
						<option value="">Divisi</option>
						{divisionOptions.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
					{errors.division && (
						<p className="text-xs text-danger font-medium">{errors.division}</p>
					)}
				</div>

				{/* Role (Super Admin Only) */}
				{currentUserRole === USER_ROLES.SUPER_ADMIN && (
					<div className="space-y-1">
						<label className="text-sm font-medium text-gray-700">Role</label>
						<select
							name="role"
							value={formData.role}
							onChange={handleChange}
							className={getInputClass(errors.role)}
						>
							<option value="employee">Employee</option>
							<option value="admin">Admin</option>
						</select>
					</div>
				)}

				{/* Buttons */}
				<div className="flex justify-end gap-3 pt-4">
					<Button variant="danger" onClick={onClose}>
						Batal
					</Button>
					<Button variant="info" onClick={handleSubmit}>
						Kirim
					</Button>
				</div>
			</div>
		</Modal>
	);
}

// --- Component: Generate Password Modal ---
function GeneratePasswordModal({ isOpen, onClose, onSubmit, userEmail }) {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isGenerated, setIsGenerated] = useState(false);
	const [isCopied, setIsCopied] = useState(false);
	const [localAlert, setLocalAlert] = useState(null);

	const generatePassword = () => {
		const chars =
			"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		let pass = "";
		for (let i = 0; i < 8; i++) {
			pass += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		setPassword(pass);
		setConfirmPassword(""); // User wants this empty so it must be typed manually
		setIsGenerated(true);
		setIsCopied(false);
		setLocalAlert(null);
	};

	const handleCopy = () => {
		if (!password) return;

		const doFallback = () => {
			const el = document.createElement("textarea");
			el.value = password;
			el.setAttribute("readonly", "");
			el.style.position = "absolute";
			el.style.left = "-9999px";
			document.body.appendChild(el);
			el.select();
			try {
				document.execCommand("copy");
				setIsCopied(true);
				setTimeout(() => setIsCopied(false), 2000);
			} catch (err) {
				console.error("Fallback copy failed:", err);
			}
			document.body.removeChild(el);
		};

		if (
			navigator.clipboard &&
			typeof navigator.clipboard.writeText === "function"
		) {
			navigator.clipboard
				.writeText(password)
				.then(() => {
					setIsCopied(true);
					setTimeout(() => setIsCopied(false), 2000);
				})
				.catch((err) => {
					console.warn("Clipboard API failed, using fallback:", err);
					doFallback();
				});
		} else {
			doFallback();
		}
	};

	const handleSubmit = () => {
		if (!password) {
			setLocalAlert({
				type: "error",
				message: "Generate password terlebih dahulu",
			});
			return;
		}
		if (!confirmPassword) {
			setLocalAlert({
				type: "error",
				message: "Konfirmasi password wajib diisi",
			});
			return;
		}
		if (password !== confirmPassword) {
			setLocalAlert({
				type: "error",
				message: "Password dan Konfirmasi Password tidak sama",
			});
			return;
		}
		onSubmit(password);
	};

	useEffect(() => {
		if (isOpen) {
			setPassword("");
			setConfirmPassword("");
			setIsGenerated(false);
			setLocalAlert(null);
		}
	}, [isOpen]);

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Generate password">
			{/* Local Alert Overlay */}
			{localAlert && (
				<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60  p-4 text-center">
					<Alert
						variant={localAlert.type}
						title="Perhatian"
						onClose={() => setLocalAlert(null)}
						message={localAlert.message}
					/>
				</div>
			)}
			<div className="space-y-4">
				{/* Info Banner */}
				<div className="bg-[#b4bdff] p-3 rounded-md flex gap-3 items-center border-none shadow-sm">
					<div className="text-white flex-shrink-0">
						<InformationCircleIcon className="w-6 h-6" />
					</div>
					<p className="text-[13px] text-white leading-tight font-medium">
						Untuk membuat kata sandi baru, silakan tekan tombol "Generate
						Password". Setelah kata sandi berhasil dibuat, mohon serahkan
						hasilnya kepada pengguna.
					</p>
				</div>

				{/* Email */}
				<div className="space-y-1">
					<label className="text-sm font-medium text-gray-600">Email</label>
					<input
						value={userEmail || ""}
						disabled
						className="w-full p-2.5 border border-gray-300 rounded-md bg-[#e5e5e5] text-gray-700 outline-none"
					/>
				</div>

				{/* Generate Password */}
				<div className="space-y-1">
					<label className="text-sm font-medium text-gray-600">
						Generate Password
					</label>
					<div className="relative flex items-center">
						<input
							type="text"
							value={password}
							readOnly
							className="w-full p-2.5 pr-36 border border-gray-300 rounded-md bg-[#e5e5e5] text-gray-700 font-mono outline-none"
						/>
						<button
							onClick={isGenerated ? handleCopy : generatePassword}
							className="absolute right-0 top-0 bottom-0 px-4 bg-[#7586ff] text-white rounded-r-md hover:bg-[#6474ff] transition-colors text-sm font-medium min-w-[120px]"
						>
							{isGenerated
								? isCopied
									? "Copied!"
									: "Copy"
								: "Generate Password"}
						</button>
					</div>
				</div>

				{/* Confirm Password */}
				<div className="space-y-1">
					<label className="text-sm font-medium text-gray-600">
						Konfirmasi Password
					</label>
					<input
						type="text"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						className="w-full p-2.5 border border-gray-300 rounded-md outline-none focus:border-brand-400 placeholder-gray-400 text-gray-700"
						placeholder="Password..."
					/>
				</div>

				{/* Submit */}
				<div className="flex justify-end gap-3 pt-2">
					<button
						onClick={onClose}
						className="px-6 py-2 bg-[#ff976a] text-white rounded-md hover:bg-[#ff8550] transition-colors text-sm font-bold"
					>
						batal
					</button>
					<button
						onClick={handleSubmit}
						className={`px-6 py-2 rounded-md transition-colors text-sm font-bold ${
							password && confirmPassword
								? "bg-[#7586ff] text-white hover:bg-[#6474ff]"
								: "bg-[#bdbdbd] text-white cursor-not-allowed"
						}`}
					>
						Lanjut
					</button>
				</div>
			</div>
		</Modal>
	);
}
