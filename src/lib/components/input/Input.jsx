import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export function Input({
	label,
	type = "text",
	placeholder,
	value,
	onChange,
	name,
	error,
	className = "",
	...props
}) {
	const [isVisible, setIsVisible] = useState(false);
	const isPasswordField = type === "password";

	return (
		<div className="flex flex-col gap-2 w-full">
			{label && (
				<label className="text-sm font-medium text-gray-700">{label}</label>
			)}
			<div className="relative group">
				<input
					type={isPasswordField ? (isVisible ? "text" : "password") : type}
					placeholder={placeholder}
					value={value}
					onChange={onChange}
					name={name}
					{...props}
					className={`w-full bg-white text-black placeholder-gray-400 transition-all duration-300 ease-out px-4 py-3 border rounded-xl outline-none 
            ${
							error
								? "border-danger focus:ring-danger-100 focus:border-danger"
								: "border-gray-300 hover:border-gray-400 focus:border-info focus:ring-1 focus:ring-info"
						} 
            ${isPasswordField ? "pr-12" : ""} 
            ${className}`}
				></input>

				{isPasswordField && (
					<button
						type="button"
						onClick={() => setIsVisible(!isVisible)}
						className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
					>
						{isVisible ? (
							<EyeSlashIcon className="h-5 w-5" />
						) : (
							<EyeIcon className="h-5 w-5" />
						)}
					</button>
				)}
			</div>
			{error && <p className="text-xs text-danger">{error}</p>}
		</div>
	);
}
