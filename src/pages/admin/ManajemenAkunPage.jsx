import { useState } from "react";
import {
	Layout,
	Table,
	Button,
	Badge,
	Alert,
	Modal,
	Input,
} from "../../lib/components";
import {
	PencilSquareIcon,
	TrashIcon,
	PlusIcon,
} from "@heroicons/react/24/solid";

export default function ManajemenAkunPage() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: '' }

	// Mock Data
	const [users, setUsers] = useState([
		{
			no: 1,
			name: "Rizki",
			nip: "N.1924.1003",
			email: "Rizki@gmail.com",
			division: "UI/UX Designer",
			approver: "Admin09",
			status: "active",
		},
		{
			no: 2,
			name: "Ariandi",
			nip: "N.1924.1003",
			email: "Ariandi@gmail.com",
			division: "IT OPS",
			approver: "Admin01",
			status: "active",
		},
		{
			no: 3,
			name: "Raffi",
			nip: "N.1924.1003",
			email: "Raffi@gmail.com",
			division: "System Analyst",
			approver: "Admin09",
			status: "blocked",
		},
		{
			no: 4,
			name: "Fandi",
			nip: "N.1924.1003",
			email: "Fandi@gmail.com",
			division: "QA",
			approver: "Admin01",
			status: "blocked",
		},
		{
			no: 5,
			name: "Anton",
			nip: "N.1924.1003",
			email: "Anton@gmail.com",
			division: "System Analyst",
			approver: "Admin01",
			status: "blocked",
		},
	]);

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
				<Badge variant={row.status === "active" ? "approve" : "reject"}>
					{row.status === "active" ? "Active" : "Blokir"}
				</Badge>
			),
		},
		{
			header: "Action",
			accessor: "action",
			render: () => (
				<div className="flex gap-2 justify-center">
					<button className="p-1 rounded bg-danger text-white hover:bg-danger-600">
						<TrashIcon className="w-5 h-5" />
					</button>
					<button className="p-1 rounded bg-brand text-white hover:bg-brand-600">
						<PencilSquareIcon className="w-5 h-5" />
					</button>
				</div>
			),
		},
	];

	const handleCreateAccount = (data) => {
		// Simulation of validation logic from user request
		// "Email sudah terdaftar", "NIP sudah terdaftar"
		const emailExists = users.some(
			(u) => u.email.toLowerCase() === data.email.toLowerCase(),
		);
		const nipExists = users.some((u) => u.nip === data.nip);

		if (emailExists) {
			setAlert({ type: "error", message: "Email sudah terdaftar" });
			return;
		}
		if (nipExists) {
			setAlert({ type: "error", message: "NIP sudah terdaftar" });
			return;
		}

		// Success
		const newUser = {
			no: users.length + 1,
			name: data.name,
			nip: data.nip,
			email: data.email,
			division: data.division,
			approver: "Admin01", // Mock current admin
			status: "active",
		};

		setUsers([...users, newUser]);
		setAlert({ type: "success", message: "Pembuatan berhasil" });
		setIsModalOpen(false);
	};

	return (
		<Layout activeMenu="Manajemen akun" title="Manajemen akun">
			<div className="p-8 space-y-6 w-full relative">
				{/* Alert Simulation (Top Right or Toast?) using existing Alert component */}
				{alert && (
					<div className="fixed top-20 right-8 z-50 w-80 animate-in slide-in-from-right duration-300">
						<Alert
							variant={alert.type}
							title={alert.type === "success" ? "Berhasil" : "Gagal"}
							message={alert.message}
							onClose={() => setAlert(null)}
						/>
					</div>
				)}

				<div className="space-y-4">
					<h3 className="text-gray-600 font-medium text-lg">
						Tambah akun karyawan
					</h3>
					<Button onClick={() => setIsModalOpen(true)} variant="info">
						Tambah akun
					</Button>
				</div>

				<div className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-gray-600 font-medium text-lg">
							Manajemen akun karyawan
						</h3>
						{/* Search handling is done by Table component */}
					</div>

					<div>
						<Table columns={columns} data={users} />
					</div>
				</div>

				<CreateAccountModal
					isOpen={isModalOpen}
					onClose={() => setIsModalOpen(false)}
					onSubmit={handleCreateAccount}
				/>
			</div>
		</Layout>
	);
}

function CreateAccountModal({ isOpen, onClose, onSubmit }) {
	const [formData, setFormData] = useState({
		name: "",
		username: "",
		email: "",
		nip: "",
		division: "",
	});
	const [errors, setErrors] = useState({});

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		// Clear error when user types
		if (errors[name]) {
			setErrors((prev) => ({ ...prev, [name]: "" }));
		}
	};

	const validate = () => {
		const newErrors = {};
		if (!formData.name) newErrors.name = "Nama wajib diisi";
		// if (!formData.username) newErrors.username = "Nama user wajib diisi"; // Username not in form UI currently, let's skip or add? In previous step I saw 'name' input placeholder 'Nama user'.
		if (!formData.email) {
			newErrors.email = "Email wajib diisi";
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = "Email tidak valid";
		}
		if (!formData.nip) newErrors.nip = "NIP wajib diisi";
		if (!formData.division) newErrors.division = "Divisi wajib dipilih";

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = () => {
		if (validate()) {
			onSubmit(formData);
			handleClose();
		}
	};

	const handleClose = () => {
		setFormData({
			name: "",
			username: "",
			email: "",
			nip: "",
			division: "",
		});
		setErrors({});
		onClose();
	};

	const divisionOptions = [
		{ label: "UI/UX Designer", value: "UI/UX Designer" },
		{ label: "IT OPS", value: "IT OPS" },
		{ label: "System Analyst", value: "System Analyst" },
		{ label: "QA", value: "QA" },
		{ label: "HR", value: "HR" },
	];

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title="Akun Baru">
			<div className="space-y-4">
				{/* Nama */}
				<Input
					label="Nama"
					name="name"
					value={formData.name}
					onChange={handleChange}
					placeholder="Nama user"
					error={errors.name}
				/>

				{/* Email */}
				<Input
					label="Email"
					type="email"
					name="email"
					value={formData.email}
					onChange={handleChange}
					placeholder="Email"
					error={errors.email}
				/>

				{/* NIP */}
				<Input
					label="NIP"
					name="nip"
					value={formData.nip}
					onChange={handleChange}
					placeholder="NIP"
					error={errors.nip}
				/>

				{/* Divisi */}
				<div className="flex flex-col gap-2 w-full">
					<label className="text-sm font-medium text-gray-700">Divisi</label>
					<select
						name="division"
						value={formData.division}
						onChange={handleChange}
						className={`w-full bg-white text-gray-900 placeholder-gray-400 transition-all duration-300 ease-out px-4 py-3 border rounded-xl outline-none ${
							errors.division
								? "border-danger focus:ring-danger-100 focus:border-danger"
								: "border-gray-300 hover:border-gray-400 focus:border-info focus:ring-1 focus:ring-info"
						}`}
					>
						<option value="">Divisi</option>
						{divisionOptions.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
					{errors.division && (
						<p className="text-xs text-danger">{errors.division}</p>
					)}
				</div>

				{/* Buttons */}
				<div className="flex justify-end gap-3 pt-4">
					<Button variant="danger" onClick={handleClose}>
						Batal
					</Button>
					<Button variant="primary" onClick={handleSubmit}>
						Kirim
					</Button>
				</div>
			</div>
		</Modal>
	);
}
