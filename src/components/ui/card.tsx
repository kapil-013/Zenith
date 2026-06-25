import * as React from "react";
import { cn } from "../../lib/utils";

const NeumorphicCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl bg-[var(--color-civic-surface)] shadow-[var(--shadow-neumorphic)] border border-[var(--color-civic-border)]",
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
      "rounded-2xl bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] border border-[var(--color-civic-border)]/50",
      className,
    )}
    {...props}
  />
));
NeumorphicCardInset.displayName = "NeumorphicCardInset";

export { NeumorphicCard, NeumorphicCardInset };
