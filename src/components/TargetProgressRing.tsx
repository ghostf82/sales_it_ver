import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatNumber, formatPercentage } from '../utils/numberUtils';

interface TargetProgressRingProps {
  currentValue: number;
  targetValue: number;
  title?: string;
  subtitle?: string;
  primaryColor?: string;
  secondaryColor?: string;
  size?: number;
  thickness?: number;
  showAnimation?: boolean;
  className?: string;
}

export function TargetProgressRing({
  currentValue,
  targetValue,
  title = 'نسبة تحقيق الأهداف',
  subtitle,
  primaryColor = '#4f46e5', // Indigo
  secondaryColor = '#a855f7', // Purple
  size = 200,
  thickness = 12,
  showAnimation = true,
  className = ''
}: TargetProgressRingProps) {
  const [percentage, setPercentage] = useState(0);
  
  // Calculate the actual percentage
  const actualPercentage = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 100) : 0;
  
  // Calculate the radius and circumference
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate the stroke dash offset
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Determine status based on percentage
  const getStatus = () => {
    if (percentage >= 100) return 'ممتاز';
    if (percentage >= 80) return 'جيد جداً';
    if (percentage >= 60) return 'جيد';
    if (percentage >= 40) return 'مقبول';
    return 'ضعيف';
  };
  
  // Get color based on percentage
  const getColor = (pct: number) => {
    if (pct >= 100) return '#10b981'; // Green
    if (pct >= 80) return primaryColor;
    if (pct >= 60) return secondaryColor;
    if (pct >= 40) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };
  
  useEffect(() => {
    if (showAnimation) {
      // Animate the percentage from 0 to actual value
      let startTimestamp: number | null = null;
      const duration = 1500; // 1.5 seconds
      
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const elapsed = timestamp - startTimestamp;
        
        const progress = Math.min(elapsed / duration, 1);
        setPercentage(progress * actualPercentage);
        
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      
      window.requestAnimationFrame(step);
    } else {
      setPercentage(actualPercentage);
    }
  }, [actualPercentage, showAnimation]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>}
      
      <div className="flex flex-col items-center justify-center">
        <div className="relative" style={{ width: size, height: size }}>
          {/* Background circle */}
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={thickness}
              className="dark:opacity-20"
            />
            
            {/* Progress circle */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={getColor(percentage)}
              strokeWidth={thickness}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-3xl font-bold"
              style={{ color: getColor(percentage) }}
            >
              {formatPercentage(percentage)}
            </motion.div>
            
            {subtitle && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="text-sm text-gray-500 dark:text-gray-400 mt-1"
              >
                {subtitle}
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Details */}
        <div className="mt-6 w-full grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">الحالي</div>
            <div className="text-lg font-bold tabular-nums">{formatNumber(currentValue)}</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">الهدف</div>
            <div className="text-lg font-bold tabular-nums">{formatNumber(targetValue)}</div>
          </div>
        </div>
        
        {/* Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="mt-4 px-4 py-2 rounded-full text-white text-sm font-medium"
          style={{ backgroundColor: getColor(percentage) }}
        >
          {getStatus()}
        </motion.div>
        
        {/* Celebration effects for 100% achievement */}
        {percentage >= 100 && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.5 }}
          >
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ 
                  top: '50%', 
                  left: '50%',
                  opacity: 0
                }}
                animate={{ 
                  top: `${10 + Math.random() * 80}%`,
                  left: `${10 + Math.random() * 80}%`,
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 2 + Math.random() * 2,
                  delay: 1.5 + Math.random(),
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
  );
}