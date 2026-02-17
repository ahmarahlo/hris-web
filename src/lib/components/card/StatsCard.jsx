export function StatsCard({
	title,
	value,
	variant = "primary",
	className = "",
}) {
	const variants = {
		primary: "bg-brand text-white",
		info: "bg-info text-white",
		success: "bg-success text-white",
		warning: "bg-warning text-white",
		danger: "bg-danger text-white",
	};

	const headerStyle = variants[variant] || variants.primary;

	return (
		<div
			className={`bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-42 border border-gray-100 ${className}`}
		>
			<div className={`${headerStyle} px-4 py-2 font-semibold text-sm`}>
				{title}
			</div>
			<div className="flex-1 flex items-center justify-center">
				<span className="text-4xl font-bold text-gray-700">{value}</span>
			</div>
		</div>
	);
}
