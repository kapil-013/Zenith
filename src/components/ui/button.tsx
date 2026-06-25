import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "danger" | "ghost" | "inset" | "success";
  size?: "default" | "sm" | "lg" | "icon";
}

const NeumorphicButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none",

          // Sizes
          size === "default" && "h-11 px-6 py-2",
          size === "sm" && "h-9 px-4 text-sm rounded-lg",
          size === "lg" && "h-14 px-8 text-lg rounded-2xl",
          size === "icon" && "h-11 w-11",

          // Variants
          variant === "default" &&
            "bg-[#e9eef5] text-slate-700 shadow-[4px_4px_8px_#b8bec5,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#b8bec5,-2px_-2px_4px_#ffffff] active:shadow-[inset_2px_2px_5px_#b8bec5,inset_-2px_-2px_5px_#ffffff]",
          variant === "primary" &&
            "bg-blue-600 text-white shadow-[4px_4px_8px_#b8bec5,-4px_-4px_8px_#ffffff] hover:bg-blue-700 active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)]",
          variant === "danger" &&
            "bg-red-500 text-white shadow-[4px_4px_8px_#b8bec5,-4px_-4px_8px_#ffffff] hover:bg-red-600 active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)]",
          variant === "success" &&
            "bg-green-600 text-white shadow-[4px_4px_8px_#b8bec5,-4px_-4px_8px_#ffffff] hover:bg-green-700 active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)]",
          variant === "ghost" && "hover:bg-black/5 text-slate-700",
          variant === "inset" &&
            "bg-[#e9eef5] text-slate-700 shadow-[inset_3px_3px_6px_#b8bec5,inset_-3px_-3px_6px_#ffffff]",

          className,
        )}
        {...props}
      />
    );
  },
);
NeumorphicButton.displayName = "NeumorphicButton";

export { NeumorphicButton };
