export function Button({
	variant = "primary",
	className = "",
	children,
	...props
}) {
	const baseStyles =
		"inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 cursor-pointer text-black";

	const variants = {
		clock: "bg-brand-400 text-brand-900 hover:bg-brand-300",
		primary: "bg-brand text-white hover:bg-brand-500",
		info: "bg-info text-white hover:bg-info-500",
		outline: "border border-brand text-brand hover:bg-brand-100",
		ghost: "bg-transparent text-brand-700 hover:bg-brand-100",
		danger: "bg-danger text-white hover:bg-danger-600",
		success: "bg-success text-white hover:bg-success-600",
	};

	const variantStyles = variants[variant] || variants.primary;

	return (
		<button
			className={`${baseStyles} ${variantStyles} ${className}`}
			{...props}
		>
			{children}
		</button>
	);
}
