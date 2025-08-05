import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatNumber, formatPercentage } from '../utils/numberUtils';

interface GaugeChartProps {
  currentValue: number;
  targetValue: number;
  title?: string;
  subtitle?: string;
  showDetails?: boolean;
  className?: string;
  height?: number;
  width?: number;
  showAnimation?: boolean;
  minValue?: number;
  maxValue?: number;
  colorScheme?: 'default' | 'blue' | 'purple' | 'green';
}

export function GaugeChart({
  currentValue,
  targetValue,
  title = 'نسبة تحقيق الأهداف',
  subtitle,
  showDetails = true,
  className = '',
  height = 400,
  width = 600,
  showAnimation = true,
  minValue = 0,
  maxValue,
  colorScheme = 'default'
}: GaugeChartProps) {
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Calculate percentage with a maximum of 150%
  const percentage = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 150) : 0;
  
  // Determine status based on percentage
  const getStatus = () => {
    if (percentage >= 100) return 'ممتاز';
    if (percentage >= 80) return 'جيد جداً';
    if (percentage >= 60) return 'جيد';
    if (percentage >= 40) return 'مقبول';
    return 'ضعيف';
  };
  
  // Get color scheme
  const getColorScheme = () => {
    switch (colorScheme) {
      case 'blue':
        return {
          low: '#93c5fd', // blue-300
          medium: '#3b82f6', // blue-500
          high: '#1d4ed8', // blue-700
          background: '#eff6ff', // blue-50
        };
      case 'purple':
        return {
          low: '#c4b5fd', // purple-300
          medium: '#8b5cf6', // purple-500
          high: '#6d28d9', // purple-700
          background: '#f5f3ff', // purple-50
        };
      case 'green':
        return {
          low: '#86efac', // green-300
          medium: '#22c55e', // green-500
          high: '#15803d', // green-700
          background: '#f0fdf4', // green-50
        };
      default:
        return {
          low: '#ef4444', // red
          medium: '#f59e0b', // amber
          high: '#10b981', // green
          background: '#f9fafb', // gray-50
        };
    }
  };
  
  // Get color based on percentage
  const getColor = (pct: number) => {
    const colors = getColorScheme();
    if (pct >= 100) return colors.high;
    if (pct >= 60) return colors.medium;
    return colors.low;
  };
  
  // Calculate needle rotation using the provided formula
  // 0% = 0 degrees, 100% = 120 degrees, 150% = 180 degrees
  const getNeedleRotation = () => {
    const angle = Math.min((currentValue / targetValue) * 100, 150) * (180 / 150);
    return angle - 90; // Adjust by -90 degrees to start from the bottom
  };
  
  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        setAnimationComplete(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    } else {
      setAnimationComplete(true);
    }
  }, [showAnimation]);

  const colors = getColorScheme();

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`} style={{ height, width }}>
      {/* Header */}
      {title && (
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      )}
      
      {/* Gauge */}
      <div className="relative h-[calc(100%-8rem)] w-full flex items-center justify-center">
        <div className="relative" style={{ width: '90%', height: '90%' }}>
          <svg viewBox="0 0 200 120" className="w-full">
            {/* Gauge Background */}
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y1="0%">
                <stop offset="0%" stopColor={colors.low} />
                <stop offset="50%" stopColor={colors.medium} />
                <stop offset="100%" stopColor={colors.high} />
              </linearGradient>
            </defs>
            
            {/* Gauge Track */}
            <path 
              d="M20,100 A80,80 0 0,1 180,100" 
              fill="none" 
              stroke="#e5e7eb" 
              strokeWidth="10" 
              strokeLinecap="round"
            />
            
            {/* Gauge Progress - Fixed to use percentage directly */}
            <motion.path 
              d="M20,100 A80,80 0 0,1 20,100" 
              fill="none" 
              stroke="url(#gaugeGradient)" 
              strokeWidth="10" 
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ 
                pathLength: percentage / 150,
                d: percentage <= 0 
                  ? "M20,100 A80,80 0 0,1 20,100" 
                  : percentage >= 150 
                    ? "M20,100 A80,80 0 0,1 180,100"
                    : `M20,100 A80,80 0 0,1 ${20 + (percentage / 150) * 160},${100 - Math.sin((percentage / 150) * Math.PI) * 80}`
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            
            {/* Ticks and Labels */}
            {[0, 25, 50, 75, 100, 125, 150].map((tick) => {
              // Calculate position on the arc
              const angle = -Math.PI + (tick / 150) * Math.PI;
              const x = 100 + 80 * Math.cos(angle);
              const y = 100 + 80 * Math.sin(angle);
              const textX = 100 + 95 * Math.cos(angle);
              const textY = 100 + 95 * Math.sin(angle);
              
              return (
                <g key={tick}>
                  <line 
                    x1={x} 
                    y1={y} 
                    x2={100 + 88 * Math.cos(angle)} 
                    y2={100 + 88 * Math.sin(angle)} 
                    stroke="#6b7280" 
                    strokeWidth="2"
                  />
                  <text 
                    x={textX} 
                    y={textY} 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    fill="#6b7280" 
                    fontSize="8"
                  >
                    {tick}%
                  </text>
                </g>
              );
            })}
            
            {/* Target Marker */}
            <g>
              <motion.circle
                cx={100 + 80 * Math.cos(-Math.PI + (100 / 150) * Math.PI)}
                cy={100 + 80 * Math.sin(-Math.PI + (100 / 150) * Math.PI)}
                r="4"
                fill="#ef4444"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
              />
              <motion.text
                x={100 + 95 * Math.cos(-Math.PI + (100 / 150) * Math.PI)}
                y={100 + 95 * Math.sin(-Math.PI + (100 / 150) * Math.PI)}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ef4444"
                fontSize="8"
                fontWeight="bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                الهدف
              </motion.text>
            </g>
            
            {/* Needle */}
            <motion.g
              initial={{ rotate: -90, originX: 100, originY: 100 }}
              animate={{ rotate: getNeedleRotation() }}
              transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.5 }}
            >
              <line 
                x1="100" 
                y1="100" 
                x2="100" 
                y2="30" 
                stroke={getColor(percentage)} 
                strokeWidth="2"
              />
              <circle 
                cx="100" 
                cy="100" 
                r="8" 
                fill={getColor(percentage)} 
              />
              <circle 
                cx="100" 
                cy="100" 
                r="4" 
                fill="white" 
              />
            </motion.g>
            
            {/* Current Value Display */}
            <motion.g
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <text 
                x="100" 
                y="75" 
                textAnchor="middle" 
                fill={getColor(percentage)} 
                fontSize="16" 
                fontWeight="bold"
              >
                {formatPercentage(percentage)}
              </text>
              <text 
                x="100" 
                y="85" 
                textAnchor="middle" 
                fill="#6b7280" 
                fontSize="8"
              >
                من الهدف
              </text>
            </motion.g>
          </svg>
          
          {/* Celebration effects */}
          {percentage >= 100 && animationComplete && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{ 
                    top: '100%', 
                    left: `${10 + (i * 8)}%`,
                    opacity: 0
                  }}
                  animate={{ 
                    top: `${Math.random() * 100}%`,
                    opacity: [0, 1, 0],
                    scale: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 2 + Math.random() * 2,
                    delay: Math.random() * 2,
                    repeat: Infinity,
                    repeatType: 'loop'
                  }}
                >
                  <span className="text-xl">
                    {['🎉', '✨', '🌟', '⭐', '🏆'][i % 5]}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Footer with details */}
      {showDetails && (
        <div className="p-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 p-2 rounded-lg">
              <div className="text-xs text-gray-500">الحالي</div>
              <div className="text-sm font-bold tabular-nums">{formatNumber(currentValue)}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg">
              <div className="text-xs text-gray-500">الهدف</div>
              <div className="text-sm font-bold tabular-nums">{formatNumber(targetValue)}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg">
              <div className="text-xs text-gray-500">التقييم</div>
              <div className="text-sm font-bold" style={{ color: getColor(percentage) }}>
                {getStatus()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}