import * as React from "react";
import { cn } from "../../lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const NeumorphicTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-xl bg-[#e9eef5] px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-shadow resize-y",
          "shadow-[inset_4px_4px_8px_#b8bec5,inset_-4px_-4px_8px_#ffffff]",
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
