import { Button } from "../button/Button";
import {
	XMarkIcon,
	InformationCircleIcon,
	CheckCircleIcon,
	ExclamationCircleIcon,
	QuestionMarkCircleIcon,
	ArrowPathIcon,
} from "@heroicons/react/24/outline";

const BASE_STYLES =
	"flex flex-col items-center justify-center bg-white p-10 rounded-3xl w-[320px] min-h-[320px] mx-auto text-center relative gap-6";

import successGif from "../../../assets/Success.gif";
import errorGif from "../../../assets/dismiss.gif";
import questionGif from "../../../assets/question.gif";
import loadingGif from "../../../assets/loading.gif";

const ALERT_VARIANTS = {
	success: {
		Icon: successGif,
		iconColor: "text-success",
		defaultTitle: "Sukses",
		defaultBtnText: "Selesai",
		btnVariant: "primary",
		hideButtons: true,
	},
	error: {
		Icon: errorGif,
		iconColor: "text-danger",
		defaultTitle: "Gagal",
		defaultBtnText: "Tutup",
		btnVariant: "danger",
		hideButtons: true,
	},
	question: {
		Icon: questionGif,
		iconColor: "text-info",
		defaultTitle: "Apakah anda yakin?",
		defaultBtnText: "Ya, Lanjutkan",
		defaultCancelText: "Batal",
		btnVariant: "primary",
	},
	loading: {
		Icon: loadingGif,
		iconColor: "text-info",
		defaultTitle: "Mohon Menunggu...",
		hideButtons: true,
	},
};

export function Alert({
	variant = "error",
	title,
	mBALIessage,
	buttonText,
	onClose,
	onConfirm,
	onCancel,
	cancelText,
	btnConfirmVariant,
	btnCancelVariant,
	className = "",
	shadow = true,
	hideButtons = false,
	showCloseIcon = true,
	children,
	...props
}) {
	const config = ALERT_VARIANTS[variant] || ALERT_VARIANTS.error;
	const shouldHideButtons = hideButtons || config.hideButtons;

	return (
		<div
			className={`${BASE_STYLES} ${shadow ? "shadow-xl" : ""} ${className}`}
			{...props}
		>
			{onClose &&
				showCloseIcon &&
				variant !== "question" &&
				variant !== "loading" && (
					<button
						onClick={onClose}
						className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-danger active:scale-95 transition-all duration-200"
					>
						<XMarkIcon className="h-6 w-6" />
					</button>
				)}
			{/* Icon - Sekarang masuk ke flow flex standar supaya tidak "nabrak" */}
			<div className="flex items-center justify-center pointer-events-none">
				<img
					src={config.Icon}
					alt={variant}
					className="h-28 w-28 object-contain"
				/>
			</div>

			{/* Konten (Title) - Flow standar tanpa margin-top paksaan */}
			<div className="w-full relative z-10 py-2">
				<h2 className="text-xl font-bold text-gray-800 leading-tight">
					{title || config.defaultTitle}
				</h2>
			</div>
			{!shouldHideButtons && (
				<div className="w-full">
					{/* LOGIC SPLIT BUTTON */}
					{variant === "question" ? (
						// 1. Jika Question: Render 2 Tombol
						<div className="flex gap-3 w-full">
							<Button
								variant={btnCancelVariant || "info"}
								onClick={onCancel}
								className="flex-1 justify-center border border-gray-200"
							>
								{cancelText || config.defaultCancelText}
							</Button>
							<Button
								variant={btnConfirmVariant || "danger"}
								onClick={onConfirm}
								className="flex-1 justify-center"
							>
								{buttonText || config.defaultBtnText}
							</Button>
						</div>
					) : (
						// 2. Jika Lainnya: Render 1 Tombol
						<Button
							variant={config.btnVariant}
							onClick={onClose}
							className="w-full justify-center"
						>
							{buttonText || config.defaultBtnText}
						</Button>
					)}
				</div>
			)}
		</div>
	);
}

export function AlertBanner({
	variant = "error",
	message,
	className = "",
	...props
}) {
	if (variant === "info") {
		return (
			<div
				className={`flex items-center gap-3 px-4 py-3 bg-info/50 rounded-lg shadow-sm ${className}`}
				{...props}
			>
				<InformationCircleIcon className="w-6 h-6 text-white shrink-0" />
				<span className="text-sm font-medium leading-relaxed text-white">
					{message}
				</span>
			</div>
		);
	}

	const variants = {
		success: "bg-success-100 text-success-900",
		error: "bg-danger/10 text-danger border border-danger/20",
	};

	const variantStyles = variants[variant] || variants.error;

	return (
		<div
			className={`w-full p-3 rounded-xl ${variantStyles} ${className}`}
			{...props}
		>
			<p className="text-sm font-medium">{message}</p>
		</div>
	);
}
