import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { formatNumber, formatPercentage } from '../utils/numberUtils';

interface CircularProgressProps {
  data: {
    label: string;
    value: number;
    color: string;
  }[];
  totalLabel?: string;
  totalValue?: number;
  size?: number;
  thickness?: number;
}

export function CircularProgress({
  data,
  totalLabel = 'إجمالي المبيعات',
  totalValue,
  size = 300,
  thickness = 30
}: CircularProgressProps) {
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Calculate total if not provided
  const calculatedTotal = totalValue || data.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate the radius and circumference
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate the start and end angles for each segment
  let startAngle = -90; // Start from the top
  
  // Sort data by value in descending order
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  
  // Calculate the percentage of each segment
  const segments = sortedData.map(item => {
    const percentage = (item.value / calculatedTotal) * 100;
    const angle = (percentage / 100) * 360;
    const endAngle = startAngle + angle;
    
    // Calculate the SVG arc path
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = size / 2 + radius * Math.cos(startAngleRad);
    const y1 = size / 2 + radius * Math.sin(startAngleRad);
    const x2 = size / 2 + radius * Math.cos(endAngleRad);
    const y2 = size / 2 + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`
    ].join(' ');
    
    const result = {
      ...item,
      percentage,
      startAngle,
      endAngle,
      pathData
    };
    
    // Update the start angle for the next segment
    startAngle = endAngle;
    
    return result;
  });

  useEffect(() => {
    // Reset animation state when data changes
    setAnimationComplete(false);
    
    // Set animation complete after delay
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [data]);

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      {/* Circular chart */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute top-0 left-0">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f1f1"
            strokeWidth={thickness}
          />
        </svg>
        
        {/* Segments */}
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute top-0 left-0">
          {segments.map((segment, index) => (
            <motion.path
              key={index}
              d={segment.pathData}
              fill="none"
              stroke={segment.color}
              strokeWidth={thickness}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: 1, 
                opacity: 1,
                transition: { 
                  duration: 1.5,
                  delay: index * 0.2,
                  ease: "easeInOut" 
                }
              }}
            />
          ))}
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="font-bold text-2xl md:text-3xl"
          >
            {formatNumber(calculatedTotal)}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="text-gray-500 text-xs md:text-sm mt-1"
          >
            {totalLabel}
          </motion.div>
        </div>
      </div>
      
      {/* Legend - Now on the right side */}
      {animationComplete && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 1.5 }}
          className="w-full md:w-auto flex-grow space-y-2"
        >
          {sortedData.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm border-b border-gray-100 last:border-0 py-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="font-medium">{item.label}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-semibold tabular-nums">{formatNumber(item.value)}</span>
                <span className="text-gray-500 text-xs">
                  ({formatPercentage((item.value / calculatedTotal) * 100, 1)})
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}