import { Button } from "../button/Button";
import { XMarkIcon } from "@heroicons/react/24/outline";
import dismissGif from "../../../assets/dismiss.gif";
import successGif from "../../../assets/success.gif";
import questionGif from "../../../assets/question.gif";
import loadingGif from "../../../assets/loading.gif";

const BASE_STYLES =
	"flex flex-col items-center bg-white p-8 rounded-3xl w-full max-w-[480px] mx-auto text-center border border-gray-100";

const ALERT_VARIANTS = {
	success: {
		img: successGif,
		defaultTitle: "Berhasil!",
		defaultBtnText: "Selesai",
		btnVariant: "primary",
	},
	error: {
		img: dismissGif,
		defaultTitle: "Gagal",
		defaultBtnText: "Tutup",
		btnVariant: "danger",
	},
	question: {
		img: questionGif,
		defaultTitle: "Apakah anda yakin?",
		defaultBtnText: "Ya, Lanjutkan",
		defaultCancelText: "Batal",
		btnVariant: "primary",
	},
	loading: {
		img: loadingGif,
		defaultTitle: "Mohon Menunggu...",
		hideButtons: true,
	},
};

export function Alert({
	variant = "error",
	title,
	message,
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
			{onClose && (
				<button
					onClick={onClose}
					className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-danger active:scale-95 transition-all duration-200"
				>
					<XMarkIcon className="h-6 w-6" />
				</button>
			)}
			<div className="mb-6">
				<img
					src={config.img}
					alt={`Status ${variant}`}
					className="h-28 w-28 object-contain"
				/>
			</div>
			<h2 className="text-2xl font-bold text-gray-800 mb-4">
				{title || config.defaultTitle}
			</h2>
			{(message || children) && (
				<p className="text-gray-600 mb-8 mx-auto">{message || children}</p>
			)}
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
