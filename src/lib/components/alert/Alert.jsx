import React from "react";
import { Button } from "../button/Button";
import dismissGif from "../../../assets/dismiss.gif";

export function Alert({ title = "Ditolak", onClose }) {
	return (
		<div className="flex flex-col items-center bg-white p-10 rounded-3xl shadow-xl w-70 max-w-md mx-auto">
			<div className="">
				<img
					src={dismissGif}
					alt="Status Animasi"
					className="h-20 w-20 object-contain"
				/>
			</div>
			<h2 className="text-3xl font-bold text-black mb-10">{title}</h2>
			<Button variant="danger" onClick={onClose}>
				Tutup
			</Button>
		</div>
	);
}
