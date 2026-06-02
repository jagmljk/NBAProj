import { useState } from 'react';
import { cn, getTeamLogoUrl, getTeamColorClass } from '../../lib/utils';

interface TeamLogoProps {
  teamAbbr: string;
  teamId?: number;
  teamName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showFallback?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-24 h-24 text-2xl',
};

export function TeamLogo({
  teamAbbr,
  teamId,
  teamName,
  size = 'md',
  className,
  showFallback = true,
}: TeamLogoProps) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = getTeamLogoUrl(teamAbbr, teamId);

  if (imgError && showFallback) {
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold text-white',
          sizeClasses[size],
          getTeamColorClass(teamAbbr),
          className
        )}
        title={teamName || teamAbbr}
      >
        {teamAbbr}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center overflow-hidden bg-white/5 shrink-0',
        sizeClasses[size],
        className
      )}
      title={teamName || teamAbbr}
    >
      <img
        src={logoUrl}
        alt={teamName || teamAbbr}
        className="w-full h-full object-contain p-0.5"
        style={{ imageRendering: 'crisp-edges' }}
        onError={() => setImgError(true)}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
