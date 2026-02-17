import { useState, useMemo } from "react";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";

export function Table({ columns = [], data = [], maxheight = "500px" }) {
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(5);
	const [search, setSearch] = useState("");

	// Filter Data
	const filteredData = useMemo(() => {
		return data.filter((row) =>
			columns.some((col) => {
				const val = row[col.accessor];
				return (
					val && val.toString().toLowerCase().includes(search.toLowerCase())
				);
			}),
		);
	}, [data, search, columns]);

	// Paginate Data
	const totalPages = Math.ceil(filteredData.length / pageSize);
	const paginatedData = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredData.slice(start, start + pageSize);
	}, [filteredData, currentPage, pageSize]);

	// Pagination Handlers
	const handlePageChange = (page) => {
		if (page >= 1 && page <= totalPages) {
			setCurrentPage(page);
		}
	};

	const showingStart = (currentPage - 1) * pageSize + 1;
	const showingEnd = Math.min(currentPage * pageSize, filteredData.length);

	return (
		<div className="w-full space-y-4">
			{/* Controls Top */}
			<div className="flex flex-col sm:flex-row justify-between items-center gap-4">
				<div className="flex items-center gap-2 text-sm text-gray-600">
					<span>Show data</span>
					<select
						className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-brand"
						value={pageSize}
						onChange={(e) => {
							setPageSize(Number(e.target.value));
							setCurrentPage(1);
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

				<div className="relative">
					<input
						type="text"
						placeholder="Cari..."
						className="pl-8 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand w-full sm:w-64 text-black"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					<MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
				</div>
			</div>

			{/* Table */}
			<div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
				<div
					className="overflow-y-auto overflow-x-auto no-scrollbar"
					style={{ maxHeight: maxheight }}
				>
					<table className="w-full text-sm text-left border-collapse">
						<thead className="text-white bg-brand sticky top-0 z-10 shadow-sm">
							<tr>
								{columns.map((col, index) => (
									<th
										key={index}
										className="px-6 py-4 font-semibold tracking-wide border-r border-brand-400 last:border-r-0 whitespace-nowrap text-center"
									>
										{col.header}
									</th>
								))}
							</tr>
						</thead>
						<tbody className="text-gray-700">
							{paginatedData.length > 0 ? (
								paginatedData.map((row, rowIndex) => (
									<tr
										key={rowIndex}
										className="bg-white border-b border-gray-100 hover:bg-brand-100/30 transition-all duration-200"
									>
										{columns.map((col, colIndex) => (
											<td
												key={colIndex}
												className="px-6 py-4 whitespace-nowrap text-center"
											>
												{col.render ? col.render(row) : row[col.accessor]}
											</td>
										))}
									</tr>
								))
							) : (
								<tr>
									<td
										colSpan={columns.length}
										className="px-6 py-8 text-center text-gray-400 italic"
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
					Showing {filteredData.length > 0 ? showingStart : 0} to {showingEnd}{" "}
					of {filteredData.length} entries
				</div>

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
						// Logic to show limited pages can be added here, but for now show all if not too many
						.filter(
							(page) =>
								Math.abs(page - currentPage) <= 2 ||
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
						disabled={currentPage >= totalPages}
					>
						<ChevronRightIcon className="w-5 h-5 text-gray-600" />
					</button>
				</div>
			</div>
		</div>
	);
}
