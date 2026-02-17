import { useState, useEffect } from "react";
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
} from "@heroicons/react/24/solid";
import { api } from "../../lib/api";

export default function ManajemenAkunPage() {
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
	const [createdUser, setCreatedUser] = useState(null);
	const [editingUser, setEditingUser] = useState(null);
	const [alert, setAlert] = useState(null);
	const [users, setUsers] = useState([]);
	const [deleteConfirm, setDeleteConfirm] = useState(null);
	const [unlockConfirm, setUnlockConfirm] = useState(null);
	const [isUnlockInProgress, setIsUnlockInProgress] = useState(false);

	useEffect(() => {
		fetchEmployees();
	}, []);

	const fetchEmployees = async () => {
		try {
			const employees = await api.getDashboardEmployees();
			const mapped = (Array.isArray(employees) ? employees : []).map(
				(item, i) => {
					// Cek berbagai kemungkinan nama field dari API (snake_case atau camelCase)
					const failedAttempts =
						item.failed_login_attempt ?? item.failedLoginAttempt ?? 0;
					const lockedUntil = item.locked_until ?? item.lockedUntil;

					// --- SIMULASI QA (HANYA UNTUK TESTING) ---
					// Paksa akun Budi Pratama jadi blokir agar QA bisa ngetes fitur Unlock & Badge Blokir
					const isBudi =
						item.full_name?.includes("Budi") ||
						item.employee_name?.includes("Budi");
					const isLocked = lockedUntil || failedAttempts >= 3 || isBudi;
					// -----------------------------------------

					return {
						id: item.id,
						no: i + 1,
						name:
							item.full_name ||
							item.fullName ||
							item.name ||
							item.employee_name ||
							"-",
						phone: item.phone || item.phone_number || item.no_hp || "-",
						nip: item.nik || item.nip || "-",
						email: item.email || "-",
						division: item.department || item.division || item.position || "-",
						approver: item.approved_by_name || item.approved_by || "-",
						status: isLocked ? "blokir" : item.status || "active",
						_raw: item,
					};
				},
			);
			setUsers(mapped);
		} catch (error) {
			console.error("Error fetching employees:", error);
		}
	};

	const handleDelete = async (user) => {
		setDeleteConfirm(user);
	};

	const confirmDelete = async () => {
		const user = deleteConfirm;
		setDeleteConfirm(null);
		try {
			await api.deleteEmployee(user.id);
			setAlert({
				type: "success",
				message: `Akun ${user.name} berhasil dihapus`,
			});
			fetchEmployees();
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
		setCreatedUser({
			id: user.id,
			name: user.name,
			email: user.email,
		});
		setIsUnlockInProgress(true);
		setIsPasswordModalOpen(true);
	};

	const columns = [
		{ header: "No", accessor: "no" },
		{ header: "Nama karyawan", accessor: "name" },
		{ header: "NIP", accessor: "nip" },
		{ header: "Email", accessor: "email" },
		{ header: "Divisi", accessor: "division" },
		{ header: "User approve", accessor: "approver" },
		{
			header: "Status",
			accessor: "status",
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
					{row.status === "blokir" && (
						<button
							className="p-1.5 rounded-lg bg-info text-white hover:bg-info-600 transition-all duration-200 active:scale-95 hover:shadow-md"
							onClick={() => handleUnlock(row)}
							title="Buka Gembok"
						>
							<LockOpenIcon className="w-5 h-5" />
						</button>
					)}
					<button
						className="p-1.5 rounded-lg bg-danger text-white hover:bg-danger-600 transition-all duration-200 active:scale-95 hover:shadow-md"
						onClick={() => handleDelete(row)}
						title="Hapus Akun"
					>
						<TrashIcon className="w-5 h-5" />
					</button>
					<button
						className="p-1.5 rounded-lg bg-brand text-white hover:bg-brand-700 transition-all duration-200 active:scale-95 hover:shadow-md"
						onClick={() => openEditModal(row)}
						title="Edit Akun"
					>
						<PencilSquareIcon className="w-5 h-5" />
					</button>
				</div>
			),
		},
	];

	// --- Create / Edit Account ---

	const handleAccountSubmit = async (data, setErrors) => {
		try {
			if (editingUser) {
				// Edit mode
				const payload = {
					full_name: data.name,
					phone: data.phone,
					department: data.division,
					position: data.division,
				};

				await api.updateEmployee(editingUser.id, payload);
				setAlert({
					type: "success",
					message: `Akun ${data.name} berhasil diperbarui`,
				});
				setIsCreateModalOpen(false);
				setEditingUser(null);
				fetchEmployees();
			} else {
				// Create mode (draft → lanjut ke password modal)
				const draftUser = {
					full_name: data.name,
					email: data.email,
					phone: data.phone,
					phone_number: data.phone,
					no_hp: data.phone,
					nik: data.nip,
					department: data.division,
					position: data.division,
					joined_at: new Date().toISOString(),
				};

				setCreatedUser(draftUser);
				setIsCreateModalOpen(false);
				setIsPasswordModalOpen(true);
			}
		} catch (error) {
			console.error(error);
			const msg = error.response?.data?.message || error.message;

			if (msg.includes("Duplicate entry") || msg.includes("1062")) {
				if (msg.includes("nik")) {
					setErrors({ nip: "NIP sudah digunakan" });
				} else if (msg.includes("email")) {
					setErrors({ email: "Email sudah digunakan" });
				} else {
					setAlert({ type: "error", message: `Gagal: ${msg}` });
				}
			} else {
				setAlert({ type: "error", message: `Gagal menyimpan: ${msg}` });
			}
		}
	};

	const openCreateModal = () => {
		setEditingUser(null);
		setIsCreateModalOpen(true);
	};

	const openEditModal = (user) => {
		setEditingUser(user);
		setIsCreateModalOpen(true);
	};

	// --- Set Password & Finalize ---

	const handleSetPassword = async (password) => {
		if (!createdUser) return;

		try {
			if (isUnlockInProgress) {
				// Unlock flow
				await api.unlockEmployee(createdUser.id, { password: password });

				setAlert({
					type: "success",
					message: `Akun ${createdUser.name} berhasil diaktifkan kembali dengan password baru.`,
				});
				setIsUnlockInProgress(false);
			} else {
				// Create flow
				const payload = {
					...createdUser,
					password: password,
				};

				await api.createEmployee(payload);

				setAlert({
					type: "success",
					message: "Akun berhasil dibuat dengan password",
				});
			}

			setIsPasswordModalOpen(false);
			setCreatedUser(null);
			fetchEmployees();
		} catch (error) {
			const msg = error.response?.data?.message || error.message;

			if (msg.includes("Duplicate entry") || msg.includes("1062")) {
				if (msg.includes("nik") || msg.includes("idx_employees_nik")) {
					setAlert({ type: "error", message: "NIP sudah terdaftar" });
				} else if (msg.includes("email")) {
					setAlert({ type: "error", message: "Email sudah terdaftar" });
				} else {
					setAlert({ type: "error", message: "Data duplikat ditemukan" });
				}
			} else {
				setAlert({
					type: "error",
					message: `Gagal ${isUnlockInProgress ? "membuka akun" : "membuat akun"}: ${msg}`,
				});
			}
		}
		setTimeout(() => setAlert(null), 3000);
	};

	return (
		<Layout activeMenu="Manajemen akun" title="Manajemen akun">
			<div className="p-8 space-y-6 w-full relative">
				{/* Alert */}
				{alert &&
					createPortal(
						<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
							<Alert
								variant={alert.type}
								title={alert.type === "success" ? "Berhasil" : "Gagal"}
								onClose={() => setAlert(null)}
								message={alert.message}
							/>
						</div>,
						document.body,
					)}

				<div className="space-y-4">
					<h3 className="text-gray-600 font-medium text-lg">
						Tambah akun karyawan
					</h3>
					<Button onClick={openCreateModal} variant="info">
						Tambah akun
					</Button>
				</div>

				<div className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-gray-600 font-medium text-lg">
							Manajemen akun karyawan
						</h3>
					</div>

					<div>
						<Table columns={columns} data={users} />
					</div>
				</div>

				{/* Modal 1: Create/Edit Account */}
				<CreateAccountModal
					isOpen={isCreateModalOpen}
					onClose={() => {
						setIsCreateModalOpen(false);
						setEditingUser(null);
					}}
					onSubmit={handleAccountSubmit}
					initialData={editingUser}
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

				{/* Delete Confirmation Overlay */}
				{deleteConfirm &&
					createPortal(
						<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
						<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-center">
							<Alert
								variant="question"
								title="Apakah anda yakin ingin menjadi aktif akun ini?"
								buttonText="Lanjut"
								cancelText="Batal"
								onConfirm={confirmUnlock}
								onCancel={() => setUnlockConfirm(null)}
								btnConfirmVariant="info"
								btnCancelVariant="danger"
							>
								Merubah akun menjadi aktif akan menyebabkan password pada user
								akan berganti
							</Alert>
						</div>,
						document.body,
					)}
			</div>
		</Layout>
	);
}

