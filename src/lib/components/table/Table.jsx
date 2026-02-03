import React from "react";

export function Table({
	columns = [],
	data = [],
	maxheight = "500px",
	className = "",
}) {
	return (
		<div className="`w-full bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 ${className}`">
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
									className="px-6 py-4 font-semibold tracking-wide border-r border-brand-400 last:border-r-0 whitespace-nowrap"
								>
									{col.header}
								</th>
							))}
						</tr>
					</thead>
          <tbody className="text-gray-700">
              {data.length > 0 ? (
                data.map((row, rowIndex) => (
                  <tr
                  key={rowIndex}
                  className="bg-white border-b border-gray-100 hover:bg-brand-100/30 transition-colors duration-150">
                    {columns.map((col, colIndex) => (
                      <td
                      key={colIndex}
                      className="px-6 py-4 whitespace-nowrap text-center">
                      {col.render ? col.render(row) : row[col.accessor]}
                      </td>
                    ))}
                  </tr> 
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-400 italic">
                  Tidak ada data absensi.
                </td>
                </tr>
              )}
          </tbody>
				</table>
          </div>
        </div>
	);
}
