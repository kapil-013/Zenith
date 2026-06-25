import * as React from "react";
import { cn } from "../../lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const NeumorphicTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-xl bg-[var(--color-civic-surface-inset)] px-4 py-3 text-sm text-[var(--color-civic-text-primary)] placeholder:text-[var(--color-civic-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-civic-primary)]/50 transition-shadow resize-y",
          "shadow-[var(--shadow-neumorphic-inset)] border border-transparent focus:border-[var(--color-civic-border)]/50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
NeumorphicTextarea.displayName = "NeumorphicTextarea";

export { NeumorphicTextarea };
