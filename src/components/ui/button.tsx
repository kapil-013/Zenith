import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "danger" | "admin" | "department" | "ghost" | "inset";
  size?: "default" | "sm" | "lg" | "icon";
}

const NeumorphicButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-civic-primary)] disabled:opacity-50 disabled:pointer-events-none",

          // Sizes
          size === "default" && "h-11 px-6 py-2",
          size === "sm" && "h-9 px-4 text-sm rounded-lg",
          size === "lg" && "h-14 px-8 text-lg rounded-2xl",
          size === "icon" && "h-11 w-11",

          // Variants
          variant === "default" &&
            "bg-[var(--color-civic-surface)] text-[var(--color-civic-text-primary)] shadow-[var(--shadow-neumorphic)] hover:translate-y-[-1px] hover:shadow-[var(--shadow-neumorphic-floating)] active:translate-y-[1px] active:shadow-[var(--shadow-neumorphic-inset)] border border-[var(--color-civic-border)]/50",
          variant === "secondary" &&
            "bg-[var(--color-civic-surface-inset)] text-[var(--color-civic-text-primary)] shadow-[var(--shadow-neumorphic-inset)] hover:bg-[var(--color-civic-surface)] hover:shadow-[var(--shadow-neumorphic)] border border-[var(--color-civic-border)]/50",
          variant === "primary" &&
            "bg-[var(--color-civic-primary)] text-white shadow-[var(--shadow-neumorphic)] hover:bg-[var(--color-civic-primary-dark)] hover:shadow-[var(--shadow-neumorphic-floating)] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)]",
          variant === "success" &&
            "bg-[var(--color-civic-status-confirmed)] text-white shadow-[var(--shadow-neumorphic)] hover:brightness-95 hover:shadow-[var(--shadow-neumorphic-floating)] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)]",
          variant === "warning" &&
            "bg-[var(--color-civic-priority-medium)] text-white shadow-[var(--shadow-neumorphic)] hover:brightness-95 hover:shadow-[var(--shadow-neumorphic-floating)] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)]",
          variant === "danger" &&
            "bg-[var(--color-civic-danger)] text-white shadow-[var(--shadow-neumorphic)] hover:brightness-95 hover:shadow-[var(--shadow-neumorphic-floating)] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)]",
          variant === "admin" &&
            "bg-[var(--color-civic-admin)] text-white shadow-[var(--shadow-neumorphic)] hover:brightness-95 hover:shadow-[var(--shadow-neumorphic-floating)] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)]",
          variant === "department" &&
            "bg-[var(--color-civic-department)] text-white shadow-[var(--shadow-neumorphic)] hover:brightness-95 hover:shadow-[var(--shadow-neumorphic-floating)] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)]",
          variant === "ghost" && 
            "hover:bg-[var(--color-civic-surface-inset)] text-[var(--color-civic-text-primary)] hover:shadow-[var(--shadow-neumorphic-inset)] border border-transparent",
          variant === "inset" &&
            "bg-[var(--color-civic-surface-inset)] text-[var(--color-civic-text-primary)] shadow-[var(--shadow-neumorphic-inset)]",

          className,
        )}
        {...props}
      />
    );
  },
);
NeumorphicButton.displayName = "NeumorphicButton";

export { NeumorphicButton };
