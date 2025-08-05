import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type Props = {
  currentValue?: number;
  targetValue?: number;
  title?: string;
  showAnimation?: boolean;
  height?: number;
  width?: number;
};

export default function SpeedometerGauge({ 
  currentValue = 0, 
  targetValue = 1,
  title = '',
  showAnimation = true,
  height = 300,
  width = 400
}: Props) {
  const [animationKey, setAnimationKey] = useState(0);
  const safeValue = currentValue ?? 0;
  const safeGoal = targetValue ?? 1;
  const percentage = Math.min((safeValue / safeGoal) * 100, 150);
  const statusText =
    percentage >= 100
      ? 'ممتاز جدًا'
      : percentage >= 80
      ? 'جيد جدًا'
      : percentage >= 60
      ? 'جيد'
      : 'يحتاج تحسين';

  // Arabic month names
  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  useEffect(() => {
    if (showAnimation) {
      setAnimationKey(prev => prev + 1);
    }
  }, [currentValue, targetValue, showAnimation]);

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  // Calculate needle angle based on percentage (0-150% maps to -90 to 90 degrees)
  const needleAngle = (percentage / 150) * 180 - 90;

  return (
    <div className="w-full mx-auto text-center" style={{ height, width }}>
      <svg width="100%" height="200" viewBox="0 0 200 120" key={animationKey}>
        {/* Gauge Background */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y1="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
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
          animate={{ rotate: needleAngle }}
          transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.5 }}
        >
          <line 
            x1="100" 
            y1="100" 
            x2="100" 
            y2="30" 
            stroke="#3b82f6" 
            strokeWidth="2"
          />
          <circle 
            cx="100" 
            cy="100" 
            r="8" 
            fill="#3b82f6" 
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
            fill="#3b82f6" 
            fontSize="16" 
            fontWeight="bold"
          >
            {percentage.toFixed(1)}%
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

      {/* النصوص */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="mt-2"
      >
        <p className="text-2xl font-bold text-gray-800">{percentage.toFixed(1)}%</p>
        <p className="text-sm text-gray-600">{statusText}</p>
        <p className="text-sm text-gray-500">{safeValue.toLocaleString()} من {safeGoal.toLocaleString()}</p>
      </motion.div>

      {title && (
        <div className="mt-2 text-lg font-medium text-gray-800">{title}</div>
      )}

      {/* زر إعادة التحميل */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => setAnimationKey(prev => prev + 1)}
        className="mt-4 bg-blue-500 text-white py-1 px-4 rounded-full shadow"
      >
        🔄 تحديث العرض
      </motion.button>
    </div>
  );
}