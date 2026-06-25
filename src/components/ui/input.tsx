import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const NeumorphicInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl bg-[#e9eef5] px-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-shadow",
          "shadow-[inset_4px_4px_8px_#b8bec5,inset_-4px_-4px_8px_#ffffff]",
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
