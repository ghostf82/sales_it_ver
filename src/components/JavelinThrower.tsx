import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';

interface JavelinThrowerProps {
  targetValue: number;
  maxValue: number;
  label: string;
}

export function JavelinThrower({ targetValue, maxValue, label }: JavelinThrowerProps) {
  const controls = useAnimation();
  const javelinControls = useAnimation();
  const [isAnimating, setIsAnimating] = useState(true);
  
  // Calculate the percentage for animation timing
  const percentage = Math.min((targetValue / maxValue) * 100, 100);
  const throwDistance = Math.min((percentage / 100) * 80, 80); // Max 80% of container width
  
  const startAnimation = async () => {
    setIsAnimating(true);
    
    // Reset positions
    await Promise.all([
      controls.start({
        x: 0,
        opacity: 1,
        scale: 1,
        transition: { duration: 0 }
      }),
      javelinControls.start({
        x: 0,
        y: 0,
        rotate: 0,
        opacity: 1,
        transition: { duration: 0 }
      })
    ]);

    // Athlete running animation
    await controls.start({
      x: '25%',
      transition: {
        duration: 1.5,
        ease: "easeInOut"
      }
    });

    // Throwing pose
    await controls.start({
      scale: 1.1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    });

    // Javelin throw animation
    javelinControls.start({
      x: `${throwDistance - 25}%`,
      y: [0, -40, 0],
      rotate: [0, -10, -20],
      transition: {
        duration: 1.5,
        ease: "easeOut"
      }
    });

    // Athlete follow-through
    await controls.start({
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    });

    // Wait for javelin to land
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Celebration effect
    await controls.start({
      y: [0, -10, 0],
      transition: {
        duration: 0.5,
        ease: "easeInOut"
      }
    });

    setIsAnimating(false);
  };

  useEffect(() => {
    startAnimation();

    // Restart animation every 10 seconds
    const interval = setInterval(() => {
      if (!isAnimating) {
        startAnimation();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  return (
    <div className="relative h-48 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl overflow-hidden">
      {/* Sky background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200 to-sky-300 dark:from-sky-900/30 dark:to-sky-800/30" />
      
      {/* Track */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-b from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20" />
      
      {/* Target line */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-red-500"
        style={{ left: `${throwDistance}%` }}
      >
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded">
          {label}
        </div>
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded">
          {formatNumber(targetValue)}
        </div>
      </div>

      {/* Athlete */}
      <motion.div
        animate={controls}
        className="absolute bottom-12 left-4"
        initial={{ x: 0 }}
      >
        <img 
          src="https://images.unsplash.com/photo-1589802829985-817e51171b92?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100&q=80" 
          alt="Javelin Thrower"
          className="h-16 w-auto object-contain"
        />
      </motion.div>

      {/* Javelin */}
      <motion.div
        animate={javelinControls}
        className="absolute bottom-20 left-12"
        initial={{ x: 0, y: 0, rotate: 0 }}
      >
        <div className="w-20 h-1 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full transform -rotate-12">
          <div className="absolute right-0 w-0 h-0 border-t-2 border-r-4 border-b-2 border-gray-700 border-solid" />
        </div>
      </motion.div>

      {/* Value display */}
      <motion.div
        className="absolute top-4 right-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.9, 1, 0.9],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      >
        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {targetValue.toLocaleString()}
        </span>
      </motion.div>

      {/* Celebration effects */}
      {!isAnimating && (
        <motion.div
          className="absolute"
          style={{ left: `${throwDistance}%`, top: '50%' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1.2, 1],
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 1 }}
        >
          <div className="flex gap-1">
            {['🎯', '🏆', '🥇', '✨'].map((emoji, i) => (
              <motion.span
                key={i}
                animate={{
                  y: [-20, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.1,
                }}
                className="text-2xl"
              >
                {emoji}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Max value indicator */}
      <div className="absolute top-2 left-2 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded text-xs">
        الهدف: {formatNumber(maxValue)}
      </div>
    </div>
  );
}