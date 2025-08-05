import { useState, useEffect } from 'react';
import SpeedometerGauge from './SpeedometerGauge';
import { GaugeChart } from './GaugeChart';
import { Slider } from '../components/ui/slider';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Download, RefreshCw, Layers } from 'lucide-react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

interface MultiGaugeDisplayProps {
  currentValue: number;
  targetValue: number;
  title?: string;
  className?: string;
}

export function MultiGaugeDisplay({
  currentValue,
  targetValue,
  title = 'نسبة تحقيق الأهداف',
  className = ''
}: MultiGaugeDisplayProps) {
  const [gaugeType, setGaugeType] = useState<'speedometer' | 'gauge' | 'multi'>('speedometer');
  const [showAnimation, setShowAnimation] = useState(true);
  
  const handleExport = async () => {
    try {
      const element = document.getElementById('gauge-container');
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = `goal-achievement-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('تم تصدير الصورة بنجاح');
    } catch (err) {
      console.error('Error exporting image:', err);
      toast.error('فشل في تصدير الصورة');
    }
  };
  
  const handleReset = () => {
    setShowAnimation(false);
    setTimeout(() => {
      setShowAnimation(true);
    }, 100);
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-white hover:bg-gray-100 transition-colors text-gray-700 border border-gray-200"
            title="إعادة التشغيل"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExport}
            className="p-2 rounded-lg bg-white hover:bg-gray-100 transition-colors text-gray-700 border border-gray-200"
            title="تصدير"
          >
            <Download className="w-4 h-4" />
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => setGaugeType('speedometer')}
              className={`p-2 rounded-lg transition-colors ${gaugeType === 'speedometer' ? 'bg-blue-100 text-blue-600' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'}`}
              title="عداد سرعة"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGaugeType('gauge')}
              className={`p-2 rounded-lg transition-colors ${gaugeType === 'gauge' ? 'bg-blue-100 text-blue-600' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'}`}
              title="مقياس تدرجي"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGaugeType('multi')}
              className={`p-2 rounded-lg transition-colors ${gaugeType === 'multi' ? 'bg-blue-100 text-blue-600' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'}`}
              title="عرض متعدد"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      <div id="gauge-container" className="p-4 bg-white">
        {gaugeType === 'speedometer' && (
          <SpeedometerGauge
            currentValue={currentValue}
            targetValue={targetValue}
            title=""
            showAnimation={showAnimation}
          />
        )}
        
        {gaugeType === 'gauge' && (
          <GaugeChart
            currentValue={currentValue}
            targetValue={targetValue}
            title=""
            showAnimation={showAnimation}
          />
        )}
        
        {gaugeType === 'multi' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GaugeChart
              currentValue={currentValue}
              targetValue={targetValue}
              title="مقياس تدرجي"
              showAnimation={showAnimation}
              colorScheme="blue"
              height={300}
              width={400}
            />
            <SpeedometerGauge
              currentValue={currentValue}
              targetValue={targetValue}
              title="عداد سرعة"
              showAnimation={showAnimation}
              height={300}
              width={400}
            />
          </div>
        )}
      </div>
    </div>
  );
}