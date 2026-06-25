import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

function NeumorphicBadge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors shadow-[2px_2px_4px_#b8bec5,-2px_-2px_4px_#ffffff]",
        variant === "default" && "bg-[#e9eef5] text-slate-700",
        variant === "success" &&
          "bg-green-100 text-green-800 shadow-[2px_2px_4px_#a8c7b8,-2px_-2px_4px_#dcfce7]",
        variant === "warning" &&
          "bg-amber-100 text-amber-800 shadow-[2px_2px_4px_#c5b293,-2px_-2px_4px_#fef3c7]",
        variant === "danger" &&
          "bg-red-100 text-red-800 shadow-[2px_2px_4px_#c7a8a8,-2px_-2px_4px_#fee2e2]",
        variant === "info" &&
          "bg-blue-100 text-blue-800 shadow-[2px_2px_4px_#a8b8c7,-2px_-2px_4px_#dbeafe]",
        className,
      )}
      {...props}
    />
  );
}

export { NeumorphicBadge };
