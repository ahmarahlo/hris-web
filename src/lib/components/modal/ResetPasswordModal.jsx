import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "../button/Button";
import { Input } from "../input/Input";
import { Alert } from "../alert/Alert";
import { api } from "../../api";
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
	const [status, setStatus] = useState("idle");

	useEffect(() => {
		if (isOpen) {
			setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
			setErrors({});
			setStatus("idle");
		}
	}, [isOpen]);

	const validate = () => {
		const newErrors = {};
		if (!formData.oldPassword) {
			newErrors.oldPassword = "Password lama wajib diisi";
		}
		if (!formData.newPassword) {
			newErrors.newPassword = "Password baru wajib diisi";
		} else if (formData.newPassword.length < 6) {
			newErrors.newPassword = "Password minimal 6 karakter";
		}

		if (
			formData.newPassword === formData.oldPassword &&
			formData.newPassword !== ""
		) {
			newErrors.newPassword =
				"Password baru tidak boleh sama dengan password lama";
		}

		if (formData.newPassword !== formData.confirmPassword) {
			newErrors.confirmPassword = "Konfirmasi password tidak sesuai";
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async () => {
		if (!validate()) return;

		setStatus("loading");
		try {
			// 1. Kirim perubahan password
			await api.changePassword(formData);

			// 2. Tandai sebagai bukan user baru lagi di database
			try {
				await api.markNewEmployeeAsSeen();
			} catch (e) {
				console.error("Gagal update status employee seen:", e);
			}

			setStatus("success");

			// 3. Panggil callback onSuccess untuk munculin alert di LoginPage
			if (onSuccess) onSuccess("Password berhasil dirubah");

			// 4. Jeda 2 detik, lalu logout dan tendang ke login
			setTimeout(() => {
				onClose();
				logout();
				navigate("/login", { replace: true });
			}, 2000);
		} catch (error) {
			setStatus("idle");
			const responseData = error.response?.data;
			const errorMsg = responseData?.message || "Gagal mengubah password";

			// Mapping error dari backend agar lebih user-friendly dan muncul di input yang tepat
			if (
				errorMsg.toLowerCase().includes("password lama salah") ||
				errorMsg.toLowerCase().includes("wrong old password")
			) {
				setErrors({ oldPassword: "Password lama salah" });
			} else {
				setErrors({ oldPassword: errorMsg });
			}
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Ganti password">
			<div className="space-y-4 relative">
				{/* Overlay Loading saat proses simpan */}
				{/* Overlay Loading saat proses simpan */}
				{status === "loading" && (
					<div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl transition-all duration-300">
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
					type="password"
					name="oldPassword"
					placeholder="Password..."
					value={formData.oldPassword}
					onChange={(e) =>
						setFormData({ ...formData, oldPassword: e.target.value })
					}
					error={errors.oldPassword}
				/>

				<Input
					label="Password Baru"
					type="password"
					name="newPassword"
					placeholder="Pasword..."
					value={formData.newPassword}
					onChange={(e) =>
						setFormData({ ...formData, newPassword: e.target.value })
					}
					error={errors.newPassword}
				/>

				<Input
					label="Konfirmasi Password"
					type="password"
					name="confirmPassword"
					placeholder="Pasword..."
					value={formData.confirmPassword}
					onChange={(e) =>
						setFormData({ ...formData, confirmPassword: e.target.value })
					}
					error={errors.confirmPassword}
				/>

				<div className="flex justify-end gap-3 pt-4">
					<Button
						variant="danger"
						onClick={onClose}
						disabled={status === "loading" || status === "success"}
					>
						batal
					</Button>
					<Button
						variant="info"
						onClick={handleSubmit}
						disabled={status === "loading" || status === "success"}
					>
						Kirim
					</Button>
				</div>
			</div>
		</Modal>
	);
}
