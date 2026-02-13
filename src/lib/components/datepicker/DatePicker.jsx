import { useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

export function DatePicker({ value, onChange, onClose, minDate }) {
	const [currentDate, setCurrentDate] = useState(new Date());

	// Initialize calendar with value or current date
	useEffect(() => {
		if (value) {
			setCurrentDate(new Date(value));
		}
	}, [value]);

	const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
	const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

	const handlePrevMonth = () => {
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
		);
	};

	const handleNextMonth = () => {
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
		);
	};

	const handleDateClick = (day) => {
		const newDate = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth(),
			day,
		);
		// Adjust for timezone offset to avoid "yesterday" issues if needed,
		// but for simple date picking, ensuring we set hours to 12 is usually safe
		newDate.setHours(12, 0, 0, 0);
		onChange(newDate);
	};

	const renderDays = () => {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		const totalDays = daysInMonth(year, month);
		const startDay = firstDayOfMonth(year, month);
		const days = [];

		// Empty cells for days before the 1st
		for (let i = 0; i < startDay; i++) {
			days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
		}

		// Days of the month
		for (let i = 1; i <= totalDays; i++) {
			const currentDayDate = new Date(year, month, i);
			currentDayDate.setHours(0, 0, 0, 0);
			const minDateVal = minDate ? new Date(minDate) : null;
			if (minDateVal) minDateVal.setHours(0, 0, 0, 0);

			const isDisabled = minDateVal && currentDayDate < minDateVal;

			const isSelected =
				value &&
				value.getDate() === i &&
				value.getMonth() === month &&
				value.getFullYear() === year;

			days.push(
				<button
					key={i}
					type="button"
					onClick={() => !isDisabled && handleDateClick(i)}
					disabled={isDisabled}
					className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors
                        ${
													isSelected
														? "bg-brand text-white"
														: isDisabled
															? "text-gray-300 cursor-not-allowed"
															: "text-gray-700 hover:bg-gray-100"
												}`}
				>
					{i}
				</button>,
			);
		}

		return days;
	};

	const monthNames = [
		"Januari",
		"Februari",
		"Maret",
		"April",
		"Mei",
		"Juni",
		"Juli",
		"Agustus",
		"September",
		"Oktober",
		"November",
		"Desember",
	];

	return (
		<div className="bg-white rounded-lg shadow-xl overflow-hidden w-[300px] border border-gray-100">
			{/* Header */}
			<div className="bg-[#8DA9C4] p-4 flex justify-between items-center text-white">
				<h3 className="font-semibold text-lg">
					{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
				</h3>
				<div className="flex gap-2">
					<button
						onClick={handlePrevMonth}
						className="hover:bg-white/20 p-1 rounded"
					>
						<ChevronLeftIcon className="w-5 h-5" />
					</button>
					<button
						onClick={handleNextMonth}
						className="hover:bg-white/20 p-1 rounded"
					>
						<ChevronRightIcon className="w-5 h-5" />
					</button>
				</div>
			</div>

			{/* Body */}
			<div className="p-4">
				{/* Weekday Headers */}
				<div className="grid grid-cols-7 mb-2 text-center">
					{["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
						<div
							key={idx}
							className="h-8 w-8 flex items-center justify-center text-xs font-bold text-gray-500"
						>
							{day}
						</div>
					))}
				</div>

				{/* Days Grid */}
				<div className="grid grid-cols-7 text-center gap-y-1">
					{renderDays()}
				</div>
			</div>

			{/* Footer */}
			<div className="p-3 border-t border-gray-100 flex justify-end">
				<button
					type="button"
					onClick={onClose}
					className="px-4 py-1.5 bg-[#6B7FD7] text-white text-sm rounded-lg hover:bg-[#5a6ac0] transition-colors"
				>
					Tutup
				</button>
			</div>
		</div>
	);
}
