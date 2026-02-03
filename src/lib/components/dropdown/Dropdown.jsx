import React, { useState } from "react";

export function Dropdown({ 
    trigger,        
    options = [],   
    onSelect,       
    variant = "filter", // Pilihan: 'filter' | 'status'
    menuClass = ""      // Opsional: kalau mau override lebar manual
}) {
    const [isOpen, setIsOpen] = useState(false);

    // 1. CONFIG DEFAULT BERDASARKAN VARIANT
    // Kita tentukan style container menu berdasarkan variant
    const defaultMenuClass = variant === "status" 
        ? "w-32 right-0 mt-2 p-1 space-y-1" // Status: Kecil, ada jarak antar item
        : "w-40 right-0 mt-1 py-1";          // Filter: Standar list menyatu

    const activeMenuClass = menuClass || defaultMenuClass;

    return (
        <div className="relative inline-block text-left">
            
            {/* TRIGGER */}
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>

            {/* BACKDROP */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-30 cursor-default"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* MENU BODY */}
            {isOpen && (
                <div className={`absolute z-40 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden ${activeMenuClass}`}>
                    
                    {/* ISI MENU */}
                    <ul>
                        {options.map((option, index) => (
                            <li key={index}>
                                <button
                                    onClick={() => {
                                        onSelect(option);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        w-full text-left transition-colors duration-150 text-sm
                                        ${/* LOGIC PEMILIHAN STYLE ITEM */ ""}
                                        
                                        ${variant === 'status' 
                                            // STYLE A: STATUS (Kotak, Warna dari data option, Teks Tengah)
                                            ? `px-3 py-1.5 rounded-md font-medium text-center ${option.color || 'bg-gray-100'}`
                                            
                                            // STYLE B: FILTER (List Putih Biasa)
                                            : "px-4 py-2 text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                                        }
                                    `}
                                >
                                    {option.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}