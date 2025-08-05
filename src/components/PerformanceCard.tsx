import { ReactNode } from 'react';
import clsx from 'clsx';

interface PerformanceCardProps {
  title: string;
  rank: number;
  name: string;
  value: string | number;
  icon?: ReactNode;
  className?: string;
}

export function PerformanceCard({
  title,
  rank,
  name,
  value,
  icon,
  className
}: PerformanceCardProps) {
  // Medal emojis for top 3
  const medals = ['🥇', '🥈', '🥉'];
  
  // Background colors for rank badges
  const rankColors = [
    'bg-gradient-to-br from-yellow-400 to-yellow-600', // Gold
    'bg-gradient-to-br from-gray-300 to-gray-500',     // Silver
    'bg-gradient-to-br from-amber-600 to-amber-800'    // Bronze
  ];

  return (
    <div className={clsx(
      'bg-white rounded-xl shadow-lg p-4 overflow-hidden',
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gray-100 rounded-full">
            <span className="text-lg sm:text-xl">{medals[rank - 1] || `#${rank}`}</span>
          </div>
          <h3 className="text-sm sm:text-base font-medium truncate">{title}</h3>
        </div>
        {icon}
      </div>
      
      <div className="flex items-center gap-3">
        <div className={clsx(
          'w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-lg font-bold',
          rank <= 3 ? rankColors[rank - 1] : 'bg-gray-400'
        )}>
          {name.charAt(0)}
        </div>
        
        <div className="overflow-hidden">
          <p className="font-medium text-sm sm:text-base truncate">{name}</p>
          <p className="text-gray-600 text-xs sm:text-sm tabular-nums">{value}</p>
        </div>
      </div>
    </div>
  );
}