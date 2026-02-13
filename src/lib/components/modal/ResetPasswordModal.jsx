import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "../button/Button";
import { Input } from "../input/Input";

export function ResetPasswordModal({ isOpen, onClose, onSuccess }) {
	const [formData, setFormData] = useState({
		oldPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [errors, setErrors] = useState({});

	// Reset state when modal opens/closes
	useEffect(() => {
		if (isOpen) {
			setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
			setErrors({});
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

	const handleSubmit = () => {
		if (validate()) {
			// Simulate API Call Success
			if (onSuccess) onSuccess();
			onClose();
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Reset Password">
			<div className="space-y-4">
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
					<Button variant="danger" onClick={onClose}>
						Batal
					</Button>
					<Button variant="primary" onClick={handleSubmit}>
						Simpan
					</Button>
				</div>
			</div>
		</Modal>
	);
}
