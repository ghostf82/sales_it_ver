import { motion } from 'framer-motion';
import { formatNumber, formatPercentage } from '../utils/numberUtils';

interface Performer {
  id: string;
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

interface OlympicPodiumProps {
  title?: string;
  performers: Performer[];
  maxValue?: number;
  valueLabel?: string;
  className?: string;
}

export function OlympicPodium({
  title = 'أفضل الأداء',
  performers,
  maxValue,
  valueLabel = 'المبيعات',
  className = ''
}: OlympicPodiumProps) {
  // Sort performers by value in descending order and take top 3
  const topPerformers = [...performers]
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
  
  // If we have less than 3 performers, fill with empty ones
  while (topPerformers.length < 3) {
    topPerformers.push({
      id: `empty-${topPerformers.length}`,
      name: '',
      value: 0
    });
  }
  
  // Assign positions (2nd, 1st, 3rd)
  const [secondPlace, firstPlace, thirdPlace] = topPerformers;
  
  // Calculate heights based on values
  const highestValue = maxValue || Math.max(...topPerformers.map(p => p.value));
  const getHeight = (value: number) => {
    if (highestValue === 0) return 0;
    return Math.max((value / highestValue) * 100, 10); // Minimum 10% height
  };
  
  // Default colors
  const defaultColors = ['#4f46e5', '#10b981', '#8b5cf6'];
  
  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      {title && (
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      )}
      
      {/* Podium visualization */}
      <div className="p-6 h-80 relative">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-blue-100 z-0" />
        
        {/* Podium platforms */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center h-2/3 z-10">
          {/* Second place */}
          <div className="flex flex-col items-center mx-2 pb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center mb-2"
            >
              {secondPlace.name && (
                <>
                  <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-xl font-bold mb-1">
                    {secondPlace.name.charAt(0)}
                  </div>
                  <div className="text-sm font-medium truncate max-w-[80px]">{secondPlace.name}</div>
                  <div className="text-xs text-gray-500">
                    {formatNumber(secondPlace.value)}
                  </div>
                  {secondPlace.percentage !== undefined && (
                    <div className="text-xs font-medium" style={{ color: secondPlace.color || defaultColors[1] }}>
                      {formatPercentage(secondPlace.percentage)}
                    </div>
                  )}
                </>
              )}
            </motion.div>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${getHeight(secondPlace.value)}%` }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="w-20 rounded-t-lg"
              style={{ 
                backgroundColor: secondPlace.color || defaultColors[1],
                minHeight: secondPlace.value > 0 ? '20px' : '0'
              }}
            />
            <div className="absolute bottom-0 w-20 h-10 bg-gray-300 rounded-t-lg flex items-center justify-center text-white font-bold text-lg">
              2
            </div>
          </div>
          
          {/* First place */}
          <div className="flex flex-col items-center mx-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-2"
            >
              {firstPlace.name && (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center text-white text-2xl font-bold mb-1"
                  >
                    {firstPlace.name.charAt(0)}
                  </motion.div>
                  <div className="text-sm font-medium truncate max-w-[80px]">{firstPlace.name}</div>
                  <div className="text-xs text-gray-500">
                    {formatNumber(firstPlace.value)}
                  </div>
                  {firstPlace.percentage !== undefined && (
                    <div className="text-xs font-medium" style={{ color: firstPlace.color || defaultColors[0] }}>
                      {formatPercentage(firstPlace.percentage)}
                    </div>
                  )}
                </>
              )}
            </motion.div>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${getHeight(firstPlace.value)}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-20 rounded-t-lg"
              style={{ 
                backgroundColor: firstPlace.color || defaultColors[0],
                minHeight: firstPlace.value > 0 ? '20px' : '0'
              }}
            />
            <div className="absolute bottom-0 w-20 h-16 bg-yellow-400 rounded-t-lg flex items-center justify-center text-white font-bold text-lg">
              1
            </div>
          </div>
          
          {/* Third place */}
          <div className="flex flex-col items-center mx-2 pb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center mb-2"
            >
              {thirdPlace.name && (
                <>
                  <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white text-xl font-bold mb-1">
                    {thirdPlace.name.charAt(0)}
                  </div>
                  <div className="text-sm font-medium truncate max-w-[80px]">{thirdPlace.name}</div>
                  <div className="text-xs text-gray-500">
                    {formatNumber(thirdPlace.value)}
                  </div>
                  {thirdPlace.percentage !== undefined && (
                    <div className="text-xs font-medium" style={{ color: thirdPlace.color || defaultColors[2] }}>
                      {formatPercentage(thirdPlace.percentage)}
                    </div>
                  )}
                </>
              )}
            </motion.div>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${getHeight(thirdPlace.value)}%` }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="w-20 rounded-t-lg"
              style={{ 
                backgroundColor: thirdPlace.color || defaultColors[2],
                minHeight: thirdPlace.value > 0 ? '20px' : '0'
              }}
            />
            <div className="absolute bottom-0 w-20 h-6 bg-amber-600 rounded-t-lg flex items-center justify-center text-white font-bold text-lg">
              3
            </div>
          </div>
        </div>
        
        {/* Value label */}
        <div className="absolute top-2 left-2 bg-white/80 px-2 py-1 rounded text-xs">
          {valueLabel}
        </div>
        
        {/* Celebration effects */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
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
                top: `${Math.random() * 60}%`,
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 2 + Math.random() * 2,
                delay: 1 + Math.random() * 2,
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
      </div>
    </div>
  );
}