import React, { useState } from 'react';
import { Rocket, Sparkles } from 'lucide-react';

export interface NitroBadgeProps {
  size?: 'xs' | 'sm' | 'md';
  isBooster?: boolean;
  tooltipText?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const NitroBadge: React.FC<NitroBadgeProps> = ({
  size = 'sm',
  isBooster = false,
  tooltipText,
  className = '',
  onClick
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Sizing tokens matching Discord's badge metrics
  const sizeMap = {
    xs: {
      container: 'w-3.5 h-3.5 rounded-[3px]',
      icon: 'w-2.5 h-2.5'
    },
    sm: {
      container: 'w-4 h-4 rounded-[4px]',
      icon: 'w-3 h-3'
    },
    md: {
      container: 'w-5 h-5 rounded-[5px]',
      icon: 'w-3.5 h-3.5'
    }
  };

  const currentSize = sizeMap[size] || sizeMap.sm;
  const label = tooltipText || (isBooster ? 'Server Booster' : 'Discord Nitro');

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 group/badge select-none ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={onClick}
    >
      {/* Discord Badge Tile with Subtle Glowing Border & Animated Hover Shimmer */}
      <div
        className={`${currentSize.container} flex items-center justify-center nitro-badge-glow nitro-badge-shine-effect transition-all duration-200 ease-out group-hover/badge:scale-120 cursor-pointer overflow-hidden relative`}
        style={{
          background: isBooster
            ? 'linear-gradient(135deg, #f47fff 0%, #eb459e 50%, #9a3cd6 100%)'
            : 'linear-gradient(135deg, #f47fff 0%, #eb459e 45%, #5865f2 100%)',
        }}
        aria-label={label}
        role="img"
      >
        {isBooster ? (
          <Rocket className={`${currentSize.icon} text-white fill-white drop-shadow-xs transition-transform duration-150 group-hover/badge:scale-110`} />
        ) : (
          /* Official Discord Nitro 3D Faceted Crystal Gem */
          <svg
            viewBox="0 0 16 16"
            className={`${currentSize.icon} drop-shadow-xs transition-transform duration-150 group-hover/badge:scale-110`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Top facet */}
            <path d="M8 2L13 5.5L8 9L3 5.5L8 2Z" fill="white" />
            {/* Left facet */}
            <path d="M3 6.8L7.4 9.6V14.2L3 11.4V6.8Z" fill="white" fillOpacity="0.75" />
            {/* Right facet */}
            <path d="M13 6.8L8.6 9.6V14.2L13 11.4V6.8Z" fill="white" fillOpacity="0.92" />
          </svg>
        )}
      </div>

      {/* Discord Floating Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none discord-pop flex flex-col items-center">
          <div className="bg-[#111214] text-[#f2f3f5] text-[12px] font-semibold px-2.5 py-1.5 rounded-[4px] shadow-2xl border border-[#232428] whitespace-nowrap flex items-center gap-1.5 tracking-tight">
            {isBooster ? (
              <Rocket className="w-3.5 h-3.5 text-[#eb459e] fill-current" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[#eb459e] fill-current" />
            )}
            <span>{label}</span>
          </div>
          {/* Tooltip triangle notch */}
          <div className="w-2 h-2 bg-[#111214] rotate-45 -mt-1 border-r border-b border-[#232428]" />
        </div>
      )}
    </div>
  );
};
