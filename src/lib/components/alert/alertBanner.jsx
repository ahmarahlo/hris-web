import React from "react";
import {
	ExclamationCircleIcon,
	CheckCircleIcon,
	InformationCircleIcon,
} from "@heroicons/react/24/solid";

// 1. STATIC CONFIG (Di luar component)
const BANNER_VARIANTS = {
	error: {
		bg: "bg-danger", // Merah (sesuai token CSS kamu)
		text: "text-white",
		icon: ExclamationCircleIcon,
	},
	success: {
		bg: "bg-success", // Hijau
		text: "text-white",
		icon: CheckCircleIcon,
	},
	info: {
		bg: "bg-info", // Biru/Ungu
		text: "text-white",
		icon: InformationCircleIcon,
	},
};

export function AlertBanner({
	variant = "error",
	message = "Something went wrong",
	className = "",
	...props
}) {
	// Logic Selection
	const style = BANNER_VARIANTS[variant] || BANNER_VARIANTS.error;
	const Icon = style.icon;

	return (
		<div
			className={`
                ${style.bg} ${style.text} 
                flex items-center gap-3 
                px-4 py-3 rounded-lg shadow-md 
                w-full max-w-md mx-auto 
                transition-all duration-300 animate-in fade-in slide-in-from-top-2
                ${className}
            `}
			{...props}
		>
			{/* Icon (Optional: Hapus jika ingin teks saja seperti di desain) */}
			<Icon className="w-5 h-5 shrink-0 opacity-90" />

			<span className="font-medium text-sm tracking-wide">{message}</span>
		</div>
	);
}
