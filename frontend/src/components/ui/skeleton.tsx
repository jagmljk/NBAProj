import { cn } from "../../lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "text";
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  const variants = {
    default: "rounded-md",
    circular: "rounded-full",
    text: "rounded h-4",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-slate-700/50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

// Pre-built skeleton components for common use cases
function SkeletonCard() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton variant="circular" className="h-12 w-12" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}

function SkeletonGameCard() {
  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton variant="circular" className="h-10 w-10" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-12" />
        <div className="flex items-center space-x-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton variant="circular" className="h-10 w-10" />
        </div>
      </div>
      <Skeleton className="h-2 w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

function SkeletonTeamCard() {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center space-x-4">
        <Skeleton variant="circular" className="h-16 w-16" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

function SkeletonStatCard() {
  return (
    <div className="glass-card p-6">
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-8 w-24 mb-4" />
      <Skeleton className="h-2 w-full" />
    </div>
  );
}

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex space-x-4 p-3 bg-surface-elevated/50 rounded-lg">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4 p-3">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonGameCard,
  SkeletonTeamCard,
  SkeletonStatCard,
  SkeletonTable
};
