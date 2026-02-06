import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "../button/Button";

export default function InputModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title,
  maxLength = 50 
}) {
    const [value, setValue] = useState("");
    const [error, setError] = useState("");

    // --- HITUNG KARAKTER (Lebih Akurat) ---
    const charCount = value.length;

    useEffect(() => {
        if (isOpen) {
            setValue("");
            setError("");
        }
    }, [isOpen]);

    const handleClose = () => {
        setValue("");
        setError("");
        onClose();
    };

    const handleSubmit = () => {
        const text = value.trim();

        if (!text) {
            setError("*Isi catatan terlebih dahulu");
            return;
        }

        // VALIDASI KARAKTER
        if (charCount > maxLength) {
            setError(`*Kepanjangan! Maksimal ${maxLength} huruf.`);
            return;
        }

        onSubmit(text);
        handleClose();
    };

    // Styling logic
    const isOverLimit = charCount > maxLength;
    
    const borderClass = error || isOverLimit
        ? "border-danger focus:ring-danger-100 placeholder-danger-300 text-danger-900"
        : "border-brand-300 text-brand-900 focus:border-brand focus:ring-brand-100";

    const counterColor = isOverLimit ? "text-danger font-bold" : "text-gray-400";

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={title}>
            <div className="space-y-4">
                
                <div>
                    <textarea
                        className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 resize-none h-32 transition-all ${borderClass}`}
                        placeholder="Tulis keterangan..."
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value);
                            // Hapus error manual, tapi error limit biarin user liat di counter
                            if (error && error !== `*Kepanjangan! Maksimal ${maxLength} huruf.`) setError(""); 
                        }}
                    />
                    
                    <div className="flex justify-between items-start mt-1">
                        <div className="flex-1">
                            {error && (
                                <p className="text-xs text-danger font-medium">{error}</p>
                            )}
                        </div>

                        {/* COUNTER KARAKTER */}
                        <p className={`text-xs ${counterColor} text-right ml-2 transition-colors duration-200`}>
                            {charCount}/{maxLength} karakter
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="danger" onClick={handleClose}>
                        Tutup
                    </Button>
                    {/* Tombol disable kalau kepanjangan (Opsional, tapi UX bagus) */}
                    <Button 
                        variant="primary" 
                        onClick={handleSubmit}
                        disabled={isOverLimit} // Biar gak bisa diklik kalau merah
                        className={isOverLimit ? "opacity-50 cursor-not-allowed" : ""}
                    >
                        Kirim
                    </Button>
                </div>
            </div>
        </Modal>
    );
}