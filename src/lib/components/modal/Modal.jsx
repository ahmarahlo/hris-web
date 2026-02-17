import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export function Modal({ isOpen, onClose, title, children }) {
	if (!isOpen) return null;

	return (
		<div>
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm ">
				<div className="bg-white rounded-xl shadow-2xl w-full max-w-[480px] overflow-hidden">
					<div className="flex justify-between items-center p-4 border-b">
						<h3 className="font-bold text-gray-800">{title}</h3>
						<button
							onClick={onClose}
							className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-danger active:scale-95 transition-all duration-200"
						>
							<XMarkIcon className="w-6 h-6" />
						</button>
					</div>
					<div className="p-4">{children}</div>
				</div>
			</div>
		</div>
	);
}
