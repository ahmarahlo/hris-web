const BANNER_VARIANTS = {
	success: {
		bgColor: "bg-success-100",
		textColor: "text-success-900",
	},
	error: {
		bgColor: "bg-danger/50",
		textColor: "text-danger",
	},
	info: {
		bgColor: "bg-info-100",
		textColor: "text-info-900",
	},
};

export function AlertBanner({
	variant = "error",
	message,
	className = "",
	...props
}) {
	const config = BANNER_VARIANTS[variant] || BANNER_VARIANTS.error;

	return (
		<div
			className={`w-full max-w-lg p-2 rounded-xl ${config.bgColor} ${className}`}
			{...props}
		>
			<p className={`text-sm font-sm ${config.textColor}`}>{message}</p>
		</div>
	);
}
