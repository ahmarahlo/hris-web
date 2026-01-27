import React from "react";
export function Button({ children, variant = "primary", className, ...props }) {
  const variants = {
    primary: "bg-info-600 text-white hover:bg-info-400",
    danger: "bg-danger-600 text-white hover:bg-danger-400",
    success: "bg-success-600 text-white hover:bg-success-400",
    clock: "bg-brand-400 text-brand-900 hover:bg-brand-300",
  };

  return (
    <button {...props} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${variants[variant]} ${className}`}>
      
      {children}
    </button>
  );
}
