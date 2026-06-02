import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-primary-red/30 bg-primary-red/15 text-primary-red",
        secondary:
          "border-accent-blue/30 bg-accent-blue/15 text-accent-blue",
        success:
          "border-success/30 bg-success/15 text-success",
        warning:
          "border-warning/30 bg-warning/15 text-warning",
        error:
          "border-error/30 bg-error/15 text-error",
        outline:
          "border-surface-border bg-surface-elevated text-content-secondary",
        high:
          "border-success/30 bg-success/15 text-success",
        medium:
          "border-warning/30 bg-warning/15 text-warning",
        low:
          "border-surface-border bg-surface-elevated text-content-tertiary",
        live:
          "border-error/40 bg-error/20 text-error animate-pulse-live",
        info:
          "border-info/30 bg-info/15 text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// Confidence tier badge component
interface ConfidenceBadgeProps {
  tier: "HIGH" | "MEDIUM" | "LOW" | string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

function ConfidenceBadge({ tier, showLabel = true, size = "md" }: ConfidenceBadgeProps) {
  const variant = tier.toLowerCase() as "high" | "medium" | "low";
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm",
  };

  return (
    <Badge variant={variant} className={sizeClasses[size]}>
      {showLabel ? `${tier} Confidence` : tier}
    </Badge>
  );
}

export { Badge, badgeVariants, ConfidenceBadge };
