import { useState, useEffect } from 'react';
import { PieChart as PieChartIcon, Download, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

interface DataItem {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: DataItem[];
  title?: string;
  height?: number;
  width?: number;
  showLegend?: boolean;
  showPercentages?: boolean;
  showExport?: boolean;
  className?: string;
}

export default function PerformancePieChart({
  data,
  title = 'توزيع البيانات',
  height = 500,
  width = 800,
  showLegend = true,
  showPercentages = true,
  showExport = true,
  className = ''
}: PieChartProps) {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  
  // Calculate total
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Sort data by value in descending order
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  
  // Calculate angles for each segment
  const segments = sortedData.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const startAngle = index === 0 ? 0 : sortedData
      .slice(0, index)
      .reduce((sum, d) => sum + (d.value / total) * 360, 0);
    const endAngle = startAngle + (item.value / total) * 360;
    
    return {
      ...item,
      percentage,
      startAngle,
      endAngle
    };
  });
  
  const handleExport = async () => {
    try {
      const element = document.getElementById('pie-chart-container');
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = 'pie-chart.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('تم تصدير الرسم البياني بنجاح');
    } catch (err) {
      console.error('Error exporting chart:', err);
      toast.error('فشل في تصدير الرسم البياني');
    }
  };
  
  // Function to calculate coordinates on the circle
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };
  
  // Function to create SVG arc path
  const createArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "L", x, y,
      "Z"
    ].join(" ");
  };

  // Format number with commas
  const formatNumber = (value: number): string => {
    return value.toLocaleString('en-US');
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };
  
  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`} style={{ height, width }}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-xl font-semibold">{title}</h3>
        {showExport && (
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="تحديث"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="تصدير"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>
      
      {/* Chart Container */}
      <div id="pie-chart-container" className="flex flex-col md:flex-row h-[calc(100%-4rem)]">
        {data.length > 0 ? (
          <>
            {/* SVG Chart */}
            <div className="flex-1 relative">
              <svg width="100%" height="100%" viewBox={`0 0 ${width/2} ${height-60}`}>
                <g transform={`translate(${width/4}, ${(height-60)/2})`}>
                  {segments.map((segment, i) => {
                    const isActive = activeSegment === segment.id || hoveredSegment === segment.id;
                    const radius = isActive ? 110 : 100;
                    const arc = createArc(0, 0, radius, segment.startAngle, segment.endAngle);
                    
                    // Calculate position for percentage label
                    const midAngle = segment.startAngle + (segment.endAngle - segment.startAngle) / 2;
                    const labelRadius = 70;
                    const labelPos = polarToCartesian(0, 0, labelRadius, midAngle);
                    
                    return (
                      <g key={segment.id}>
                        <path
                          d={arc}
                          fill={segment.color}
                          stroke="white"
                          strokeWidth={2}
                          onMouseEnter={() => setHoveredSegment(segment.id)}
                          onMouseLeave={() => setHoveredSegment(null)}
                          onClick={() => setActiveSegment(activeSegment === segment.id ? null : segment.id)}
                          style={{ 
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            filter: isActive ? 'drop-shadow(0 0 8px rgba(0,0,0,0.3))' : 'none'
                          }}
                        />
                        
                        {showPercentages && segment.percentage > 3 && (
                          <text
                            x={labelPos.x}
                            y={labelPos.y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="white"
                            fontSize="12"
                            fontWeight="bold"
                            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                          >
                            {formatPercentage(segment.percentage)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  
                  {/* Center circle with total */}
                  <circle cx="0" cy="0" r="40" fill="white" stroke="#e5e7eb" strokeWidth="1" />
                  <text x="0" y="-5" textAnchor="middle" fontSize="14" fontWeight="bold">
                    {formatNumber(total)}
                  </text>
                  <text x="0" y="15" textAnchor="middle" fontSize="10" fill="#6b7280">
                    الإجمالي
                  </text>
                </g>
              </svg>
            </div>
            
            {/* Legend */}
            {showLegend && (
              <div className="w-full md:w-1/2 p-4 overflow-y-auto">
                <div className="space-y-2">
                  {segments.map((segment) => (
                    <div 
                      key={segment.id}
                      className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                        activeSegment === segment.id || hoveredSegment === segment.id 
                          ? 'bg-gray-100' 
                          : 'hover:bg-gray-50'
                      }`}
                      onMouseEnter={() => setHoveredSegment(segment.id)}
                      onMouseLeave={() => setHoveredSegment(null)}
                      onClick={() => setActiveSegment(activeSegment === segment.id ? null : segment.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: segment.color }}
                        />
                        <span className="font-medium truncate max-w-[200px]" title={segment.label}>
                          {segment.label}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-semibold tabular-nums">
                          {formatNumber(segment.value)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatPercentage(segment.percentage)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <PieChartIcon className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500">لا توجد بيانات متاحة</p>
          </div>
        )}
      </div>
    </div>
  );
}