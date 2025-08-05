import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Target, 
  Flag, 
  TrendingUp, 
  Award,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw
} from 'lucide-react';
import { formatNumber, formatPercentage } from '../utils/numberUtils';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

interface GoalAchievementVisualizerProps {
  currentValue: number;
  targetValue: number;
  title?: string;
  showDetails?: boolean;
  className?: string;
  height?: number;
  visualizationType?: 'mountain' | 'circle' | 'rocket' | 'thermometer' | 'podium' | 'triangle';
  showControls?: boolean;
  onExport?: () => void;
}

export function GoalAchievementVisualizer({
  currentValue,
  targetValue,
  title = 'نسبة تحقيق الأهداف',
  showDetails = true,
  className = '',
  height = 400,
  visualizationType = 'triangle',
  showControls = true,
  onExport
}: GoalAchievementVisualizerProps) {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [activeVisualization, setActiveVisualization] = useState<'mountain' | 'circle' | 'rocket' | 'thermometer' | 'podium' | 'triangle'>(visualizationType);
  const [showOptions, setShowOptions] = useState(false);
  
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
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleExport = async () => {
    try {
      if (onExport) {
        onExport();
        return;
      }
      
      const element = document.getElementById('goal-visualization');
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = `goal-visualization-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('تم تصدير الصورة بنجاح');
    } catch (err) {
      console.error('Error exporting image:', err);
      toast.error('فشل في تصدير الصورة');
    }
  };
  
  const handleReset = () => {
    setAnimationComplete(false);
    setTimeout(() => {
      setAnimationComplete(true);
    }, 100);
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`} style={{ height: `${height}px` }}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        
        {showControls && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {showOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="إعادة التشغيل"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="تصدير"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      {/* Visualization Options */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-b border-gray-100 overflow-hidden"
          >
            <div className="p-4 grid grid-cols-6 gap-2">
              <button
                onClick={() => setActiveVisualization('triangle')}
                className={`p-2 rounded-lg flex flex-col items-center gap-1 text-xs ${activeVisualization === 'triangle' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                <Triangle className="w-5 h-5" />
                <span>المثلث</span>
              </button>
              <button
                onClick={() => setActiveVisualization('mountain')}
                className={`p-2 rounded-lg flex flex-col items-center gap-1 text-xs ${activeVisualization === 'mountain' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                <Mountain className="w-5 h-5" />
                <span>الجبل</span>
              </button>
              <button
                onClick={() => setActiveVisualization('circle')}
                className={`p-2 rounded-lg flex flex-col items-center gap-1 text-xs ${activeVisualization === 'circle' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                <Target className="w-5 h-5" />
                <span>الدائرة</span>
              </button>
              <button
                onClick={() => setActiveVisualization('rocket')}
                className={`p-2 rounded-lg flex flex-col items-center gap-1 text-xs ${activeVisualization === 'rocket' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                <TrendingUp className="w-5 h-5" />
                <span>الصاروخ</span>
              </button>
              <button
                onClick={() => setActiveVisualization('thermometer')}
                className={`p-2 rounded-lg flex flex-col items-center gap-1 text-xs ${activeVisualization === 'thermometer' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                <Flag className="w-5 h-5" />
                <span>المقياس</span>
              </button>
              <button
                onClick={() => setActiveVisualization('podium')}
                className={`p-2 rounded-lg flex flex-col items-center gap-1 text-xs ${activeVisualization === 'podium' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                <Trophy className="w-5 h-5" />
                <span>المنصة</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Visualization Container */}
      <div id="goal-visualization" className="relative h-[calc(100%-8rem)] w-full overflow-hidden">
        {activeVisualization === 'triangle' && (
          <TriangleVisualization 
            currentValue={currentValue}
            targetValue={targetValue}
            percentage={percentage}
            getColor={getColor}
            animationComplete={animationComplete}
          />
        )}
        
        {activeVisualization === 'mountain' && (
          <MountainVisualization 
            currentValue={currentValue}
            targetValue={targetValue}
            percentage={percentage}
            getColor={getColor}
            animationComplete={animationComplete}
          />
        )}
        
        {activeVisualization === 'circle' && (
          <CircleVisualization 
            currentValue={currentValue}
            targetValue={targetValue}
            percentage={percentage}
            getColor={getColor}
            animationComplete={animationComplete}
          />
        )}
        
        {activeVisualization === 'rocket' && (
          <RocketVisualization 
            currentValue={currentValue}
            targetValue={targetValue}
            percentage={percentage}
            getColor={getColor}
            animationComplete={animationComplete}
          />
        )}
        
        {activeVisualization === 'thermometer' && (
          <ThermometerVisualization 
            currentValue={currentValue}
            targetValue={targetValue}
            percentage={percentage}
            getColor={getColor}
            animationComplete={animationComplete}
          />
        )}
        
        {activeVisualization === 'podium' && (
          <PodiumVisualization 
            currentValue={currentValue}
            targetValue={targetValue}
            percentage={percentage}
            getColor={getColor}
            animationComplete={animationComplete}
          />
        )}
      </div>
      
      {/* Footer with details */}
      {showDetails && (
        <div className="p-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 p-2 rounded-lg">
              <div className="text-xs text-gray-500">الحالي</div>
              <div className="text-sm font-bold tabular-nums">{formatNumber(currentValue)}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg">
              <div className="text-xs text-gray-500">الهدف</div>
              <div className="text-sm font-bold tabular-nums">{formatNumber(targetValue)}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg">
              <div className="text-xs text-gray-500">التقييم</div>
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

// New Triangle Visualization Component
function TriangleVisualization({ 
  currentValue, 
  targetValue, 
  percentage, 
  getColor, 
  animationComplete 
}: {
  currentValue: number;
  targetValue: number;
  percentage: number;
  getColor: (pct: number) => string;
  animationComplete: boolean;
}) {
  // Calculate fill height based on achievement percentage
  const fillHeight = Math.min(percentage, 100);
  
  // Define milestone levels
  const milestones = [
    { value: 25, label: '25%', color: '#ef4444' },
    { value: 50, label: '50%', color: '#f59e0b' },
    { value: 75, label: '75%', color: '#8b5cf6' },
    { value: 100, label: '100%', color: '#10b981' }
  ];
  
  return (
    <div className="relative h-full w-full">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-blue-100" />
      
      {/* Triangle Container */}
      <div className="absolute inset-x-0 bottom-0 top-10 flex items-center justify-center">
        {/* Triangle Outline */}
        <div className="relative w-[80%] max-w-[400px]" style={{ aspectRatio: '1/1' }}>
          {/* Triangle Border */}
          <div className="absolute left-0 right-0 mx-auto" 
               style={{ 
                 width: '0', 
                 height: '0', 
                 borderLeft: 'calc(50% - 1px) solid transparent',
                 borderRight: 'calc(50% - 1px) solid transparent',
                 borderBottom: 'calc(100% - 2px) solid #e5e7eb'
               }} />
          
          {/* Triangle Fill with Gradient */}
          <motion.div 
            className="absolute left-0 right-0 mx-auto overflow-hidden"
            initial={{ height: '0%' }}
            animate={{ height: `${fillHeight}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ 
              width: '0', 
              bottom: 0,
              borderLeft: 'calc(50% - 1px) solid transparent',
              borderRight: 'calc(50% - 1px) solid transparent',
              borderBottom: `calc(100% - 2px) solid transparent`,
              backgroundImage: `linear-gradient(to top, ${getColor(0)}, ${getColor(50)}, ${getColor(100)})`,
              WebkitMaskImage: 'linear-gradient(to top, black 0%, black 100%)',
              maskImage: 'linear-gradient(to top, black 0%, black 100%)',
            }}
          />
          
          {/* Milestone Lines */}
          {milestones.map((milestone) => (
            <div 
              key={milestone.value}
              className="absolute left-0 right-0 border-t border-dashed"
              style={{ 
                bottom: `${milestone.value}%`, 
                borderColor: milestone.color,
                zIndex: 5
              }}
            >
              <div className="absolute right-full mr-2 text-xs whitespace-nowrap" style={{ color: milestone.color }}>
                {milestone.label}
              </div>
            </div>
          ))}
          
          {/* Current Value Indicator */}
          <motion.div
            className="absolute right-full z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            style={{ bottom: `${Math.min(percentage, 100)}%` }}
          >
            <div className="mr-2 px-2 py-1 bg-white rounded-lg shadow-lg">
              <span className="text-sm font-medium" style={{ color: getColor(percentage) }}>
                {formatNumber(currentValue)}
              </span>
            </div>
          </motion.div>
          
          {/* Percentage Indicator */}
          <motion.div
            className="absolute left-full z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            style={{ bottom: `${Math.min(percentage, 100)}%` }}
          >
            <div className="ml-2 px-2 py-1 bg-white rounded-lg shadow-lg">
              <span className="text-sm font-medium" style={{ color: getColor(percentage) }}>
                {formatPercentage(percentage)}
              </span>
            </div>
          </motion.div>
          
          {/* Target Line */}
          <div className="absolute left-0 right-0 border-t-2 border-dashed border-red-500 z-10" style={{ bottom: '100%' }}>
            <div className="absolute top-0 right-0 transform -translate-y-full bg-red-500 text-white text-xs px-2 py-1 rounded">
              الهدف: {formatNumber(targetValue)}
            </div>
          </div>
          
          {/* Arrow instead of climber */}
          <motion.div
            className="absolute z-20"
            initial={{ bottom: '0%', left: '50%', x: '-50%' }}
            animate={{ 
              bottom: `${Math.min(percentage, 100)}%`, 
              left: `50%`, 
              x: '-50%'
            }}
            transition={{ duration: 2, ease: "easeOut" }}
          >
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <div className="bg-white p-1 rounded-full shadow-lg">
                <TrendingUp className="w-5 h-5" style={{ color: getColor(percentage) }} />
              </div>
            </motion.div>
          </motion.div>
          
          {/* Flag at the top */}
          <motion.div
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.5 }}
          >
            <span className="text-2xl">🚩</span>
          </motion.div>
        </div>
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
                top: `${Math.random() * 60}%`,
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
  );
}

// Mountain Visualization Component
function MountainVisualization({ 
  currentValue, 
  targetValue, 
  percentage, 
  getColor, 
  animationComplete 
}: {
  currentValue: number;
  targetValue: number;
  percentage: number;
  getColor: (pct: number) => string;
  animationComplete: boolean;
}) {
  // Calculate mountain height based on achievement
  const mountainHeight = Math.min(percentage, 100);
  
  // Calculate flag position
  const flagPosition = Math.min(percentage, 100);
  
  return (
    <>
      {/* Sky background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-100 to-blue-200 z-0" />
      
      {/* Mountain */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0"
        initial={{ height: 0 }}
        animate={{ height: `${mountainHeight}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{ 
          background: `linear-gradient(135deg, #4f46e5, #a855f7)`,
          borderTopLeftRadius: '50%',
          borderTopRightRadius: '50%'
        }}
      />
      
      {/* Snow cap */}
      <motion.div 
        className="absolute left-0 right-0"
        initial={{ bottom: '100%', opacity: 0 }}
        animate={{ 
          bottom: `${mountainHeight - 5}%`, 
          opacity: mountainHeight > 70 ? 1 : 0 
        }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
        style={{ 
          height: '10%',
          background: 'linear-gradient(135deg, #f9fafb, #e5e7eb)',
          borderTopLeftRadius: '50%',
          borderTopRightRadius: '50%',
          transform: 'scale(0.8, 0.3)',
          transformOrigin: 'bottom'
        }}
      />
      
      {/* Target line */}
      <div className="absolute left-0 right-0 border-t-2 border-dashed border-red-500 dark:border-red-400 z-10" style={{ bottom: '100%' }}>
        <div className="absolute top-0 right-4 transform -translate-y-full bg-red-500 text-white text-xs px-2 py-1 rounded">
          الهدف: {formatNumber(targetValue)}
        </div>
      </div>
      
      {/* Flag */}
      <motion.div
        className="absolute z-20"
        initial={{ bottom: '0%', opacity: 0 }}
        animate={{ 
          bottom: `${flagPosition}%`, 
          opacity: 1 
        }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.8 }}
        style={{ right: '20%' }}
      >
        <div className="relative">
          <div className="absolute bottom-0 w-1 h-10 bg-gray-800 dark:bg-gray-200"></div>
          <div 
            className="absolute bottom-7 right-0 w-8 h-6 flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: getColor(percentage) }}
          >
            {Math.round(percentage)}%
          </div>
        </div>
      </motion.div>
      
      {/* Climber */}
      <motion.div
        className="absolute z-10"
        initial={{ bottom: '0%', right: '80%' }}
        animate={{ 
          bottom: `${Math.min(percentage, 100)}%`, 
          right: `${20 + (Math.min(percentage, 100) / 100) * 60}%` 
        }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <div className="relative">
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <span className="text-2xl">🧗</span>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Current value indicator */}
      <motion.div
        className="absolute left-4 z-20 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-lg"
        initial={{ opacity: 0, bottom: '0%' }}
        animate={{ 
          opacity: 1, 
          bottom: `${Math.min(percentage, 100)}%` 
        }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <span className="text-sm font-medium" style={{ color: getColor(percentage) }}>
          {formatNumber(currentValue)}
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
          <div className="absolute top-1/4 left-1/4">
            <motion.div
              animate={{ 
                y: [0, -20],
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 0.5]
              }}
              transition={{ 
                repeat: Infinity,
                duration: 2,
                repeatType: 'loop'
              }}
            >
              <span className="text-2xl">🎉</span>
            </motion.div>
          </div>
          <div className="absolute top-1/3 right-1/4">
            <motion.div
              animate={{ 
                y: [0, -30],
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 0.5]
              }}
              transition={{ 
                repeat: Infinity,
                duration: 2.5,
                delay: 0.5,
                repeatType: 'loop'
              }}
            >
              <span className="text-2xl">🏆</span>
            </motion.div>
          </div>
          <div className="absolute top-1/2 left-1/3">
            <motion.div
              animate={{ 
                y: [0, -25],
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 0.5]
              }}
              transition={{ 
                repeat: Infinity,
                duration: 3,
                delay: 1,
                repeatType: 'loop'
              }}
            >
              <span className="text-2xl">⭐</span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </>
  );
}

// Circle Visualization Component
function CircleVisualization({ 
  currentValue, 
  targetValue, 
  percentage, 
  getColor, 
  animationComplete 
}: {
  currentValue: number;
  targetValue: number;
  percentage: number;
  getColor: (pct: number) => string;
  animationComplete: boolean;
}) {
  const size = 200;
  const thickness = 20;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={thickness}
          />
          
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor(percentage)}
            strokeWidth={thickness}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-3xl font-bold"
            style={{ color: getColor(percentage) }}
          >
            {formatPercentage(percentage)}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-sm text-gray-500 mt-1"
          >
            من الهدف
          </motion.div>
        </div>
      </div>
      
      {/* Value displays */}
      <div className="mt-8 grid grid-cols-2 gap-8">
        <div className="text-center">
          <div className="text-sm text-gray-500">الحالي</div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="text-xl font-bold"
            style={{ color: getColor(percentage) }}
          >
            {formatNumber(currentValue)}
          </motion.div>
        </div>
        
        <div className="text-center">
          <div className="text-sm text-gray-500">الهدف</div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="text-xl font-bold text-gray-700"
          >
            {formatNumber(targetValue)}
          </motion.div>
        </div>
      </div>
      
      {/* Celebration effects */}
      {percentage >= 100 && animationComplete && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.5 }}
        >
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ 
                top: '50%', 
                left: '50%',
                opacity: 0
              }}
              animate={{ 
                top: `${10 + Math.random() * 80}%`,
                left: `${10 + Math.random() * 80}%`,
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 2 + Math.random() * 2,
                delay: 1.5 + Math.random(),
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
  );
}

// Rocket Visualization Component
function RocketVisualization({ 
  currentValue, 
  targetValue, 
  percentage, 
  getColor, 
  animationComplete 
}: {
  currentValue: number;
  targetValue: number;
  percentage: number;
  getColor: (pct: number) => string;
  animationComplete: boolean;
}) {
  // Calculate rocket position
  const rocketPosition = Math.min(percentage, 100);
  
  return (
    <>
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
    </>
  );
}

// Thermometer Visualization Component
function ThermometerVisualization({ 
  currentValue, 
  targetValue, 
  percentage, 
  getColor, 
  animationComplete 
}: {
  currentValue: number;
  targetValue: number;
  percentage: number;
  getColor: (pct: number) => string;
  animationComplete: boolean;
}) {
  // Default milestones
  const milestones = [
    { value: 25, label: '25%' },
    { value: 50, label: '50%' },
    { value: 75, label: '75%' },
    { value: 100, label: '100%' }
  ];
  
  return (
    <div className="relative h-full w-full p-6 flex justify-center">
      {/* Thermometer container */}
      <div className="relative w-20 h-full">
        {/* Thermometer background */}
        <div className="absolute left-1/2 top-0 bottom-0 w-6 bg-gray-200 rounded-full transform -translate-x-1/2" />
        
        {/* Thermometer bulb */}
        <div className="absolute left-1/2 bottom-0 w-16 h-16 bg-gray-200 rounded-full transform -translate-x-1/2" />
        
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
        {milestones.map((milestone, index) => (
          <div 
            key={index}
            className="absolute left-0 right-0 flex items-center"
            style={{ bottom: `${milestone.value}%` }}
          >
            <div className="w-3 h-1 bg-gray-400" />
            <div className="flex-1 border-t border-dashed border-gray-300" />
            <div className="absolute right-full mr-2 text-xs text-gray-500 whitespace-nowrap">
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
          <div className="mr-2 px-2 py-1 bg-white rounded-lg shadow-lg">
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
          <div className="ml-2 px-2 py-1 bg-white rounded-lg shadow-lg">
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
  );
}

// Podium Visualization Component
function PodiumVisualization({ 
  currentValue, 
  targetValue, 
  percentage, 
  getColor, 
  animationComplete 
}: {
  currentValue: number;
  targetValue: number;
  percentage: number;
  getColor: (pct: number) => string;
  animationComplete: boolean;
}) {
  // Sample data for podium
  const performers = [
    { id: '1', name: 'الهدف', value: targetValue, color: '#10b981' },
    { id: '2', name: 'الإنجاز', value: currentValue, color: getColor(percentage) },
    { id: '3', name: 'الفرق', value: Math.max(targetValue - currentValue, 0), color: '#ef4444' }
  ];
  
  // Sort performers by value in descending order
  const sortedPerformers = [...performers].sort((a, b) => b.value - a.value);
  
  // Assign positions (2nd, 1st, 3rd)
  const [secondPlace, firstPlace, thirdPlace] = sortedPerformers;
  
  // Calculate heights based on values
  const highestValue = Math.max(...performers.map(p => p.value || 1));
  const getHeight = (value: number) => {
    if (highestValue === 0) return 0;
    return Math.max((value / highestValue) * 100, 10); // Minimum 10% height
  };
  
  return (
    <div className="h-full relative">
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
                {secondPlace.id === '2' && (
                  <div className="text-xs font-medium" style={{ color: secondPlace.color }}>
                    {formatPercentage(percentage)}
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
              backgroundColor: secondPlace.color,
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
                {firstPlace.id === '2' && (
                  <div className="text-xs font-medium" style={{ color: firstPlace.color }}>
                    {formatPercentage(percentage)}
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
              backgroundColor: firstPlace.color,
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
                {thirdPlace.id === '2' && (
                  <div className="text-xs font-medium" style={{ color: thirdPlace.color }}>
                    {formatPercentage(percentage)}
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
              backgroundColor: thirdPlace.color,
              minHeight: thirdPlace.value > 0 ? '20px' : '0'
            }}
          />
          <div className="absolute bottom-0 w-20 h-6 bg-amber-600 rounded-t-lg flex items-center justify-center text-white font-bold text-lg">
            3
          </div>
        </div>
      </div>
      
      {/* Percentage display */}
      <motion.div
        className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <span className="text-lg font-bold" style={{ color: getColor(percentage) }}>
          {formatPercentage(percentage)} من الهدف
        </span>
      </motion.div>
      
      {/* Celebration effects */}
      {percentage >= 100 && animationComplete && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
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
  );
}

// Mountain component for visualization options
function Mountain({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 21H2L9 4L16 15L22 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 21L11 10L7 16L5 19L16 21Z" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

// Triangle component for visualization options
function Triangle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L22 20H2L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 3L17 14H7L12 3Z" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}