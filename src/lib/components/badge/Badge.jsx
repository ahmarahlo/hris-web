import React from "react";
import { CheckIcon, XMarkIcon, ClockIcon } from "@heroicons/react/24/solid";

export function Badge({
  variant = "pending",
  className = "",
  children,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 w-[107px] h-[40px] rounded-lg font-semibold text-sm transition-colors duration-200";

  const variants = {
    approve: "bg-success-300/50 text-success-600 border-2 border-success-600",
    reject: "bg-danger-300/50 text-danger-600 border-2 border-danger-600",
    pending: "bg-warning-300/50 text-warning-600 border-2 border-warning-600",
  };

  const icons = {
    approve: <CheckIcon className="h-4 w-4" />,
    reject: <XMarkIcon className="h-4 w-4" />,
    pending: <ClockIcon className="h-4 w-4" />,
  };

  const variantStyles = variants[variant] || variants.pending;
  const icon = icons[variant] || icons.pending;

  return (
    <span className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
      {children}
      {icon}
    </span>
  );
}
