import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const NeumorphicInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl bg-[var(--color-civic-surface-inset)] px-4 py-2 text-sm text-[var(--color-civic-text-primary)] placeholder:text-[var(--color-civic-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-civic-primary)]/50 transition-shadow",
          "shadow-[var(--shadow-neumorphic-inset)] border border-transparent focus:border-[var(--color-civic-border)]/50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
NeumorphicInput.displayName = "NeumorphicInput";

export { NeumorphicInput };
