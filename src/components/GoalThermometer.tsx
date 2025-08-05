import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatNumber, formatPercentage } from '../utils/numberUtils';

interface GoalThermometerProps {
  currentValue: number;
  targetValue: number;
  title?: string;
  showDetails?: boolean;
  className?: string;
  height?: number;
  milestones?: { value: number; label: string }[];
}

export function GoalThermometer({
  currentValue,
  targetValue,
  title = 'نسبة تحقيق الأهداف',
  showDetails = true,
  className = '',
  height = 400,
  milestones = []
}: GoalThermometerProps) {
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Calculate percentage with a maximum of 120%
  const percentage = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 120) : 0;
  
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
    if (pct >= 80) return '#6366f1'; // Indigo
    if (pct >= 60) return '#8b5cf6'; // Purple
    if (pct >= 40) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };
  
  // Default milestones if none provided
  const defaultMilestones = [
    { value: 25, label: 'ربع الهدف' },
    { value: 50, label: 'نصف الهدف' },
    { value: 75, label: 'ثلاثة أرباع' },
    { value: 100, label: 'الهدف' }
  ];
  
  // Use provided milestones or defaults
  const displayMilestones = milestones.length > 0 ? milestones : defaultMilestones;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${className}`} style={{ height: `${height}px` }}>
      {/* Header */}
      {title && (
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      )}
      
      {/* Visualization */}
      <div className="relative h-[calc(100%-8rem)] w-full p-6 flex justify-center">
        {/* Thermometer container */}
        <div className="relative w-20 h-full">
          {/* Thermometer background */}
          <div className="absolute left-1/2 top-0 bottom-0 w-6 bg-gray-200 dark:bg-gray-700 rounded-full transform -translate-x-1/2" />
          
          {/* Thermometer bulb */}
          <div className="absolute left-1/2 bottom-0 w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full transform -translate-x-1/2" />
          
          {/* Thermometer fill */}
          <motion.div 
            className="absolute left-1/2 bottom-0 w-16 h-16 rounded-full transform -translate-x-1/2 z-10"
            initial={{ backgroundColor: '#ef4444' }}
            animate={{ backgroundColor: getColor(percentage) }}
            transition={{ duration: 1 }}
          />
          
          <motion.div 
            className="absolute left-1/2 bottom-0 w-6 rounded-t-full transform -translate-x-1/2 z-10"
            initial={{ height: '0%' }}
            animate={{ 
              height: `${Math.min(percentage, 100)}%`,
              backgroundColor: getColor(percentage)
            }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
          
          {/* Milestones */}
          {displayMilestones.map((milestone, index) => (
            <div 
              key={index}
              className="absolute left-0 right-0 flex items-center"
              style={{ bottom: `${milestone.value}%` }}
            >
              <div className="w-3 h-1 bg-gray-400 dark:bg-gray-500" />
              <div className="flex-1 border-t border-dashed border-gray-300 dark:border-gray-600" />
              <div className="absolute right-full mr-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {milestone.label}
              </div>
            </div>
          ))}
          
          {/* Current value indicator */}
          <motion.div
            className="absolute right-full z-20"
            initial={{ opacity: 0, bottom: '0%' }}
            animate={{ 
              opacity: 1, 
              bottom: `${Math.min(percentage, 100)}%` 
            }}
            transition={{ duration: 2, ease: "easeOut" }}
          >
            <div className="mr-2 px-2 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <span className="text-sm font-medium" style={{ color: getColor(percentage) }}>
                {formatNumber(currentValue)}
              </span>
            </div>
          </motion.div>
          
          {/* Percentage indicator */}
          <motion.div
            className="absolute left-full z-20"
            initial={{ opacity: 0, bottom: '0%' }}
            animate={{ 
              opacity: 1, 
              bottom: `${Math.min(percentage, 100)}%` 
            }}
            transition={{ duration: 2, ease: "easeOut" }}
          >
            <div className="ml-2 px-2 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <span className="text-sm font-medium" style={{ color: getColor(percentage) }}>
                {formatPercentage(percentage)}
              </span>
            </div>
          </motion.div>
        </div>
        
        {/* Celebration effects */}
        {percentage >= 100 && animationComplete && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-30"
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
      
      {/* Footer with details */}
      {showDetails && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 dark:bg-gray-700/30 p-2 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400">الحالي</div>
              <div className="text-sm font-bold tabular-nums">{formatNumber(currentValue)}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/30 p-2 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400">الهدف</div>
              <div className="text-sm font-bold tabular-nums">{formatNumber(targetValue)}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/30 p-2 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400">التقييم</div>
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