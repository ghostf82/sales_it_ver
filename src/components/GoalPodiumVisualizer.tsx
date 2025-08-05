import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatNumber, formatPercentage } from '../utils/numberUtils';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

interface GoalPodiumVisualizerProps {
  currentValue: number;
  targetValue: number;
  title?: string;
  className?: string;
  height?: number;
  width?: number;
  showExport?: boolean;
  categories?: { name: string; value: number }[];
}

export function GoalPodiumVisualizer({
  currentValue,
  targetValue,
  title = 'تحقيق الأهداف',
  className = '',
  height = 500,
  width = 800,
  showExport = true,
  categories = []
}: GoalPodiumVisualizerProps) {
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

  // Define the steps for the podium
  const steps = [
    { id: 1, label: 'المرحلة الأولى', description: 'بداية الطريق', color: '#0d9488' },
    { id: 2, label: 'المرحلة الثانية', description: 'تقدم ملحوظ', color: '#e11d48' },
    { id: 3, label: 'المرحلة الثالثة', description: 'اقتراب من الهدف', color: '#4f46e5' },
    { id: 4, label: 'المرحلة الرابعة', description: 'تحقيق الهدف', color: '#f59e0b' },
  ];
  
  // Calculate which step we're on based on percentage
  const currentStep = 
    percentage >= 100 ? 4 :
    percentage >= 75 ? 3 :
    percentage >= 50 ? 2 :
    percentage >= 25 ? 1 : 0;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleExport = async () => {
    try {
      const element = document.getElementById('goal-podium-visualization');
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = 'goal-visualization.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('تم تصدير الصورة بنجاح');
    } catch (err) {
      console.error('Error exporting image:', err);
      toast.error('فشل في تصدير الصورة');
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
      <div id="goal-podium-visualization" className="relative p-6 h-[calc(100%-4rem)]">
        <div className="flex h-full">
          {/* Left side - Target and Achievement */}
          <div className="w-1/2 flex flex-col items-center justify-center">
            {/* Target Circle */}
            <div className="relative mb-8">
              <svg width="200" height="200" viewBox="0 0 200 200">
                {/* Background circle */}
                <circle cx="100" cy="100" r="90" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
                
                {/* Colored segments */}
                <circle cx="100" cy="100" r="70" fill="#fef3c7" stroke="#fde68a" strokeWidth="2" />
                <circle cx="100" cy="100" r="50" fill="#fee2e2" stroke="#fecaca" strokeWidth="2" />
                <circle cx="100" cy="100" r="30" fill="#dcfce7" stroke="#bbf7d0" strokeWidth="2" />
                <circle cx="100" cy="100" r="10" fill="#10b981" stroke="#059669" strokeWidth="2" />
                
                {/* Arrow */}
                <motion.g
                  initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                  animate={{ rotate: -90 + (percentage * 1.8), scale: 1, opacity: 1 }}
                  transition={{ duration: 1.5, delay: 0.5, type: "spring" }}
                  style={{ transformOrigin: "100px 100px" }}
                >
                  <line x1="100" y1="100" x2="180" y2="100" stroke="#ef4444" strokeWidth="4" />
                  <polygon points="170,95 180,100 170,105" fill="#ef4444" />
                </motion.g>
                
                {/* Percentage text */}
                <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" 
                      className="text-2xl font-bold fill-gray-900">
                  {Math.round(percentage)}%
                </text>
              </svg>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="text-center mt-2"
              >
                <div className="text-sm text-gray-500">الهدف</div>
                <div className="text-xl font-bold">{formatNumber(targetValue)}</div>
              </motion.div>
            </div>
            
            {/* Achievement Status */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.5 }}
              className="text-center"
            >
              <div className="text-sm text-gray-500 mb-1">الإنجاز الحالي</div>
              <div className="text-2xl font-bold" style={{ color: getColor(percentage) }}>
                {formatNumber(currentValue)}
              </div>
              <div className="mt-2 px-4 py-1 rounded-full text-white text-sm inline-block" 
                   style={{ backgroundColor: getColor(percentage) }}>
                {getStatus()}
              </div>
            </motion.div>
          </div>
          
          {/* Right side - Podium Steps */}
          <div className="w-1/2 flex items-end justify-center">
            <div className="relative w-full max-w-md">
              {/* Target at the top */}
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full"
              >
                <div className="relative">
                  <svg width="60" height="60" viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r="28" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
                    <circle cx="30" cy="30" r="20" fill="#fef3c7" stroke="#fde68a" strokeWidth="2" />
                    <circle cx="30" cy="30" r="10" fill="#fee2e2" stroke="#fecaca" strokeWidth="2" />
                    <circle cx="30" cy="30" r="5" fill="#10b981" stroke="#059669" strokeWidth="2" />
                  </svg>
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1.5, repeat: Infinity, repeatType: "reverse" }}
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" fill="#f59e0b" />
                    </svg>
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Steps */}
              {steps.map((step, index) => {
                const isActive = currentStep >= step.id;
                const delay = 0.2 + (steps.length - index) * 0.15;
                const width = 100 - (index * 10);
                
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay }}
                    className="relative mb-2 last:mb-0"
                    style={{ zIndex: steps.length - index }}
                  >
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: isActive ? "100%" : "0%" }}
                      transition={{ duration: 1, delay: delay + 0.3 }}
                      className="absolute inset-0 rounded-lg opacity-20"
                      style={{ backgroundColor: step.color }}
                    />
                    
                    <div 
                      className={`p-4 rounded-lg flex items-center justify-between transition-colors duration-300 ${isActive ? 'bg-white shadow-lg' : 'bg-gray-100'}`}
                      style={{ width: `${width}%`, marginLeft: `${(100 - width) / 2}%` }}
                    >
                      <div className="flex items-center">
                        <div 
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3`}
                          style={{ backgroundColor: step.color }}
                        >
                          {step.id}
                        </div>
                        <div>
                          <div className="font-medium">{step.label}</div>
                          <div className="text-sm text-gray-500">{step.description}</div>
                        </div>
                      </div>
                      
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3, delay: delay + 0.5 }}
                          className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M13.3334 4L6.00002 11.3333L2.66669 8" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              
              {/* Celebration effects */}
              {percentage >= 100 && animationComplete && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
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
              {categories.map((category, index) => (
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