import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatNumber, formatPercentage } from '../utils/numberUtils';

interface DataItem {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface ColorfulPieChartProps {
  data: DataItem[];
  title?: string;
  totalLabel?: string;
  showLegend?: boolean;
  showPercentages?: boolean;
  showValues?: boolean;
  height?: number;
  width?: number;
  className?: string;
  onExport?: () => void;
}

export function ColorfulPieChart({
  data,
  title = 'توزيع المبيعات حسب الصنف',
  totalLabel = 'إجمالي المبيعات',
  showLegend = true,
  showPercentages = true,
  showValues = true,
  height = 500,
  width = 800,
  className = '',
  onExport
}: ColorfulPieChartProps) {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Calculate total
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate the radius and circumference
  const svgSize = Math.min(width, height);
  const centerX = svgSize / 2;
  const centerY = svgSize / 2;
  const radius = Math.min(centerX, centerY) * 0.8;
  const innerRadius = radius * 0.6; // For donut chart
  
  // Sort data by value in descending order
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  
  // Calculate percentages and angles
  const segments = sortedData.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const startAngle = index === 0 ? 0 : sortedData
      .slice(0, index)
      .reduce((sum, d) => sum + (d.value / total) * 360, 0);
    const endAngle = startAngle + (item.value / total) * 360;
    
    // Calculate the SVG arc path
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
      pathData
    };
  });
  
  // Function to calculate position for labels
  const getLabelPosition = (angle: number, isValue: boolean = false) => {
    const angleRad = (angle * Math.PI) / 180;
    const distance = isValue ? (radius + innerRadius) / 2 : radius + 30;
    return {
      x: centerX + distance * Math.cos(angleRad),
      y: centerY + distance * Math.sin(angleRad)
    };
  };
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`} style={{ height, width }}>
      {/* Header */}
      {title && (
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row h-[calc(100%-4rem)]">
        {/* Chart */}
        <div className="flex-1 relative">
          <svg width="100%" height="100%" viewBox={`0 0 ${svgSize} ${svgSize}`}>
            {/* Segments */}
            <g>
              {segments.map((segment, i) => (
                <motion.path
                  key={segment.id}
                  d={segment.pathData}
                  fill={segment.color}
                  stroke="#fff"
                  strokeWidth={1}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  onMouseEnter={() => setActiveSegment(segment.id)}
                  onMouseLeave={() => setActiveSegment(null)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </g>
            
            {/* Center circle with total */}
            <circle
              cx={centerX}
              cy={centerY}
              r={innerRadius * 0.8}
              fill="white"
            />
            
            <text
              x={centerX}
              y={centerY - 10}
              textAnchor="middle"
              className="text-2xl font-bold fill-gray-900"
              style={{ fontSize: '1.2rem' }}
            >
              {formatNumber(total)}
            </text>
            
            <text
              x={centerX}
              y={centerY + 20}
              textAnchor="middle"
              className="fill-gray-500"
              style={{ fontSize: '0.9rem' }}
            >
              {totalLabel}
            </text>
            
            {/* Percentage labels */}
            {showPercentages && animationComplete && segments.map((segment) => {
              const midAngle = (segment.startAngle + segment.endAngle) / 2;
              const { x, y } = getLabelPosition(midAngle);
              
              // Only show label if segment is large enough
              if (segment.percentage < 2) return null;
              
              return (
                <motion.text
                  key={`percent-${segment.id}`}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white font-bold"
                  style={{ fontSize: '0.8rem', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1 }}
                >
                  {formatPercentage(segment.percentage)}
                </motion.text>
              );
            })}
            
            {/* Value labels inside segments */}
            {showValues && animationComplete && segments.map((segment) => {
              const midAngle = (segment.startAngle + segment.endAngle) / 2;
              const { x, y } = getLabelPosition(midAngle, true);
              
              // Only show label if segment is large enough
              if (segment.percentage < 5) return null;
              
              return (
                <motion.text
                  key={`value-${segment.id}`}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white font-medium"
                  style={{ fontSize: '0.7rem', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                >
                  {formatNumber(segment.value)}
                </motion.text>
              );
            })}
          </svg>
        </div>
        
        {/* Legend */}
        {showLegend && (
          <div className="w-full md:w-64 p-4 overflow-y-auto">
            <div className="space-y-3">
              {segments.map((segment, i) => (
                <motion.div
                  key={segment.id}
                  className={`flex items-center p-2 rounded-lg transition-colors ${activeSegment === segment.id ? 'bg-gray-100' : ''}`}
                  onMouseEnter={() => setActiveSegment(segment.id)}
                  onMouseLeave={() => setActiveSegment(null)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <div 
                    className="w-4 h-4 rounded-full mr-3 flex-shrink-0" 
                    style={{ backgroundColor: segment.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{segment.label}</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 tabular-nums">
                        {formatNumber(segment.value)}
                      </span>
                      <span className="font-medium tabular-nums" style={{ color: segment.color }}>
                        {formatPercentage(segment.percentage)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}