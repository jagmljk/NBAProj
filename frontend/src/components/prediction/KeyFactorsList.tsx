import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { KeyFactor } from '../../types';

interface KeyFactorsListProps {
  factors: KeyFactor[];
  maxFactors?: number;
  animated?: boolean;
  className?: string;
}

export function KeyFactorsList({
  factors,
  maxFactors = 8,
  animated = true,
  className,
}: KeyFactorsListProps) {
  const displayFactors = factors.slice(0, maxFactors);
  const maxValue = Math.max(...factors.map((f) => Math.abs(f.value)));

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive':
        return 'text-success';
      case 'negative':
        return 'text-error';
      default:
        return 'text-slate-400';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive':
        return <TrendingUp className="w-4 h-4" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const formatFactorName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/DIFF /i, '')
      .replace(/HOME |AWAY /i, '')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <motion.div
      variants={animated ? container : undefined}
      initial={animated ? "hidden" : undefined}
      animate={animated ? "show" : undefined}
      className={cn("space-y-3", className)}
    >
      {displayFactors.map((factor, index) => (
        <motion.div
          key={factor.name}
          variants={animated ? item : undefined}
          className="group"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className={getImpactColor(factor.impact)}>
                {getImpactIcon(factor.impact)}
              </span>
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                {formatFactorName(factor.name)}
              </span>
            </div>
            <span className={cn(
              "text-sm font-mono font-medium",
              factor.value > 0 ? "text-success" : factor.value < 0 ? "text-error" : "text-slate-400"
            )}>
              {factor.value > 0 ? '+' : ''}{factor.value.toFixed(3)}
            </span>
          </div>

          {/* Impact bar */}
          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(Math.abs(factor.value) / maxValue) * 100}%` }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className={cn(
                "h-full rounded-full",
                factor.impact === 'positive' && "bg-gradient-to-r from-success/60 to-success",
                factor.impact === 'negative' && "bg-gradient-to-r from-error/60 to-error",
                factor.impact === 'neutral' && "bg-slate-500"
              )}
            />
          </div>

          {/* Description tooltip */}
          {factor.description && (
            <p className="text-xs text-slate-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {factor.description}
            </p>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Compact version for smaller spaces
interface CompactFactorsProps {
  factors: KeyFactor[];
  maxFactors?: number;
}

export function CompactFactors({ factors, maxFactors = 3 }: CompactFactorsProps) {
  const displayFactors = factors.slice(0, maxFactors);

  return (
    <div className="flex flex-wrap gap-2">
      {displayFactors.map((factor) => (
        <div
          key={factor.name}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
            factor.impact === 'positive' && "bg-success/20 text-success",
            factor.impact === 'negative' && "bg-error/20 text-error",
            factor.impact === 'neutral' && "bg-slate-500/20 text-slate-400"
          )}
        >
          {factor.impact === 'positive' ? (
            <TrendingUp className="w-3 h-3" />
          ) : factor.impact === 'negative' ? (
            <TrendingDown className="w-3 h-3" />
          ) : (
            <Minus className="w-3 h-3" />
          )}
          <span>{factor.name.replace(/_/g, ' ').substring(0, 15)}</span>
        </div>
      ))}
    </div>
  );
}
