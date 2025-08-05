import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Flag, TrendingUp, Award } from 'lucide-react';
import { formatNumber, formatPercentage } from '../utils/numberUtils';

interface GoalAchievementMeterProps {
  currentValue: number;
  targetValue: number;
  title?: string;
  primaryColor?: string;
  secondaryColor?: string;
  showAnimation?: boolean;
  showDetails?: boolean;
  icon?: 'trophy' | 'target' | 'flag' | 'trending' | 'award';
  className?: string;
  height?: number;
}

export function GoalAchievementMeter({
  currentValue,
  targetValue,
  title = 'نسبة تحقيق الأهداف',
  primaryColor = '#4f46e5', // Indigo
  secondaryColor = '#a855f7', // Purple
  showAnimation = true,
  showDetails = true,
  icon = 'trophy',
  className = '',
  height = 300
}: GoalAchievementMeterProps) {
  const [animationComplete, setAnimationComplete] = useState(false);
  const achievementPercentage = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 150) : 0;
  
  // Determine status based on achievement percentage
  const getStatus = () => {
    if (achievementPercentage >= 100) return 'ممتاز';
    if (achievementPercentage >= 80) return 'جيد جداً';
    if (achievementPercentage >= 60) return 'جيد';
    if (achievementPercentage >= 40) return 'مقبول';
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
  
  // Get icon component
  const getIcon = () => {
    switch (icon) {
      case 'trophy': return <Trophy className="w-6 h-6" />;
      case 'target': return <Target className="w-6 h-6" />;
      case 'flag': return <Flag className="w-6 h-6" />;
      case 'trending': return <TrendingUp className="w-6 h-6" />;
      case 'award': return <Award className="w-6 h-6" />;
      default: return <Trophy className="w-6 h-6" />;
    }
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

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${className}`} style={{ height: `${height}px` }}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div 
            className="p-2 rounded-full" 
            style={{ backgroundColor: `${getColor(achievementPercentage)}20` }}
          >
            <div style={{ color: getColor(achievementPercentage) }}>
              {getIcon()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Visualization */}
      <div className="relative h-[calc(100%-8rem)] w-full flex items-center justify-center">
        <div className="w-24 h-full relative flex items-center justify-center">
          {/* Background track */}
          <div className="absolute inset-x-0 bottom-0 top-10 w-full bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
          
          {/* Fill track */}
          <motion.div 
            className="absolute inset-x-0 bottom-0 w-full rounded-t-lg"
            initial={{ height: 0 }}
            animate={{ height: `${Math.min(achievementPercentage, 100) * 0.8}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ backgroundColor: getColor(achievementPercentage) }}
          />
          
          {/* Target marker */}
          <div className="absolute inset-x-0 w-full h-1 bg-red-500 z-10" style={{ bottom: '80%' }}>
            <div className="absolute -right-20 -top-3 bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs">
              الهدف: 100%
            </div>
          </div>
          
          {/* Percentage text */}
          <motion.div
            className="absolute top-2 inset-x-0 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className="text-lg font-bold" style={{ color: getColor(achievementPercentage) }}>
              {formatPercentage(achievementPercentage)}
            </div>
          </motion.div>
          
          {/* Trophy icon at the top */}
          <motion.div
            className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-20"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <div className="p-2 rounded-full bg-yellow-100">
              <Trophy className="w-5 h-5 text-yellow-600" />
            </div>
          </motion.div>
          
          {/* Milestone markers */}
          {[25, 50, 75].map(milestone => (
            <div 
              key={milestone}
              className="absolute inset-x-0 w-full h-0.5 bg-gray-300 dark:bg-gray-600 z-5"
              style={{ bottom: `${milestone * 0.8}%` }}
            >
              <div className="absolute -left-12 -top-3 text-xs text-gray-500 dark:text-gray-400">
                {milestone}%
              </div>
            </div>
          ))}
          
          {/* Current value indicator */}
          <motion.div
            className="absolute -left-24 z-10 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow"
            initial={{ opacity: 0, x: -10 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              bottom: `${Math.min(achievementPercentage, 100) * 0.8}%` 
            }}
            transition={{ duration: 1, delay: 0.5 }}
            style={{ transform: 'translateY(50%)' }}
          >
            <span className="text-sm font-medium" style={{ color: getColor(achievementPercentage) }}>
              {formatNumber(currentValue)}
            </span>
          </motion.div>
        </div>
        
        {/* Celebration effects */}
        {achievementPercentage >= 100 && animationComplete && (
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
              <div className="text-sm font-bold" style={{ color: getColor(achievementPercentage) }}>
                {getStatus()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}