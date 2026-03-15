import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
	Layout,
	Table,
	Alert,
	AlertBanner,
	StatsCard,
} from "../../lib/components";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { LOADING_DELAY, DEPARTMENTS } from "../../lib/constants";
import { useLoading } from "../../lib/LoadingContext";
import { api } from "../../lib/api";

export default function ManajemenAbsensiPage() {
	const [attendanceData, setAttendanceData] = useState([]);
	const { showLoading, hideLoading } = useLoading();
	const [totalCount, setTotalCount] = useState(0);
	const [stats, setStats] = useState({
		totalEmployees: 0,
		presentToday: 0,
	});
	const [params, setParams] = useState({
		page: 1,
		limit: 5,
		search: "",
		department: "",
		start_date: "",
		end_date: "",
	});
	const [debouncedSearch, setDebouncedSearch] = useState(params.search);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(params.search);
		}, 500);
		return () => clearTimeout(timer);
	}, [params.search]);

	useEffect(() => {
		fetchData(true);
	}, [debouncedSearch]);

	useEffect(() => {
		let ignore = false;
		const load = async () => {
			if (ignore) return;
			await fetchData(false);
		};
		load();
		return () => {
			ignore = true;
		};
	}, [
		params.page,
		params.limit,
		params.department,
		params.start_date,
		params.end_date,
		debouncedSearch,
	]);

	const fetchData = async (isSearch = false) => {
		if (!isSearch) showLoading("Memuat Data Absensi...");
		try {
			const minDelay = new Promise((resolve) =>
				setTimeout(resolve, LOADING_DELAY),
			);

			const [attendance, dashStats] = await Promise.all([
				api.getDashboardAttendance({
					...params,
					limit: 500,
					search: "",
				}),
				api.getDashboardStats().catch(() => ({})),
				minDelay,
			]);

			setStats({
				totalEmployees:
					dashStats.total_employees ?? dashStats.totalEmployees ?? 0,
				presentToday:
					dashStats.employees_present_today ??
					dashStats.present_today ??
					dashStats.presentToday ??
					0,
			});

			const rawData = Array.isArray(attendance.data) ? attendance.data : [];
			setTotalCount(attendance.total ?? rawData.length);
			console.log("[Attendance List Diagnostic]:", {
				firstItem: rawData[0],
				keys: rawData[0] ? Object.keys(rawData[0]) : [],
			});

			const mapped = rawData.map((item, i) => {
				const clockInTime = item.clock_in || item.clockIn;
				const clockOutTime = item.clock_out || item.clockOut;

				// Thresholds: In after 08:10 is late, Out before 17:00 is early
				const isLate = clockInTime && formatTime(clockInTime) > "08.10";
				const isEarlyOut = clockOutTime && formatTime(clockOutTime) < "17.00";

				return {
					no: (params.page - 1) * params.limit + (i + 1),
					name: item.full_name || item.employee_name || item.name || "-",
					nip: item.nik || item.nip || "-",
					date: formatDate(item.date || item.created_at),
					division: item.department || item.division || "-",
					clockIn: formatTime(clockInTime),
					clockOut: formatTime(clockOutTime),
					isLate,
					isEarlyOut,
					note:
						item.note ||
						item.notes ||
						item.reason ||
						item.early_clock_out_reason ||
						item.alasan ||
						item.keterangan ||
						"",
					_raw: item,
				};
			});
			setAttendanceData(mapped);
		} catch (error) {
			console.error("Error fetching attendance:", error);
		} finally {
			hideLoading();
		}
	};

	const handleParamsChange = (newParams) => {
		setParams((prev) => {
			if (
				prev.page === newParams.page &&
				prev.limit === newParams.pageSize &&
				prev.search === newParams.search
			)
				return prev;

			return {
				...prev,
				page: newParams.page,
				limit: newParams.pageSize,
				search: newParams.search,
			};
		});
	};

	const handleFilterChange = (key, value) => {
		setParams((prev) => ({
			...prev,
			[key]: value,
			page: 1,
		}));
	};

	const handleMultiFilterChange = (updates) => {
		setParams((prev) => ({
			...prev,
			...updates,
			page: 1,
		}));
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

	const isEarlyLeave = (formattedTime) => {
		if (!formattedTime || formattedTime === "-") return false;
		try {
			const [hour] = formattedTime.split(".").map(Number);
			return hour < 17;
		} catch {
			return false;
		}
	};

	const columns = useMemo(
		() => [
			{ header: "No", accessor: "no", className: "w-16" },
			{ header: "Nama karyawan", accessor: "name" },
			{ header: "NIP", accessor: "nip" },
			{
				header: "Tanggal",
				accessor: "date",
				filterType: "date",
			},
			{
				header: "Divisi",
				accessor: "division",
				filterType: "select",
				filterOptions: [
					{ label: "Semua Divisi", value: "" },
					...DEPARTMENTS.map((dept) => ({ label: dept, value: dept })),
				],
			},
			{
				header: "Jam Masuk",
				accessor: "clockIn",
				render: (row) => (
					<span className={`${row.isLate ? "text-danger font-medium" : ""}`}>
						{row.clockIn}
					</span>
				),
			},
			{
				header: "Jam Pulang",
				accessor: "clockOut",
				render: (row) => (
					<span
						className={`${row.isEarlyOut ? "text-danger font-medium" : ""}`}
					>
						{row.clockOut}
					</span>
				),
			},
			{
				header: "Alasan",
				accessor: "note",
				className: "min-w-[180px] max-w-[250px] break-words text-left",
				render: (row) => {
					let finalNote = row.note;
					if (!finalNote && row.isEarlyOut) {
						finalNote = `Debug: ${JSON.stringify(row._raw)}`;
					}
					return (
						<span
							className={
								finalNote ? "text-danger italic text-xs" : "text-gray-400"
							}
						>
							{finalNote || "-"}
						</span>
					);
				},
			},
		],
		[],
	);

	return (
		<Layout activeMenu="Manajemen absensi" title="Manajemen absensi">
			<div className="lg:p-8 p-4 space-y-8 w-full">
				<AlertBanner
					variant="info"
					message="Data absensi user dalam 1 bulan terakhir"
				/>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
					<StatsCard
						title="Total karyawan"
						value={String(stats.totalEmployees)}
						variant="info"
					/>
					<StatsCard
						title="Karyawan masuk hari ini"
						value={String(stats.presentToday)}
						variant="info"
					/>
				</div>

				<div className="space-y-4">
					<div className="flex justify-start">
						<h3 className="text-gray-600 font-medium text-lg">
							Manajemen absensi karyawan
						</h3>
					</div>
					<div>
						<Table
							columns={columns}
							data={attendanceData}
							manual={false} // Full Hybrid: instant client filters
							maxheight="620px"
							totalCount={attendanceData.length}
							pageSize={5}
							search={params.search}
							onFilterChange={(accessor, value) => {
								if (accessor === "division") {
									handleFilterChange("department", value);
								}
							}}
						/>
					</div>
				</div>
			</div>
		</Layout>
	);
}
