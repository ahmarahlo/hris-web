import { useState, useRef, useEffect } from "react";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { DatePicker } from "./DatePicker";

export function DateInput({
	value,
	onChange,
	label,
	placeholder = "dd/mm/yyyy",
	minDate,
	disabled = false,
	className = "",
}) {
	const [isOpen, setIsOpen] = useState(false);
	const wrapperRef = useRef(null);

	// Close on click outside
	useEffect(() => {
		function handleClickOutside(event) {
			if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const formatDateDisplay = (date) => {
		if (!date) return "";
		const d = new Date(date);
		if (isNaN(d.getTime())) return "";
		const day = d.getDate().toString().padStart(2, "0");
		const month = (d.getMonth() + 1).toString().padStart(2, "0");
		const year = d.getFullYear();
		return `${day}/${month}/${year}`;
	};

	const handleDateSelect = (date) => {
		onChange(date);
		setIsOpen(false);
	};

	return (
		<div className={`w-full ${className}`} ref={wrapperRef}>
			{label && (
				<label className="block text-gray-600 font-medium mb-2">{label}</label>
			)}
			<div className="relative">
				<div
					className={`relative ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
					onClick={() => !disabled && setIsOpen(!isOpen)}
				>
					<input
						type="text"
						readOnly
						disabled={disabled}
						placeholder={placeholder}
						value={formatDateDisplay(value)}
						className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-brand bg-white text-black ${
							disabled ? "bg-gray-100 text-gray-500" : "cursor-pointer"
						}`}
					/>
					<CalendarDaysIcon className="w-5 h-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
				</div>

				{isOpen && !disabled && (
					<div className="absolute z-50 top-full mt-2 left-0 shadow-xl rounded-lg">
						<DatePicker
							value={value}
							onChange={handleDateSelect}
							onClose={() => setIsOpen(false)}
							minDate={minDate}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
