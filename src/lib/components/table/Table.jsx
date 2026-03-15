import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import { FunnelIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { DateInput } from "../datepicker/DateInput";
import { Alert } from "../alert/Alert";

// Helper for date formatting
const toYYYYMMDD = (date) => {
	if (!date) return "";
	const d = new Date(date);
	if (isNaN(d.getTime())) return "";
	const year = d.getFullYear();
	const month = (d.getMonth() + 1).toString().padStart(2, "0");
	const day = d.getDate().toString().padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const toDate = (str) => {
	if (!str) return null;
	const d = new Date(str);
	return isNaN(d.getTime()) ? null : d;
};

// ─── Internal: Filter Popup ───────────────────────────────────────────────────
function FilterPopup({ col, filterValues, onFilterChange, onClose }) {
	if (col.filterType === "date") {
		const isRange = col.isRange ?? false;
		const currentStart = filterValues[col.accessor]?.start || "";
		const currentEnd = filterValues[col.accessor]?.end || "";

		return (
			<div
				className={`flex flex-col gap-3 p-4 ${isRange ? "min-w-[280px]" : "min-w-[240px]"} bg-white rounded-xl`}
			>
				{/* Input DARI */}
				<div className="space-y-1">
					<label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
						{isRange ? "DARI" : "PILIH TANGGAL"}
					</label>
					<DateInput
						value={toDate(currentStart)}
						placeholder="Pilih Tanggal"
						onChange={(val) =>
							onFilterChange(col.accessor, {
								start: toYYYYMMDD(val),
								end: currentEnd,
							})
						}
					/>
				</div>

				{/* Input SAMPAI */}
				{isRange && (
					<div className="space-y-1">
						<label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
							SAMPAI (OPSIONAL)
						</label>
						<DateInput
							value={toDate(currentEnd)}
							minDate={toDate(currentStart)}
							placeholder="Pilih Tanggal"
							onChange={(val) =>
								onFilterChange(col.accessor, {
									start: currentStart,
									end: toYYYYMMDD(val),
								})
							}
						/>
					</div>
				)}

				<button
					className="mt-2 text-[11px] font-bold text-brand hover:text-brand-700 hover:underline transition-colors text-right w-full"
					onClick={() => {
						onFilterChange(col.accessor, { start: "", end: "" });
					}}
				>
					Reset Filter
				</button>
			</div>
		);
	}

	if (col.filterType === "select" && col.filterOptions) {
		return (
			<ul className="py-1">
				{col.filterOptions.map((opt, i) => (
					<li key={i}>
						<button
							onClick={() => {
								onFilterChange(col.accessor, opt.value);
								onClose();
							}}
							className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
						>
							{opt.label}
						</button>
					</li>
				))}
			</ul>
		);
	}

	return null;
}

// ─── Internal: Filter Dropdown (portal-based to avoid overflow clipping) ──────
function FilterDropdown({ col, filterValues, onFilterChange }) {
	const [isOpen, setIsOpen] = useState(false);
	const [pos, setPos] = useState({});
	const triggerRef = useRef(null);

	const isActive = (() => {
		const val = filterValues[col.accessor];
		if (!val) return false;
		if (typeof val === "object") return !!(val.start || val.end);
		return val !== "";
	})();

	useEffect(() => {
		if (isOpen && triggerRef.current) {
			const r = triggerRef.current.getBoundingClientRect();
			const menuW = col.filterType === "date" ? 280 : 176;
			let left = r.left;
			if (left + menuW > window.innerWidth - 8) left = r.right - menuW;
			setPos({ top: r.bottom + 4, left, minWidth: menuW, zIndex: 9999 });
		}
	}, [isOpen, col.filterType]);

	useEffect(() => {
		if (!isOpen) return;
		const close = () => setIsOpen(false);
		window.addEventListener("scroll", close, true);
		return () => window.removeEventListener("scroll", close, true);
	}, [isOpen]);

	return (
		<div className="relative inline-block">
			<button
				ref={triggerRef}
				onClick={(e) => {
					e.stopPropagation();
					setIsOpen((o) => !o);
				}}
				className={`p-1.5 rounded-lg transition-all duration-200 group ${
					isActive
						? "bg-amber-400 text-white shadow-lg scale-105"
						: "hover:bg-white/20 text-white"
				}`}
				title={isActive ? "Filter aktif — klik untuk ubah" : "Filter"}
			>
				<FunnelIcon
					className={`w-4 h-4 transition-transform group-hover:rotate-12 ${
						isActive ? "fill-current" : ""
					}`}
				/>
			</button>

			{/* Backdrop */}
			{isOpen &&
				createPortal(
					<div
						className="fixed inset-0 cursor-default"
						style={{ zIndex: 9998 }}
						onClick={() => setIsOpen(false)}
					/>,
					document.body,
				)}

			{/* Popup menu — via portal so it's never clipped */}
			{isOpen &&
				createPortal(
					<div
						style={{ position: "fixed", ...pos }}
						className="bg-white border border-gray-200 rounded-xl shadow-2xl animate-in fade-in"
						onClick={(e) => e.stopPropagation()}
					>
						<FilterPopup
							col={col}
							filterValues={filterValues}
							onFilterChange={onFilterChange}
							onClose={() => setIsOpen(false)}
						/>
					</div>,
					document.body,
				)}
		</div>
	);
}

// ─── Main Table Component ─────────────────────────────────────────────────────
export function Table({
	columns = [],
	data = [],
	maxheight = "400px",
	manual = false,
	totalCount = 0,
	onParamsChange = null,
	onFilterChange = null, // opsional: (accessor, value) => void — dipanggil saat filter berubah
	currentPage: externalCurrentPage = 1,
	pageSize: externalPageSize = 5,
	search: externalSearch = "",
}) {
	const [internalCurrentPage, setInternalPage] = useState(externalCurrentPage);
	const [internalPageSize, setInternalPageSize] = useState(externalPageSize);
	const [internalSearch, setInternalSearch] = useState(externalSearch);
	const [isSimulatingLoading, setIsSimulatingLoading] = useState(false);
	const [filterValues, setFilterValues] = useState({});

	// Internal Debounce for onParamsChange
	useEffect(() => {
		if (onParamsChange && manual) {
			const timer = setTimeout(() => {
				if (internalSearch !== externalSearch) {
					onParamsChange({
						page: 1,
						pageSize: internalPageSize,
						search: internalSearch,
					});
				}
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [
		internalSearch,
		onParamsChange,
		manual,
		externalSearch,
		internalPageSize,
	]);

	// Sync only Page and PageSize from outside
	useEffect(() => {
		setInternalPageSize(externalPageSize);
	}, [externalPageSize]);

	useEffect(() => {
		setInternalPage(externalCurrentPage);
	}, [externalCurrentPage]);

	// Search sync - only if external search changes significantly (e.g. cleared from outside)
	useEffect(() => {
		if (externalSearch !== internalSearch) {
			setInternalSearch(externalSearch);
		}
	}, [externalSearch]);

	const isManual = manual && onParamsChange;
	const isSearching = !!(
		internalSearch || Object.keys(filterValues).length > 0
	);

	// Use effective values (internal when searching, otherwise follow prop if manual)
	const search = internalSearch;
	const pageSize =
		isManual && !isSearching ? externalPageSize : internalPageSize;
	const currentPage =
		isManual && !isSearching ? externalCurrentPage : internalCurrentPage;

	// Handle filter change
	const handleFilterChange = (accessor, value) => {
		setFilterValues((prev) => ({
			...prev,
			[accessor]: value,
		}));
		if (onFilterChange) onFilterChange(accessor, value);
		// Reset ke halaman 1
		if (isManual) {
			onParamsChange({ page: 1, pageSize, search });
		} else {
			setInternalPage(1);
		}
	};

	// Filter Data (Hybrid: Matches API results AND refines client-side)
	const filteredData = useMemo(() => {
		let result = data;

		// Apply column-level filters (only if not manual or if we want client refinement)
		if (!isManual) {
			columns.forEach((col) => {
				const val = filterValues[col.accessor];
				if (!val) return;

				if (col.filterType === "date" && (val.start || val.end)) {
					result = result.filter((row) => {
						const raw = row.start_date || row.date_raw || row[col.accessor];
						if (!raw) return false;
						const d = new Date(raw);
						if (isNaN(d.getTime())) return true;
						const rowDate = new Date(
							d.getFullYear(),
							d.getMonth(),
							d.getDate(),
						).getTime();
						const startDate = val.start
							? new Date(val.start + "T00:00:00").getTime()
							: null;
						const endDate = val.end
							? new Date(val.end + "T00:00:00").getTime()
							: null;

						if (startDate && endDate)
							return rowDate >= startDate && rowDate <= endDate;

						if (startDate) {
							if (col.isRange) {
								return rowDate >= startDate;
							} else {
								// Exact day match for single date input
								return rowDate === startDate;
							}
						}

						if (endDate) return rowDate <= endDate;
						return true;
					});
				}

				if (
					col.filterType === "select" &&
					val !== undefined &&
					val !== null &&
					val !== ""
				) {
					result = result.filter((row) => {
						const rowVal = row[col.accessor];
						if (rowVal === undefined || rowVal === null) return false;
						return (
							String(rowVal).trim().toLowerCase() ===
							String(val).trim().toLowerCase()
						);
					});
				}
			});
		}

		// Apply global search (Hybrid: Refines what the API returns)
		if (search) {
			const lowerSearch = search.toLowerCase();
			result = result.filter((row) =>
				columns.some((col) => {
					// Check accessor AND common name fields for robustness
					const valuesToSearch = [
						row[col.accessor],
						row.name,
						row.full_name,
						row.employee_name,
						row.fullName,
						row.display_name,
					];
					return valuesToSearch.some(
						(v) => v && v.toString().toLowerCase().includes(lowerSearch),
					);
				}),
			);
		}

		return result;
	}, [data, search, columns, filterValues, isManual]);

	// Paginate Data (Hybrid: Uses server count normally, client count when searching)

	const totalPages =
		isManual && !isSearching
			? Math.ceil(totalCount / pageSize)
			: Math.ceil(filteredData.length / pageSize);

	const paginatedData = useMemo(() => {
		// In hybrid mode, if there's an active search, we do the paging locally
		if (isSearching) {
			const start = (currentPage - 1) * pageSize;
			return filteredData.slice(start, start + pageSize);
		}

		if (isManual) return data;
		const start = (currentPage - 1) * pageSize;
		return filteredData.slice(start, start + pageSize);
	}, [filteredData, currentPage, pageSize, isManual, data, isSearching]);

	// Handlers
	const handlePageChange = (page) => {
		if (page >= 1 && (totalPages === 0 || page <= totalPages)) {
			if (isManual && !isSearching) {
				onParamsChange({ page, pageSize, search });
			} else {
				setInternalPage(page);
			}
		}
	};

	const handleSearchChange = (value) => {
		setInternalSearch(value);
		setInternalPage(1);
	};

	const itemsCount =
		isManual && !isSearching ? totalCount : filteredData.length;

	const showingStart = itemsCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
	const showingEnd =
		itemsCount > 0
			? isManual
				? Math.min(showingStart + data.length - 1, totalCount)
				: Math.min(currentPage * pageSize, filteredData.length)
			: 0;

	return (
		<div className="w-full space-y-4 font-sans">
			{/* Controls Top */}
			<div className="flex flex-col sm:flex-row justify-between items-center gap-4">
				<div className="relative group/search w-full sm:w-64">
					<input
						type="text"
						placeholder="Cari..."
						className="pl-8 pr-10 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand w-full text-black outline-none transition-all shadow-sm"
						value={internalSearch}
						onChange={(e) => handleSearchChange(e.target.value)}
					/>
					<MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
					{internalSearch && (
						<button
							type="button"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								handleSearchChange("");
							}}
							className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400 transition-all active:scale-90 z-20"
						>
							<XCircleIcon className="w-4.5 h-4.5" />
						</button>
					)}
				</div>

				<div className="flex items-center gap-2 text-sm text-gray-600 pr-2">
					<span>Show data</span>
					<select
						className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-brand bg-white"
						value={pageSize}
						onChange={(e) => {
							const newSize = Number(e.target.value);
							if (isManual) {
								onParamsChange({ page: 1, pageSize: newSize, search });
							} else {
								setInternalPageSize(newSize);
								setInternalPage(1);
							}
						}}
					>
						{[5, 10, 25, 50].map((size) => (
							<option key={size} value={size}>
								{size}
							</option>
						))}
					</select>
					<span>entries</span>
				</div>
			</div>

			{/* Table */}
			<div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 relative">
				{isSimulatingLoading &&
					createPortal(
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 ">
							<Alert variant="loading" title="Memuat Data..." shadow={true} />
						</div>,
						document.body,
					)}
				<div
					className="overflow-y-auto overflow-x-auto scroll-smooth"
					style={{ maxHeight: maxheight }}
				>
					<table className="w-full text-sm text-center border-collapse table-auto">
						<thead className="text-white bg-brand sticky top-0 z-10 shadow-sm">
							<tr className="h-12">
								{columns.map((col, index) => (
									<th
										key={index}
										className="px-6 py-4 font-semibold tracking-wide last:border-r-0 whitespace-nowrap text-center"
									>
										<div className="flex items-center justify-center gap-1 w-full text-center">
											<span>{col.header}</span>
											{(col.filterType === "date" ||
												col.filterType === "select") && (
												<FilterDropdown
													col={col}
													filterValues={filterValues}
													onFilterChange={handleFilterChange}
												/>
											)}
										</div>
									</th>
								))}
							</tr>
						</thead>
						<tbody className="text-gray-700 bg-white">
							{paginatedData.length > 0 ? (
								paginatedData.map((row, rowIndex) => (
									<tr
										key={rowIndex}
										className="bg-white border-b border-gray-100 hover:bg-brand-100/30 transition-all duration-200 h-[62px]"
									>
										{columns.map((col, colIndex) => (
											<td
												key={colIndex}
												className={`px-6 py-2 wrap-break-word whitespace-normal text-center ${
													col.className || ""
												}`}
											>
												{col.render
													? col.render(row)
													: col.accessor === "no"
														? (currentPage - 1) * pageSize + rowIndex + 1
														: row[col.accessor]}
											</td>
										))}
									</tr>
								))
							) : (
								<tr>
									<td
										colSpan={columns.length}
										className="px-6 py-8 text-center text-gray-400 italic h-[62px]"
									>
										Tidak ada data yang cocok.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Controls Bottom (Pagination) */}
			<div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
				<div>
					Showing {itemsCount > 0 ? showingStart : 0} to {showingEnd} of{" "}
					{itemsCount} entries
				</div>

				{totalPages > 0 && (
					<div className="flex items-center gap-1">
						<button
							className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 active:scale-90 transition-all duration-200"
							onClick={() => handlePageChange(currentPage - 1)}
							disabled={currentPage === 1}
						>
							<ChevronLeftIcon className="w-5 h-5 text-gray-600" />
						</button>

						{/* Simple Pagination Numbers */}
						{Array.from({ length: totalPages }, (_, i) => i + 1)
							.filter(
								(page) =>
									Math.abs(page - currentPage) <= 1 ||
									page === 1 ||
									page === totalPages,
							)
							.reduce((acc, page, idx, src) => {
								if (idx > 0 && page - src[idx - 1] > 1) acc.push("...");
								acc.push(page);
								return acc;
							}, [])
							.map((page, idx) =>
								typeof page === "number" ? (
									<button
										key={idx}
										className={`px-3 py-1 rounded transition-all duration-200 active:scale-95 ${
											currentPage === page
												? "bg-brand text-white font-medium shadow-md scale-110"
												: "hover:bg-gray-100"
										}`}
										onClick={() => handlePageChange(page)}
									>
										{page}
									</button>
								) : (
									<span key={idx} className="px-1">
										...
									</span>
								),
							)}

						<button
							className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 active:scale-95 transition-all duration-200"
							onClick={() => handlePageChange(currentPage + 1)}
							disabled={totalPages === 0 || currentPage >= totalPages}
						>
							<ChevronRightIcon className="w-5 h-5 text-gray-600" />
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
