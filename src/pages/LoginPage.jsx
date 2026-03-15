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
        <div className="flex min-h-screen w-full bg-white font-sans overflow-hidden">
            {/* SISI KIRI - FORM LOGIN */}
            <div className="flex w-full flex-col items-center justify-center px-8 lg:px-16 lg:w-1/2 relative z-20">
                <div className="w-full max-w-sm mx-auto">
                    <div className="mb-8 flex justify-center">
                        <img src={logoSvg} alt="Logo" className="h-[120px] w-auto" />
                    </div>

                    <div className="mb-10 text-center">
                        <h1 className="text-[2rem] font-bold text-gray-900 tracking-tight">Log In to your account</h1>
                        <p className="text-gray-900 mt-2 text-sm font-medium">Welcome back</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-5">
                            <Input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="bg-white border-gray-400 focus:bg-white focus:border-blue-500 transition-all text-sm py-3 rounded-md placeholder-gray-500"
                            />

                            <Input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="bg-white border-gray-400 focus:bg-white focus:border-blue-500 transition-all text-sm py-3 rounded-md placeholder-gray-500"
                            />
                        </div>

                        {error && <AlertBanner variant="error" message={error} />}

                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full py-3 text-sm font-semibold shadow-none bg-info hover:bg-info-600 text-white transition-all rounded-md"
                                disabled={isLoading}
                            >
                                {isLoading ? "Memproses..." : "Login"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* SISI KANAN - GAMBAR (Bawaan Foto) */}
            <div className="hidden lg:flex flex-1 relative overflow-hidden bg-white justify-end">
                <img
                    src={homeGambar}
                    alt="Side Decoration"
                    className="h-full w-auto object-contain object-right"
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