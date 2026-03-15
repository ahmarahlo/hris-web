import { useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

export function DatePicker({
	value,
	onChange,
	onClose,
	minDate,
	highlightedDates = [],
	disabledDates = [],
}) {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [view, setView] = useState("calendar"); // calendar, months, years

	// Initialize calendar with value, minDate, or current date
	useEffect(() => {
		if (value) {
			setCurrentDate(new Date(value));
		} else if (minDate && new Date(minDate) > new Date()) {
			setCurrentDate(new Date(minDate));
		}
	}, [value, minDate]);

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
		newDate.setHours(12, 0, 0, 0);
		onChange(newDate);
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

	const renderCalendar = () => {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		const totalDays = daysInMonth(year, month);
		const startDay = firstDayOfMonth(year, month);
		const days = [];

		for (let i = 0; i < startDay; i++) {
			days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
		}

		for (let i = 1; i <= totalDays; i++) {
			const currentDayDate = new Date(year, month, i);
			currentDayDate.setHours(0, 0, 0, 0);
			const minDateVal = minDate ? new Date(minDate) : null;
			if (minDateVal) minDateVal.setHours(0, 0, 0, 0);

			const isBeforeMinDate = minDateVal && currentDayDate < minDateVal;
			const isBooked = disabledDates.some((dd) => {
				const d = new Date(dd);
				return (
					d.getDate() === i &&
					d.getMonth() === month &&
					d.getFullYear() === year
				);
			});

			const isDisabled = isBeforeMinDate || isBooked;
			const isSelected =
				value &&
				value.getDate() === i &&
				value.getMonth() === month &&
				value.getFullYear() === year;
			const isHighlighted = highlightedDates.some((hd) => {
				const d = new Date(hd);
				return (
					d.getDate() === i &&
					d.getMonth() === month &&
					d.getFullYear() === year
				);
			});

			const getDayClass = () => {
				if (isSelected) return "bg-brand text-white shadow-md shadow-brand/20";
				if (isBeforeMinDate)
					return "text-gray-300 bg-gray-50 cursor-not-allowed opacity-50";
				if (isBooked || isHighlighted) {
					let classStr =
						"bg-info-100 text-info font-bold border border-info-200/50";
					if (isBooked) classStr += " cursor-not-allowed";
					return classStr;
				}
				return "text-gray-700 hover:bg-brand-50 hover:text-brand";
			};

			days.push(
				<button
					key={i}
					type="button"
					onClick={() => !isDisabled && handleDateClick(i)}
					disabled={isDisabled}
					className={`h-6 w-6 flex items-center justify-center rounded-full text-[10px] font-medium transition-all duration-200 ${getDayClass()}`}
					title={
						isBooked
							? "Sudah ada agenda cuti"
							: isHighlighted
								? "Hari libur/cuti"
								: ""
					}
				>
					{i}
				</button>,
			);
		}

		return (
			<div className="animate-in fade-in duration-300">
				<div className="grid grid-cols-7 mb-1 text-center">
					{["M", "S", "S", "R", "K", "J", "S"].map((day, idx) => (
						<div
							key={idx}
							className="h-6 w-6 flex items-center justify-center text-[9px] font-bold text-gray-400 uppercase"
						>
							{day}
						</div>
					))}
				</div>
				<div className="grid grid-cols-7 text-center gap-y-1">{days}</div>
			</div>
		);
	};

	const renderMonths = () => {
		return (
			<div className="grid grid-cols-3 gap-1.5 py-1 animate-in slide-in-from-bottom-2 duration-300">
				{monthNames.map((name, idx) => {
					const isCurrent = idx === currentDate.getMonth();
					return (
						<button
							key={name}
							onClick={() => {
								setCurrentDate(new Date(currentDate.getFullYear(), idx, 1));
								setView("calendar");
							}}
							className={`py-2 text-[11px] font-medium rounded-lg transition-all ${
								isCurrent
									? "bg-brand text-white shadow-md"
									: "text-gray-600 hover:bg-brand-50 hover:text-brand"
							}`}
						>
							{name.slice(0, 3)}
						</button>
					);
				})}
			</div>
		);
	};

	const renderYears = () => {
		const curYear = currentDate.getFullYear();
		const years = [];
		for (let i = curYear - 5; i <= curYear + 6; i++) years.push(i);

		return (
			<div className="grid grid-cols-4 gap-1.5 py-1 animate-in slide-in-from-bottom-2 duration-300">
				{years.map((y) => {
					const isCurrent = y === curYear;
					return (
						<button
							key={y}
							onClick={() => {
								setCurrentDate(new Date(y, currentDate.getMonth(), 1));
								setView("calendar");
							}}
							className={`py-2 text-[11px] font-medium rounded-lg transition-all ${
								isCurrent
									? "bg-brand text-white shadow-md"
									: "text-gray-600 hover:bg-brand-50 hover:text-brand"
							}`}
						>
							{y}
						</button>
					);
				})}
			</div>
		);
	};

	return (
		<div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-[260px] border border-gray-100 translate-y-1 animate-in fade-in zoom-in-95 duration-200">
			{/* Header */}
			<div className="p-4 bg-brand border-b border-brand-600/20">
				<div className="flex justify-between items-center px-1">
					<div className="flex items-baseline gap-1.5">
						<button
							onClick={() => setView(view === "months" ? "calendar" : "months")}
							className="text-base font-bold text-white hover:text-white/80 transition-colors px-1"
						>
							{monthNames[currentDate.getMonth()]}
						</button>
						<button
							onClick={() => setView(view === "years" ? "calendar" : "years")}
							className="text-xs font-semibold text-white/80 hover:text-white transition-colors"
						>
							{currentDate.getFullYear()}
						</button>
					</div>
					<div className="flex gap-2">
						<button
							onClick={handlePrevMonth}
							className="hover:bg-white/10 p-1 rounded-full transition-colors text-white/80 hover:text-white"
						>
							<ChevronLeftIcon className="w-4 h-4" />
						</button>
						<button
							onClick={handleNextMonth}
							className="hover:bg-white/10 p-1 rounded-full transition-colors text-white/80 hover:text-white"
						>
							<ChevronRightIcon className="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>

			{/* Body */}
			<div className="p-4 min-h-[200px]">
				{view === "calendar" && renderCalendar()}
				{view === "months" && renderMonths()}
				{view === "years" && renderYears()}
			</div>

			{/* Footer */}
			<div className="px-4 py-3 bg-gray-50/50 border-t border-gray-50 flex justify-between items-center gap-3">
				<button
					type="button"
					onClick={() => {
						const today = new Date();
						setCurrentDate(today);
						onChange(today);
					}}
					className="text-[10px] font-bold text-brand hover:text-brand-700 uppercase tracking-wider px-1"
				>
					Hari Ini
				</button>
				<button
					type="button"
					onClick={onClose}
					className="px-5 py-1.5 bg-brand text-white text-[10px] font-bold rounded-xl hover:bg-brand-700 transition-all shadow-md shadow-brand/10 active:scale-95 uppercase tracking-wider"
				>
					Selesai
				</button>
			</div>
		</div>
	);
}
