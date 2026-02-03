import React, { useState } from "react";
import { Dropdown } from "./lib/components/dropdown/Dropdown"; // Sesuaikan path
import { FunnelIcon } from "@heroicons/react/24/outline";
import { Layout } from "./lib/components/layout/layout";

function App() {
    // --- DATA 1: FILTER (Tanpa warna) ---
    const filterOptions = [
        { label: "UI/UX", value: "uiux" },
        { label: "QA", value: "qa" },
        { label: "Mobile", value: "mobile" },
    ];

    // --- DATA 2: STATUS (Wajib ada properti 'color' karena variant status butuh itu) ---
    const [currentStatus, setCurrentStatus] = useState({ label: "Pending", color: "bg-yellow-300 text-yellow-900" });
    
    const statusOptions = [
        { label: "Pending", value: "pending", color: "bg-yellow-300 text-yellow-900 hover:bg-yellow-400" },
        { label: "Approve", value: "approve", color: "bg-green-500 text-white hover:bg-green-600" },
        { label: "Reject", value: "reject", color: "bg-red-400 text-white hover:bg-red-500" },
    ];

    return (
        <Layout>
            <div className="p-10 space-y-10">
                
                {/* CONTOH 1: VARIANT FILTER (Default) */}
                <div className="flex items-center gap-4">
                    <span>Filter Data:</span>
                    <Dropdown 
                        variant="filter"
                        options={filterOptions}
                        onSelect={(item) => console.log("Filter:", item.value)}
                        trigger={
                            <button className="p-2 border rounded bg-white hover:bg-gray-50">
                                <FunnelIcon className="w-5 h-5 text-gray-600" />
                            </button>
                        }
                    />
                </div>

                {/* CONTOH 2: VARIANT STATUS */}
                <div className="flex items-center gap-4">
                    <span>Ubah Status:</span>
                    <Dropdown 
                        variant="status" // <--- Cukup ganti ini!
                        options={statusOptions}
                        onSelect={(item) => setCurrentStatus(item)}
                        trigger={
                            <button className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm ${currentStatus.color}`}>
                                {currentStatus.label}
                            </button>
                        }
                    />
                </div>

            </div>
        </Layout>
    );
}

export default App;