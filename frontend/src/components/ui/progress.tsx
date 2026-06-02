import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "../../lib/utils";

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-slate-700/50",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 bg-gradient-to-r from-primary-orange to-primary-amber transition-all duration-500 ease-out",
        indicatorClassName
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

// Animated progress bar
interface AnimatedProgressProps {
  value: number;
  max?: number;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "orange" | "blue" | "green" | "red";
  animated?: boolean;
}

function AnimatedProgress({
  value,
  max = 100,
  showValue = true,
  size = "md",
  color = "orange",
  animated = true,
}: AnimatedProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const colorClasses = {
    orange: "from-primary-orange to-primary-amber",
    blue: "from-secondary-blue to-secondary-purple",
    green: "from-success to-emerald-400",
    red: "from-error to-rose-400",
  };

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-slate-700/50",
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out",
            colorClasses[color],
            animated && "animate-pulse-slow"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <div className="flex justify-between text-xs text-slate-400">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}

export { Progress, AnimatedProgress };
