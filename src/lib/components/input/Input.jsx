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
	return (
		<div className="flex flex-col gap-2 w-full">
			{label && (
				<label className="text-sm font-medium text-gray-700">{label}</label>
			)}
			<input
				type={type}
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
          ${className}`}
			></input>
			{error && <p className="text-xs text-danger">{error}</p>}
		</div>
	);
}
