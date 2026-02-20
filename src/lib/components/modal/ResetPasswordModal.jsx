import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Modal } from "./Modal";
import { Button } from "../button/Button";
import { Input } from "../input/Input";
import { api } from "../../api";
import { Alert } from "../alert/Alert";
import { useAuth } from "../../AuthContext";
import { useNavigate } from "react-router-dom";

export function ResetPasswordModal({ isOpen, onClose, onSuccess }) {
	const { logout } = useAuth();
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		oldPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [errors, setErrors] = useState({});
	const [status, setStatus] = useState("idle"); // idle, loading, success, error
	const [message, setMessage] = useState("");

	// Reset state when modal opens/closes
	useEffect(() => {
		if (isOpen) {
			setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
			setErrors({});
			setStatus("idle");
			setMessage("");
		}
	}, [isOpen]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		// Clear error for field when typing
		if (errors[name]) {
			setErrors((prev) => ({ ...prev, [name]: "" }));
		}
	};

	const validate = () => {
		const newErrors = {};

		// 1. Data tidak lengkap (Empty check)
		if (!formData.oldPassword)
			newErrors.oldPassword = "Password lama wajib diisi";
		if (!formData.newPassword)
			newErrors.newPassword = "Password baru wajib diisi";
		if (!formData.confirmPassword)
			newErrors.confirmPassword = "Konfirmasi password wajib diisi";

		// 2. Pass sama dengan yang lama (Logic check)
		if (
			formData.newPassword &&
			formData.oldPassword &&
			formData.newPassword === formData.oldPassword
		) {
			newErrors.newPassword =
				"Password baru tidak boleh sama dengan password lama";
		}

		// 3. Konfirmasi kecocokan pass baru (gagal) (Logic check)
		if (
			formData.newPassword &&
			formData.confirmPassword &&
			formData.newPassword !== formData.confirmPassword
		) {
			newErrors.confirmPassword = "Konfirmasi password tidak sesuai";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async () => {
		if (validate()) {
			setStatus("loading");
			setMessage("");
			try {
				await api.changePassword(formData);
				setStatus("success");
				setMessage("Password berhasil diubah! Silakan login kembali.");
				if (onSuccess) onSuccess();

				setTimeout(() => {
					onClose();
					logout();
					navigate("/login");
				}, 1500);
			} catch (error) {
				setStatus("idle");
				const errorMsg =
					error.response?.data?.message || "Gagal mengubah password";
				// Fix uncapitalized message from API
				const formattedMsg =
					errorMsg === "password lama salah" ? "Password lama salah" : errorMsg;

				setErrors({
					oldPassword: formattedMsg,
				});
			}
		}
	};

	return (
		<>
			<Modal isOpen={isOpen} onClose={onClose} title="Reset Password">
				<div className="space-y-4">
					{status === "loading" && (
						<div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
							<Alert
								variant="loading"
								title="Menyimpan..."
								shadow={false}
								hideButtons
							/>
						</div>
					)}

					<Input
						label="Password Lama"
						type="text"
						name="oldPassword"
						value={formData.oldPassword}
						onChange={handleChange}
						placeholder="Masukkan password lama"
						error={errors.oldPassword}
					/>

					<Input
						label="Password Baru"
						type="text"
						name="newPassword"
						value={formData.newPassword}
						onChange={handleChange}
						placeholder="Masukkan password baru"
						error={errors.newPassword}
					/>

					<Input
						label="Konfirmasi Password Baru"
						type="text"
						name="confirmPassword"
						value={formData.confirmPassword}
						onChange={handleChange}
						placeholder="Ulangi password baru"
						error={errors.confirmPassword}
					/>

					<div className="flex justify-end gap-3 pt-4">
						<Button
							variant="danger"
							onClick={onClose}
							disabled={status === "loading" || status === "success"}
						>
							Batal
						</Button>
						<Button
							variant="info"
							onClick={handleSubmit}
							disabled={status === "loading" || status === "success"}
						>
							Simpan
						</Button>
					</div>
				</div>
			</Modal>
			{status === "success" &&
				createPortal(
					<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
						<Alert
							variant="success"
							title="Berhasil!"
							message={message}
							shadow={true}
							hideButtons
						/>
					</div>,
					document.body,
				)}
		</>
	);
}
