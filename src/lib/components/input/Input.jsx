export function Input({
	label,
	type = "text",
	placeholder,
	value,
	onChange,
	name,
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
				className="w-full bg-white text-gray-900 placeholder-gray-400 transition-all duration-300 ease-out px-4 py-3 border border-gray-300 rounded-xl outline-none hover:border-gray-400 focus:border-info focus:ring-1 focus:ring-info"
			></input>
		</div>
	);
}
