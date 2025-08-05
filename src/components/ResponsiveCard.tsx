import { ReactNode } from 'react';
import clsx from 'clsx';

interface ResponsiveCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
  subValue?: string;
  change?: number;
  className?: string;
}

export function ResponsiveCard({
  title,
  value,
  icon,
  color = 'blue',
  subValue,
  change,
  className
}: ResponsiveCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      border: 'border-blue-200'
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600',
      border: 'border-green-200'
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      border: 'border-purple-200'
    },
    orange: {
      bg: 'bg-orange-100',
      text: 'text-orange-600',
      border: 'border-orange-200'
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-600',
      border: 'border-red-200'
    },
    gray: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      border: 'border-gray-200'
    }
  };

  const getChangeColor = (changeValue: number) => {
    return changeValue > 0 
      ? 'text-green-500' 
      : changeValue < 0 
        ? 'text-red-500' 
        : 'text-gray-500';
  };

  const getChangeIcon = (changeValue: number) => {
    return changeValue > 0 
      ? '↑' 
      : changeValue < 0 
        ? '↓' 
        : '•';
  };

  return (
    <div className={clsx(
      'bg-white rounded-xl shadow-lg p-4 overflow-hidden',
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base sm:text-lg font-medium truncate">{title}</h3>
        {icon && (
          <div className={clsx('p-2 rounded-lg', colorClasses[color].bg)}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex flex-col">
        <p className={clsx(
          'text-xl sm:text-2xl md:text-3xl font-bold tabular-nums break-words',
          colorClasses[color].text
        )}>
          {value}
        </p>
        
        {(subValue || change !== undefined) && (
          <div className="mt-1 flex items-center gap-1">
            {subValue && (
              <span className="text-xs sm:text-sm text-gray-500">
                {subValue}
              </span>
            )}
            
            {change !== undefined && (
              <span className={clsx('text-xs sm:text-sm flex items-center gap-0.5', getChangeColor(change))}>
                <span>{getChangeIcon(change)}</span>
                <span>{Math.abs(change).toFixed(1)}%</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}