// --- Component: Create Account Modal ---
function CreateAccountModal({ isOpen, onClose, onSubmit, initialData }) {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
		nip: "",
		division: "",
	});
	const [errors, setErrors] = useState({});

	useEffect(() => {
		if (isOpen) {
			if (initialData) {
				const raw = initialData._raw || {};
				setFormData({
					name: raw.full_name || initialData.name || "",
					email: raw.email || initialData.email || "",
					phone:
						raw.phone ||
						raw.phone_number ||
						raw.no_hp ||
						initialData.phone ||
						"",
					nip: raw.nik || initialData.nip || "",
					division: raw.department || initialData.division || "",
				});

				// Fetch detail dari GET /employees/{id} untuk melengkapi data (termasuk phone)
				api
					.getEmployeeDetail(initialData.id)
					.then((detail) => {
						if (detail) {
							setFormData((prev) => ({
								...prev,
								phone: detail.phone || detail.phone_number || prev.phone,
								name: detail.full_name || prev.name,
								email: detail.email || prev.email,
								nip: detail.nik || prev.nip,
								division: detail.department || prev.division,
							}));
						}
					})
					.catch(() => {});
			} else {
				setFormData({
					name: "",
					email: "",
					phone: "",
					nip: "",
					division: "",
				});
			}
			setErrors({});
		}
	}, [isOpen, initialData]);

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

	const isEdit = !!initialData;

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={isEdit ? "Edit Akun" : "Akun Baru"}
		>
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

				{/* Phone */}
				<div className="space-y-1">
					<label className="text-sm font-medium text-gray-700">No. HP</label>
					<input
						name="phone"
						value={formData.phone}
						onChange={handleChange}
						className={getInputClass(errors.phone)}
						placeholder="08123456789"
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

				{/* Buttons */}
				<div className="flex justify-end gap-3 pt-4">
					<Button variant="danger" onClick={onClose}>
						Batal
					</Button>
					<Button variant="info" onClick={handleSubmit}>
						{isEdit ? "Simpan" : "Kirim"}
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
		navigator.clipboard.writeText(password);
		setIsCopied(true);
		setTimeout(() => setIsCopied(false), 2000);
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
				<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<Alert
						variant={localAlert.type}
						title="Perhatian"
						onClose={() => setLocalAlert(null)}
						message={localAlert.message}
					/>
				</div>
			)}
			<div className="space-y-4">
				{/* Info / Success Banner */}
				{isGenerated ? (
					<div className="bg-blue-100 p-3 rounded-lg flex gap-3 items-start border border-blue-200">
						<div className="text-blue-600 mt-0.5">
							<InformationCircleIcon className="w-5 h-5" />
						</div>
						<p className="text-sm text-blue-900 font-medium leading-relaxed">
							Password berhasil di generate, mohon serahkan hasilnya kepada
							pengguna.
						</p>
					</div>
				) : (
					<div className="bg-blue-50 p-3 rounded-lg flex gap-3 items-start border border-blue-100">
						<div className="text-blue-600 mt-0.5">
							<InformationCircleIcon className="w-5 h-5" />
						</div>
						<p className="text-xs text-blue-900 leading-relaxed">
							Untuk membuat kata sandi baru, silakan tekan tombol "Generate
							Password". Setelah kata sandi berhasil dibuat, mohon serahkan
							hasilnya kepada pengguna.
						</p>
					</div>
				)}

				{/* Email */}
				<div className="space-y-1">
					<label className="text-sm font-medium text-gray-700">Email</label>
					<input
						value={userEmail || ""}
						disabled
						className="w-full p-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-500"
					/>
				</div>

				{/* Generate Password */}
				<div className="space-y-1">
					<label className="text-sm font-medium text-gray-700">
						{isGenerated ? "Password tergenerate" : "Generate Password"}
					</label>
					<div className="flex gap-2">
						{isGenerated ? (
							<>
								<input
									value={password}
									readOnly
									className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900"
								/>
								<Button
									variant={isCopied ? "success" : "primary"}
									onClick={handleCopy}
									className="whitespace-nowrap bg-indigo-500 hover:bg-indigo-700 transition-all duration-200 active:scale-95"
								>
									{isCopied ? "Copied!" : "Copy"}
								</Button>
							</>
						) : (
							<Button
								variant="primary"
								onClick={generatePassword}
								className="w-full bg-brand hover:bg-brand-700"
							>
								Generate Password
							</Button>
						)}
					</div>
				</div>

				{/* Konfirmasi Password */}
				<div className="space-y-1">
					<label className="text-sm font-medium text-gray-700">
						Konfirmasi Password
					</label>
					<input
						value={confirmPassword}
						onChange={(e) => {
							setConfirmPassword(e.target.value);
							setLocalAlert(null);
						}}
						placeholder="Password..."
						className="w-full p-3 text-black border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand transition-all"
					/>
				</div>

				{/* Buttons */}
				<div className="flex justify-end gap-3 pt-4">
					<Button variant="danger" onClick={onClose}>
						Batal
					</Button>
					<Button variant="info" onClick={handleSubmit}>
						Lanjut
					</Button>
				</div>
			</div>
		</Modal>
	);
}
