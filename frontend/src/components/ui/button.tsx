import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-red/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 disabled:saturate-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary-red hover:bg-primary-crimson text-white shadow-sm hover:shadow-glow-red active:scale-[0.98]",
        secondary:
          "bg-surface-elevated hover:bg-surface-hover text-white border border-surface-border active:scale-[0.98]",
        outline:
          "border border-surface-border bg-transparent hover:bg-surface-elevated hover:border-surface-hover text-content-secondary hover:text-white",
        ghost:
          "hover:bg-surface-elevated text-content-secondary hover:text-white",
        destructive:
          "bg-error hover:bg-error/90 text-white active:scale-[0.98]",
        link:
          "text-primary-red underline-offset-4 hover:underline p-0 h-auto",
        success:
          "bg-success hover:bg-success/90 text-white shadow-sm hover:shadow-glow-success active:scale-[0.98]",
        info:
          "bg-accent-blue hover:bg-accent-blue/90 text-white shadow-sm hover:shadow-glow-blue active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8",
        xl: "h-14 rounded-xl px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </span>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
