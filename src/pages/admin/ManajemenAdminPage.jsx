import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { Layout, Table, Alert } from "../../lib/components";
import {
	ArrowUturnDownIcon,
	InformationCircleIcon,
} from "@heroicons/react/24/solid";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import { useLoading } from "../../lib/LoadingContext";
import { LOADING_DELAY, USER_ROLES } from "../../lib/constants";

export default function ManajemenAdminPage() {
	const navigate = useNavigate();
	const { user: currentUser } = useAuth();
	const { showLoading, hideLoading } = useLoading();
	const [users, setUsers] = useState([]);
	const [alert, setAlert] = useState(null);
	const [confirmAction, setConfirmAction] = useState(null);

	const [params, setParams] = useState({
		page: 1,
		limit: 5,
		search: "",
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
		fetchUsers(true);
	}, [debouncedSearch]);

	useEffect(() => {
		fetchUsers(false);
	}, [params.page, params.limit]);

	const fetchUsers = async (isSearch = false) => {
		if (!isSearch) showLoading("Memuat Data Admin...");
		try {
			const minDelay = new Promise((resolve) =>
				setTimeout(resolve, LOADING_DELAY),
			);

			const [response] = await Promise.all([
				api.getAdmins({
					page: params.page,
					limit: params.limit,
					search: debouncedSearch,
				}),
				minDelay,
			]);

			setTotalCount(response.total || 0);

			const mapped = response.data.map((item, i) => ({
				id: item.id,
				no: (params.page - 1) * params.limit + (i + 1),
				name:
					item.full_name ||
					item.name ||
					item.fullName ||
					item.employee_name ||
					item.employeeName ||
					"-",
				nip: item.nik || item.nip || item.employee_id || item.employeeId || "-",
				email: item.email || "-",
				role: item.role,
				approver: "Super admin",
				_raw: item,
			}));

			setUsers(mapped);
		} catch (error) {
			console.error("Error fetching admins:", error);
		} finally {
			hideLoading();
		}
	};

	const handleDemote = async (user) => {
		setConfirmAction({
			user,
			title: "Berhentikan sebagai admin?",
		});
	};

	const confirmRoleChange = async () => {
		const { user } = confirmAction;
		setConfirmAction(null);
		setAlert({ type: "loading", message: "Processing demotion..." });

		try {
			// 1. Fetch full details first to ensure we have all required fields
			const fullDetail = await api.getEmployeeDetail(user.id);

			// 2. Map payload carefully using multiple field aliases and fallbacks
			// The backend requires: name, email, phone, department, role
			const payload = {
				name:
					fullDetail.full_name ||
					fullDetail.fullName ||
					fullDetail.name ||
					fullDetail.employee_name ||
					user.name ||
					"-",
				email: fullDetail.email || user.email || "-",
				phone: String(
					fullDetail.phone_number ||
						fullDetail.phone ||
						fullDetail.no_hp ||
						fullDetail.phoneNumber ||
						"080000000000",
				),
				department:
					fullDetail.department ||
					fullDetail.division ||
					fullDetail.position ||
					"General",
				role: "employee",
			};

			console.log("[Demote Profile] Selected User ID:", user.id);
			console.log("[Demote Profile] Sending Strict Payload:", payload);

			await api.updateEmployee(user.id, payload);
			setAlert({
				type: "success",
				message: `Akun ${payload.name} berhasil diturunkan menjadi employee`,
			});
			fetchUsers();
		} catch (error) {
			console.error("[Demote Error]:", error);
			setAlert({
				type: "error",
				message: `Gagal memproses: ${error.message}`,
			});
		}
		setTimeout(() => setAlert(null), 3000);
	};

	const columns = useMemo(
		() => [
			{ header: "No", accessor: "no", className: "w-20 text-center" },
			{ header: "Nama karyawan", accessor: "name", className: "min-w-[200px]" },
			{ header: "NIP", accessor: "nip", className: "min-w-[150px]" },
			{ header: "Email", accessor: "email", className: "min-w-[200px]" },
			{
				header: "Role",
				accessor: "role",
				className: "text-center w-32",
				render: (row) => <span className="capitalize">{row.role}</span>,
			},
			{
				header: "User approve",
				accessor: "approver",
				className: "text-center w-40",
			},
			{
				header: "Action",
				accessor: "action",
				className: "text-center w-32",
				render: (row) => (
					<div className="flex justify-center">
						<button
							className="p-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-all duration-200 active:scale-95 shadow-sm"
							onClick={() => handleDemote(row)}
							title="Demote to Employee"
						>
							<ArrowUturnDownIcon className="w-5 h-5" />
						</button>
					</div>
				),
			},
		],
		[],
	);

	return (
		<Layout activeMenu="Manajemen admin" title="Manajemen admin">
			<div className="lg:p-8 p-4 space-y-6">
				<div>
					<div className="mb-5  border-b border-gray-50">
						<h3 className="text-lg font-bold text-gray-700">Manajemen admin</h3>
					</div>
					<div>
						<Table
							columns={columns}
							data={users}
							manual={true}
							totalCount={totalCount}
							currentPage={params.page}
							pageSize={params.limit}
							search={params.search}
							onParamsChange={(newParams) => {
								setParams((prev) => ({
									...prev,
									page: newParams.page,
									limit: newParams.pageSize,
									search: newParams.search,
								}));
							}}
						/>
					</div>
				</div>
			</div>

			{/* Demote Confirmation Modal */}
			{confirmAction &&
				createPortal(
					<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60  p-4 text-center">
						<Alert
							variant="question"
							title={confirmAction.title}
							message={confirmAction.message}
							buttonText="Lanjut"
							cancelText="Batal"
							onConfirm={confirmRoleChange}
							onCancel={() => setConfirmAction(null)}
							btnConfirmVariant="danger"
						/>
					</div>,
					document.body,
				)}

			{/* Alert Overlay */}
			{alert &&
				createPortal(
					<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4">
						<Alert
							variant={alert.type}
							message={alert.message}
							onClose={() => setAlert(null)}
							showCloseIcon={false}
						/>
					</div>,
					document.body,
				)}
		</Layout>
	);
}
