import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatNumber, formatPercentage } from '../utils/numberUtils';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

interface TargetGoalsVisualizerProps {
  currentValue: number;
  targetValue: number;
  title?: string;
  className?: string;
  height?: number;
  width?: number;
  showExport?: boolean;
  categories?: { name: string; value: number }[];
}

export function TargetGoalsVisualizer({
  currentValue,
  targetValue,
  title = 'أهداف المبيعات',
  className = '',
  height = 500,
  width = 800,
  showExport = true,
  categories = []
}: TargetGoalsVisualizerProps) {
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Calculate percentage with a maximum of 150%
  const percentage = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 150) : 0;
  
  // Define the steps for the visualization
  const steps = [
    { id: 1, label: 'الهدف الأول', description: 'تحقيق 25% من المبيعات', color: '#f59e0b', icon: '💡' },
    { id: 2, label: 'الهدف الثاني', description: 'تحقيق 50% من المبيعات', color: '#ec4899', icon: '⚙️' },
    { id: 3, label: 'الهدف الثالث', description: 'تحقيق 75% من المبيعات', color: '#06b6d4', icon: '👥' },
    { id: 4, label: 'الهدف الرابع', description: 'تحقيق 100% من المبيعات', color: '#8b5cf6', icon: '📊' },
  ];
  
  // Calculate which steps are completed based on percentage
  const completedSteps = steps.filter(step => {
    const stepPercentage = step.id * 25;
    return percentage >= stepPercentage;
  });
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleExport = async () => {
    try {
      const element = document.getElementById('target-goals-visualization');
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = 'target-goals-visualization.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('تم تصدير الصورة بنجاح');
    } catch (err) {
      console.error('Error exporting image:', err);
      toast.error('فشل في تصدير الصورة');
    }
  };

  // Calculate arrow positions
  const getArrowPosition = (stepId: number) => {
    switch (stepId) {
      case 1: return { x: 0, y: -60, rotation: -45 };
      case 2: return { x: 60, y: 0, rotation: 0 };
      case 3: return { x: 0, y: 60, rotation: 45 };
      case 4: return { x: -60, y: 0, rotation: 180 };
      default: return { x: 0, y: 0, rotation: 0 };
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`} style={{ height, width }}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-xl font-semibold">{title}</h3>
        {showExport && (
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">تصدير</span>
          </button>
        )}
      </div>
      
      {/* Visualization Container */}
      <div id="target-goals-visualization" className="relative p-6 h-[calc(100%-4rem)]">
        <div className="flex h-full">
          {/* Left side - Target */}
          <div className="w-1/2 flex items-center justify-center">
            <div className="relative">
              {/* Target circles */}
              <svg width="300" height="300" viewBox="0 0 300 300">
                {/* Background circle */}
                <circle cx="150" cy="150" r="140" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
                
                {/* Colored rings */}
                <circle cx="150" cy="150" r="110" fill="#fee2e2" stroke="#fecaca" strokeWidth="2" />
                <circle cx="150" cy="150" r="80" fill="#fef3c7" stroke="#fde68a" strokeWidth="2" />
                <circle cx="150" cy="150" r="50" fill="#dcfce7" stroke="#bbf7d0" strokeWidth="2" />
                <circle cx="150" cy="150" r="20" fill="#10b981" stroke="#059669" strokeWidth="2" />
                
                {/* Arrows */}
                {steps.map((step, index) => {
                  const isCompleted = percentage >= step.id * 25;
                  const position = getArrowPosition(step.id);
                  
                  return (
                    <motion.g
                      key={step.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isCompleted ? 1 : 0.3 }}
                      transition={{ duration: 0.5, delay: 0.5 + index * 0.2 }}
                    >
                      <motion.g
                        initial={{ x: 150, y: 150 }}
                        animate={{ 
                          x: 150 + position.x, 
                          y: 150 + position.y,
                          rotate: position.rotation
                        }}
                        transition={{ 
                          duration: 1, 
                          delay: 0.8 + index * 0.2,
                          type: "spring"
                        }}
                        style={{ transformOrigin: "150px 150px" }}
                      >
                        <polygon 
                          points="0,0 -30,-10 -25,0 -30,10" 
                          fill={isCompleted ? step.color : "#94a3b8"}
                          transform="translate(150, 150)"
                        />
                        <rect 
                          x="120" y="145" 
                          width="30" height="10" 
                          fill={isCompleted ? step.color : "#94a3b8"}
                        />
                      </motion.g>
                    </motion.g>
                  );
                })}
                
                {/* Center text */}
                <text 
                  x="150" 
                  y="140" 
                  textAnchor="middle" 
                  className="fill-gray-900 font-bold text-2xl"
                >
                  {Math.round(percentage)}%
                </text>
                <text 
                  x="150" 
                  y="170" 
                  textAnchor="middle" 
                  className="fill-gray-500 text-sm"
                >
                  من الهدف
                </text>
              </svg>
              
              {/* Achievement Status */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.5 }}
                className="text-center mt-4"
              >
                <div className="text-sm text-gray-500 mb-1">الإنجاز الحالي</div>
                <div className="text-2xl font-bold">{formatNumber(currentValue)}</div>
                <div className="text-sm text-gray-500 mt-1">من أصل</div>
                <div className="text-xl font-bold">{formatNumber(targetValue)}</div>
              </motion.div>
            </div>
          </div>
          
          {/* Right side - Steps */}
          <div className="w-1/2 flex flex-col justify-center space-y-4">
            {steps.map((step, index) => {
              const isCompleted = percentage >= step.id * 25;
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.2 }}
                >
                  <div className={`flex items-center ${isCompleted ? 'opacity-100' : 'opacity-60'}`}>
                    <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: step.color }}>
                      {step.id}
                    </div>
                    
                    <div className="flex-1 ml-4 p-3 rounded-lg" style={{ backgroundColor: `${step.color}20` }}>
                      <div className="flex items-center justify-between">
                        <div className="font-bold">{step.label}</div>
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl">
                          {step.icon}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{step.description}</div>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className="w-0.5 h-4 bg-gray-200 ml-6 my-1"></div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Categories breakdown (if provided) */}
        {categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 2 }}
            className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-3"
          >
            <div className="text-sm font-medium mb-2">توزيع المبيعات حسب الصنف</div>
            <div className="grid grid-cols-4 gap-2">
              {categories.slice(0, 8).map((category, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: [
                      '#4f46e5', '#10b981', '#f59e0b', '#ef4444', 
                      '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'
                    ][index % 8] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{category.name}</div>
                    <div className="text-xs text-gray-500">{formatNumber(category.value)}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}