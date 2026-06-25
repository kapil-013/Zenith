import * as React from "react";
import { cn } from "../../lib/utils";

const NeumorphicCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl bg-[#e9eef5] shadow-[6px_6px_12px_#b8bec5,-6px_-6px_12px_#ffffff] border border-white/40",
      className,
    )}
    {...props}
  />
));
NeumorphicCard.displayName = "NeumorphicCard";

const NeumorphicCardInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl bg-[#e9eef5] shadow-[inset_4px_4px_8px_#b8bec5,inset_-4px_-4px_8px_#ffffff]",
      className,
    )}
    {...props}
  />
));
NeumorphicCardInset.displayName = "NeumorphicCardInset";

export { NeumorphicCard, NeumorphicCardInset };
