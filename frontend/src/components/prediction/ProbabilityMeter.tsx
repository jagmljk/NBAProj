import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn, getProbabilityColor } from '../../lib/utils';

interface ProbabilityMeterProps {
  probability: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showPercentage?: boolean;
  animated?: boolean;
  label?: string;
  teamName?: string;
  className?: string;
}

export function ProbabilityMeter({
  probability,
  size = 'lg',
  showPercentage = true,
  animated = true,
  label,
  teamName,
  className,
}: ProbabilityMeterProps) {
  const [hasAnimated, setHasAnimated] = useState(!animated);

  const sizeConfig = {
    sm: { outer: 80, inner: 64, stroke: 6, fontSize: 'text-lg' },
    md: { outer: 120, inner: 100, stroke: 8, fontSize: 'text-2xl' },
    lg: { outer: 180, inner: 150, stroke: 10, fontSize: 'text-4xl' },
    xl: { outer: 240, inner: 200, stroke: 12, fontSize: 'text-5xl' },
  };

  const config = sizeConfig[size];
  const radius = (config.inner - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Animated value
  const springValue = useSpring(0, { stiffness: 50, damping: 20 });
  const displayValue = useTransform(springValue, (v) => Math.round(v * 100));

  useEffect(() => {
    if (animated && !hasAnimated) {
      const timer = setTimeout(() => {
        springValue.set(probability);
        setHasAnimated(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      springValue.set(probability);
    }
  }, [probability, animated, hasAnimated, springValue]);

  const strokeDashoffset = useTransform(
    springValue,
    (v) => circumference - v * circumference
  );

  const color = getProbabilityColor(probability);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {label && (
        <span className="text-sm text-slate-400 mb-2">{label}</span>
      )}

      <div
        className="relative"
        style={{ width: config.outer, height: config.outer }}
      >
        {/* Background circle */}
        <svg
          className="absolute inset-0"
          width={config.outer}
          height={config.outer}
        >
          <circle
            cx={config.outer / 2}
            cy={config.outer / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.stroke}
            className="text-slate-700/50"
          />
        </svg>

        {/* Progress circle */}
        <motion.svg
          className="absolute inset-0 -rotate-90"
          width={config.outer}
          height={config.outer}
        >
          <motion.circle
            cx={config.outer / 2}
            cy={config.outer / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
            className="filter drop-shadow-lg"
          />
        </motion.svg>

        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-full opacity-20 blur-xl"
          style={{
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          }}
        />

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showPercentage && (
            <motion.span
              className={cn("font-bold text-white", config.fontSize)}
            >
              <motion.span>{displayValue}</motion.span>
              <span className="text-slate-400">%</span>
            </motion.span>
          )}
          {teamName && (
            <span className="text-xs text-slate-400 mt-1 text-center px-2 truncate max-w-full">
              {teamName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact horizontal probability bar
interface ProbabilityBarProps {
  homeProb: number;
  homeTeam: string;
  awayTeam: string;
  showLabels?: boolean;
  className?: string;
}

export function ProbabilityBar({
  homeProb,
  homeTeam,
  awayTeam,
  showLabels = true,
  className,
}: ProbabilityBarProps) {
  const awayProb = 1 - homeProb;

  return (
    <div className={cn("space-y-2", className)}>
      {showLabels && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-300">{homeTeam}</span>
          <span className="text-slate-300">{awayTeam}</span>
        </div>
      )}

      <div className="flex h-3 rounded-full overflow-hidden bg-slate-700/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${homeProb * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-gradient-to-r from-primary-orange to-primary-amber"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${awayProb * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-gradient-to-r from-secondary-blue to-secondary-purple"
        />
      </div>

      <div className="flex justify-between text-xs font-medium">
        <span className="text-primary-orange">{(homeProb * 100).toFixed(1)}%</span>
        <span className="text-secondary-blue">{(awayProb * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
}

// Win probability comparison
interface WinProbabilityComparisonProps {
  homeProb: number;
  homeTeam: string;
  homeAbbr: string;
  awayTeam: string;
  awayAbbr: string;
  className?: string;
}

export function WinProbabilityComparison({
  homeProb,
  homeTeam,
  homeAbbr,
  awayTeam,
  awayAbbr,
  className,
}: WinProbabilityComparisonProps) {
  const awayProb = 1 - homeProb;
  const homeIsWinner = homeProb >= 0.5;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {/* Home team */}
      <div className="flex-1 text-right">
        <div className={cn(
          "text-lg font-bold",
          homeIsWinner ? "text-white" : "text-slate-400"
        )}>
          {homeAbbr}
        </div>
        <div className="text-sm text-slate-400">{homeTeam}</div>
        <div className={cn(
          "text-2xl font-bold",
          homeIsWinner ? "text-primary-orange" : "text-slate-500"
        )}>
          {(homeProb * 100).toFixed(1)}%
        </div>
      </div>

      {/* VS indicator */}
      <div className="flex flex-col items-center">
        <div className="w-px h-8 bg-slate-600" />
        <span className="text-slate-500 text-sm font-medium py-2">VS</span>
        <div className="w-px h-8 bg-slate-600" />
      </div>

      {/* Away team */}
      <div className="flex-1 text-left">
        <div className={cn(
          "text-lg font-bold",
          !homeIsWinner ? "text-white" : "text-slate-400"
        )}>
          {awayAbbr}
        </div>
        <div className="text-sm text-slate-400">{awayTeam}</div>
        <div className={cn(
          "text-2xl font-bold",
          !homeIsWinner ? "text-secondary-blue" : "text-slate-500"
        )}>
          {(awayProb * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
