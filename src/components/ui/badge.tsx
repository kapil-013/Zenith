import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "primary" | "admin" | "department";
}

function NeumorphicBadge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold transition-colors shadow-[var(--shadow-neumorphic)] border border-[var(--color-civic-border)]/50",
        variant === "default" && "bg-[var(--color-civic-surface)] text-[var(--color-civic-text-primary)]",
        variant === "success" &&
          "bg-[var(--color-civic-status-confirmed)] text-white shadow-[var(--shadow-neumorphic-floating)]",
        variant === "warning" &&
          "bg-[var(--color-civic-priority-medium)] text-white shadow-[var(--shadow-neumorphic-floating)]",
        variant === "danger" &&
          "bg-[var(--color-civic-danger)] text-white shadow-[var(--shadow-neumorphic-floating)]",
        variant === "info" &&
          "bg-[var(--color-civic-status-open)] text-white",
        variant === "primary" &&
          "bg-[var(--color-civic-primary)] text-white shadow-[var(--shadow-neumorphic-floating)]",
        variant === "admin" &&
          "bg-[var(--color-civic-admin)] text-white shadow-[var(--shadow-neumorphic-floating)]",
        variant === "department" &&
          "bg-[var(--color-civic-department)] text-white shadow-[var(--shadow-neumorphic-floating)]",
        className,
      )}
      {...props}
    />
  );
}

export { NeumorphicBadge };
