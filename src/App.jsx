import { useState } from "react"; // <--- 1. IMPORT STATE
import { ClockIcon, PlusIcon } from "@heroicons/react/24/solid";
import {
	Alert,
	Button,
	Card,
	Dropdown,
	Input,
	Table,
	Modal,
	Layout,
} from "./lib/components";
import "./App.css";
import InputModal from "./lib/components/modal/inputModal";

function App() {
    // 1. STATE SAKLAR (Default false biar gak kaget pas load)
    const [isOpen, setIsOpen] = useState(true); 

    // 2. HANDLER TANPA ALERT (Langsung tutup)
    const handleSubmit = (data) => {
        console.log("Data dikirim ke Backend:", data);
        // Di sini panggil API nanti...
        
        setIsOpen(false); // Otomatis tutup modal
    };

    return (
        <Layout>
             {/* Tombol buat buka lagi kalau ketutup */}
             <div className="p-10">
                <button 
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    onClick={() => setIsOpen(true)}
                >
                    Tes Buka Modal
                </button>
            </div>

            <InputModal
                isOpen={isOpen}              // <--- JANGAN HARDCODE TRUE
                onClose={() => setIsOpen(false)} // <--- INI PERBAIKANNYA (Pake setIsOpen)
                onSubmit={handleSubmit}
                title="Alasan Pulang Cepat"
            />
        </Layout>
    );
}

export default App;
