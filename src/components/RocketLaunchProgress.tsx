import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatNumber, formatPercentage } from '../utils/numberUtils';

interface RocketLaunchProgressProps {
  currentValue: number;
  targetValue: number;
  title?: string;
  showDetails?: boolean;
  className?: string;
  height?: number;
}

export function RocketLaunchProgress({
  currentValue,
  targetValue,
  title = 'نسبة تحقيق الأهداف',
  showDetails = true,
  className = '',
  height = 400
}: RocketLaunchProgressProps) {
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
  
  // Get color based on percentage
  const getColor = (pct: number) => {
    if (pct >= 100) return '#10b981'; // Green
    if (pct >= 80) return '#6366f1'; // Indigo
    if (pct >= 60) return '#8b5cf6'; // Purple
    if (pct >= 40) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  // Calculate rocket position
  const rocketPosition = Math.min(percentage, 100);
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${className}`} style={{ height: `${height}px` }}>
      {/* Header */}
      {title && (
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      )}
      
      {/* Visualization */}
      <div className="relative h-[calc(100%-8rem)] w-full overflow-hidden">
        {/* Space background */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 via-purple-900 to-gray-900" />
        
        {/* Stars */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
        
        {/* Target line (100%) */}
        <div className="absolute left-0 right-0 border-t-2 border-dashed border-green-400 z-10" style={{ top: '0%' }}>
          <div className="absolute bottom-0 right-4 transform translate-y-full bg-green-500 text-white text-xs px-2 py-1 rounded-b">
            الهدف: {formatNumber(targetValue)}
          </div>
        </div>
        
        {/* Progress track */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-300/20 transform -translate-x-1/2" />
        
        {/* Rocket */}
        <motion.div
          className="absolute left-1/2 z-20 transform -translate-x-1/2"
          initial={{ bottom: '0%' }}
          animate={{ 
            bottom: `${rocketPosition}%`
          }}
          transition={{ duration: 2, ease: "easeOut" }}
          style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' }}
        >
          <div className="relative">
            <motion.div
              animate={{ 
                y: [0, 5, 0],
                rotate: [-5, 5, -5]
              }}
              transition={{ 
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut"
              }}
            >
              <span className="text-4xl">🚀</span>
              
              {/* Rocket flames */}
              <motion.div
                className="absolute -bottom-3 left-1/2 transform -translate-x-1/2"
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.5,
                }}
              >
                <span className="text-2xl">🔥</span>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Current value indicator */}
        <motion.div
          className="absolute left-0 z-10 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-lg"
          initial={{ opacity: 0, bottom: '0%' }}
          animate={{ 
            opacity: 1, 
            bottom: `${rocketPosition}%` 
          }}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          <span className="text-sm font-medium" style={{ color: getColor(percentage) }}>
            {formatNumber(currentValue)}
          </span>
        </motion.div>
        
        {/* Percentage indicator */}
        <motion.div
          className="absolute right-0 z-10 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-lg"
          initial={{ opacity: 0, bottom: '0%' }}
          animate={{ 
            opacity: 1, 
            bottom: `${rocketPosition}%` 
          }}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          <span className="text-sm font-medium" style={{ color: getColor(percentage) }}>
            {formatPercentage(percentage)}
          </span>
        </motion.div>
        
        {/* Celebration effects */}
        {percentage >= 100 && animationComplete && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ 
                  top: '0%', 
                  left: `${10 + (i * 5)}%`,
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
                  {['🎉', '✨', '🌟', '⭐', '🏆', '🔥', '💫'][i % 7]}
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