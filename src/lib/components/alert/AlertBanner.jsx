import React from "react";
import { Button } from "../button/Button";
import dismissGif from "../../../assets/dismiss.gif";
import successGif from "../../../assets/success.gif";
import questionGif from "../../../assets/question.gif";

const BASE_STYLES =
	"flex flex-col items-center bg-white p-8 rounded-3xl shadow-xl w-full max-w-md mx-auto text-center border border-gray-100";

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
};

export function Alert({
	variant = "error",
	title,
	buttonText,
	onClose,
	onConfirm,
	onCancel,
	cancelText,
	className = "",
	...props
}) {
	const config = ALERT_VARIANTS[variant] || ALERT_VARIANTS.error;

	return (
		<div className={`${BASE_STYLES} ${className}`} {...props}>
			<div className="mb-6">
				<img
					src={config.img}
					alt={`Status ${variant}`}
					className="h-24 w-24 object-contain"
				/>
			</div>
			<h2 className="text-2xl font-bold text-gray-800 mb-8">
				{title || config.defaultTitle}
			</h2>
			<div className="w-full">
				{/* LOGIC SPLIT BUTTON */}
				{variant === "question" ? (
					// 1. Jika Question: Render 2 Tombol
					<div className="flex gap-3 w-full">
						<Button
							variant="ghost" // Pastikan variant ghost ada di Button.jsx
							onClick={onCancel}
							className="flex-1 justify-center border border-gray-200"
						>
							{cancelText || config.defaultCancelText}
						</Button>
						<Button
							variant={config.btnVariant}
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
		</div>
	);
}