import React from "react";

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
        className="w-full bg-transparent outline-none text-white placeholder-gray-400 transition-all duration-300 ease-out px-4 py-3 border border-t-transparent border-x-transparent border-b-disable-color rounded-none hover:border-gray-300 hover:rounded-xl focus:border-white focus:rounded-xl focus:ring-1 focus:ring-white"
      ></input>
    </div>
  );
}
