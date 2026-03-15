import {
	CheckIcon,
	XMarkIcon,
	ClockIcon,
	LockClosedIcon,
} from "@heroicons/react/24/solid";

export function Badge({
	variant = "pending",
	className = "",
	children,
	...props
}) {
	const baseStyles =
		"inline-flex items-center justify-center gap-2 min-w-[100px] px-3 h-[36px] rounded-lg font-semibold text-xs transition-colors duration-200 whitespace-nowrap";

	const variants = {
		approve: "bg-success-300/50 text-success-600 border-2 border-success-600",
		reject: "bg-danger-300/50 text-danger-600 border-2 border-danger-600",
		blokir: "bg-danger-300/50 text-danger-600 border-2 border-danger-600",
		pending: "bg-warning-300/50 text-warning-600 border-2 border-warning-600",
		info: "bg-gray-100 text-gray-500 border-2 border-gray-400",
		self: "bg-gray-100 text-gray-400 border-2 border-gray-400",
		"no-access":
			"bg-gray-100 text-gray-500 border-2 border-gray-300 opacity-80",
	};

	const icons = {
		approve: <CheckIcon className="h-4 w-4" />,
		reject: <XMarkIcon className="h-4 w-4" />,
		blokir: <XMarkIcon className="h-4 w-4" />,
		pending: <ClockIcon className="h-4 w-4" />,
		info: null,
		self: null,
		"no-access": null,
	};

	const variantStyles = variants[variant] || variants.pending;
	const icon = icons[variant] || icons.pending;

	return (
		<span className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
			{children}
			{icon}
		</span>
	);
}
