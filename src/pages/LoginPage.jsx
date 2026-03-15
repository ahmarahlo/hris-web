import { useState, useEffect, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { Input } from "../lib/components/input/Input";
import { Button } from "../lib/components/button/Button";
import { Alert, AlertBanner } from "../lib/components/alert/Alert";
import { api } from "../lib/api";
import logoSvg from "../assets/logo.svg";
import homeGambar from "../assets/home-gambar.webp";

// Lazy load heavy components
const ResetPasswordModal = lazy(() =>
    import("../lib/components/modal/ResetPasswordModal").then((module) => ({
        default: module.ResetPasswordModal,
    })),
);
import { useAuth } from "../lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { USER_ROLES } from "../lib/constants";

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [passwordAlert, setPasswordAlert] = useState(null);
    const [isBlockedAlertOpen, setIsBlockedAlertOpen] = useState(false);
    const [showNewUserAlert, setShowNewUserAlert] = useState(false);
    const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
    const [pendingUserData, setPendingUserData] = useState(null);
    const [failedAttempts, setFailedAttempts] = useState(0);

    const { login, setUserData } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        let timer;
        if (passwordAlert || isBlockedAlertOpen) {
            timer = setTimeout(() => {
                setPasswordAlert(null);
                setIsBlockedAlertOpen(false);
            }, 3000);
        }
        return () => clearTimeout(timer);
    }, [passwordAlert, isBlockedAlertOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (error) setError("");
    };

    const handleRedirect = (data) => {
        const user = data.userData || data;
        if (user.role === USER_ROLES.HR || user.role === USER_ROLES.ADMIN) {
            navigate("/admin");
        } else {
            navigate("/dashboard");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password.length < 8) {
            setError("Password minimal 8 karakter.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const data = await login(formData.email, formData.password);
            let isNewUser = data.isNewUser === true;

            try {
                const profile = await api.getMe();
                if (profile.isNewUser) isNewUser = true;
            } catch (e) {
                console.warn("[LoginPage] Fallback check failed");
            }

            if (isNewUser) {
                setPendingUserData(data);
                setShowNewUserAlert(true);
            } else {
                handleRedirect(data);
            }
        } catch (err) {
            let errorMsg = err.message || "Terjadi kesalahan";
            if (err.response?.status === 401) {
                const newAttempts = failedAttempts + 1;
                setFailedAttempts(newAttempts);
                if (newAttempts >= 3) {
                    setIsBlockedAlertOpen(true);
                    setError("Akun terblokir karena terlalu banyak percobaan.");
                } else {
                    setError("Email atau password salah.");
                }
            } else {
                setError(err.response?.data?.message || errorMsg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handlePromptCancel = async () => {
        setShowNewUserAlert(false);
        setIsLoading(true);
        try {
            await api.markNewEmployeeAsSeen();
            const actualUserData = pendingUserData.userData || pendingUserData;
            setUserData(actualUserData);
            handleRedirect(actualUserData);
        } catch (err) {
            const actualUserData = pendingUserData.userData || pendingUserData;
            setUserData(actualUserData);
            handleRedirect(actualUserData);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-slate-50 font-sans overflow-hidden">
            {/* SISI KIRI - FORM LOGIN (Pake Card Style) */}
            <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2 relative z-20">
                <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100">
                    <div className="mb-10 flex justify-center">
                        <img src={logoSvg} alt="Logo" className="h-16" />
                    </div>

                    <div className="mb-8 text-center">
                        <h1 className="text-2xl font-bold text-gray-800">Selamat Datang</h1>
                        <p className="text-gray-500 mt-2">Silakan masuk ke akun HRIS Anda</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <Input
                                type="email"
                                name="email"
                                placeholder="Email Perusahaan"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="bg-gray-50 border-gray-200 focus:bg-white transition-all"
                            />

                            <Input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="bg-gray-50 border-gray-200 focus:bg-white transition-all"
                            />
                        </div>

                        {error && <AlertBanner variant="error" message={error} />}

                        <Button
                            type="submit"
                            variant="info"
                            className="w-full py-3 font-semibold shadow-lg shadow-blue-200"
                            disabled={isLoading}
                        >
                            {isLoading ? "Memproses..." : "Masuk Sekarang"}
                        </Button>
                    </form>
                </div>
            </div>

            {/* SISI KANAN - GAMBAR (Biar Gak Mentok) */}
            <div className="hidden lg:flex flex-1 items-center justify-center bg-blue-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-indigo-900/90 z-10" />
                <img
                    src={homeGambar}
                    alt="Side Decoration"
                    className="h-full w-full object-cover relative z-0"
                />
            </div>

            {/* MODALS & ALERTS */}
            <Suspense fallback={null}>
                <ResetPasswordModal
                    isOpen={isResetPasswordOpen}
                    onClose={() => setIsResetPasswordOpen(false)}
                    onSuccess={(msg) => setPasswordAlert({ type: "success", message: msg })}
                />
            </Suspense>

            {isBlockedAlertOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <Alert
                        variant="error"
                        title="Akun Terblokir"
                        message="Hubungi admin untuk membuka akses."
                        onClose={() => setIsBlockedAlertOpen(false)}
                        showCloseIcon={false}
                    />
                </div>,
                document.body
            )}

            {showNewUserAlert && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <Alert
                        variant="question"
                        title="Hai, User Baru!"
                        message="Ingin mengganti password sekarang demi keamanan akun Anda?"
                        buttonText="Ganti Password"
                        cancelText="Nanti Saja"
                        onConfirm={() => {
                            setShowNewUserAlert(false);
                            setIsResetPasswordOpen(true);
                        }}
                        onCancel={handlePromptCancel}
                    />
                </div>,
                document.body
            )}
        </div>
    );
}