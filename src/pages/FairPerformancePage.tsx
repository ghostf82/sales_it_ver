import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Trophy, 
  Medal, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpDown,
  Download,
  Sliders,
  RefreshCw,
  X,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Target,
  Wallet,
  Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { formatNumber, formatPercentage } from '../utils/numberUtils';
import { PerformancePodium } from '../components/PerformancePodium';
import html2canvas from 'html2canvas';
import { Slider } from '../components/ui/slider';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface RepresentativePerformance {
  id: string;
  name: string;
  sales: number;
  target: number;
  collection: number;
  achievement: number;
  balancedScore?: number;
}

interface RequiredValues {
  sales: number;
  target: number;
  collection: number;
  achievement: number;
}

export default function FairPerformancePage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [representatives, setRepresentatives] = useState<RepresentativePerformance[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [showSimulation, setShowSimulation] = useState(false);
  const [showEmptyData, setShowEmptyData] = useState(false);
  
  // Simulation state
  const [simulationRep, setSimulationRep] = useState<RepresentativePerformance | null>(null);
  const [simulatedSales, setSimulatedSales] = useState<number>(0);
  const [simulatedTarget, setSimulatedTarget] = useState<number>(0);
  const [simulatedCollection, setSimulatedCollection] = useState<number>(0);
  const [simulatedAchievement, setSimulatedAchievement] = useState<number>(0);
  const [simulatedScore, setSimulatedScore] = useState<number>(0);
  const [simulatedRank, setSimulatedRank] = useState<number>(0);
  const [originalRank, setOriginalRank] = useState<number>(0);
  const [rankChange, setRankChange] = useState<number>(0);
  const [targetRank, setTargetRank] = useState<number>(0);
  const [requiredValues, setRequiredValues] = useState<RequiredValues | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth, showEmptyData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch representative data
      const { data: repData, error: repError } = await supabase
        .from('representative_data')
        .select(`
          id,
          representative:representative_id(id, name),
          sales,
          target,
          year,
          month
        `)
        .eq('year', selectedYear)
        .eq('month', selectedMonth);

      if (repError) throw repError;

      // Fetch collection data
      const { data: collectionData, error: collectionError } = await supabase
        .from('collection_records')
        .select(`
          representative_id,
          amount,
          year,
          month
        `)
        .eq('year', selectedYear)
        .eq('month', selectedMonth);

      if (collectionError) throw collectionError;

      // Process and combine data
      const collectionMap = new Map<string, number>();
      collectionData?.forEach(record => {
        collectionMap.set(record.representative_id, record.amount);
      });

      // Group by representative and aggregate
      const repMap = new Map<string, RepresentativePerformance>();
      repData?.forEach(record => {
        const repId = record.representative.id;
        const repName = record.representative.name;
        
        if (!repMap.has(repId)) {
          repMap.set(repId, {
            id: repId,
            name: repName,
            sales: 0,
            target: 0,
            collection: collectionMap.get(repId) || 0,
            achievement: 0
          });
        }
        
        const rep = repMap.get(repId)!;
        rep.sales += record.sales;
        rep.target += record.target;
      });

      // Calculate achievement percentages
      const processedData = Array.from(repMap.values()).map(rep => {
        rep.achievement = rep.target > 0 ? (rep.sales / rep.target) * 100 : 0;
        return rep;
      });

      // Filter out representatives with no data if showEmptyData is false
      const filteredData = showEmptyData 
        ? processedData 
        : processedData.filter(rep => rep.sales > 0 || rep.target > 0 || rep.collection > 0);

      setRepresentatives(filteredData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('فشل في تحميل البيانات');
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const calculateBalancedScore = (rep: RepresentativePerformance): number => {
    // 1) حساب أعلى قيمة للمبيعات وأعلى قيمة للتحصيل بين كل المندوبين
    const maxSales = Math.max(...representatives.map(r => r.sales), rep.sales);
    const maxCollection = Math.max(...representatives.map(r => r.collection), rep.collection);
    
    // 2) حساب نسبة تحقيق الهدف (مقسومة على 100)
    const attainmentPct = Math.min((rep.sales / rep.target) * 100, 100);
    
    // 3) حساب نسبة المبيعات مقارنةً بـ maxSales
    const salesPctNorm = maxSales > 0 ? (rep.sales / maxSales) * 100 : 0;
    
    // 4) حساب نسبة التحصيل مقارنةً بـ maxCollection
    const collectionPctNorm = maxCollection > 0 ? (rep.collection / maxCollection) * 100 : 0;
    
    // 5) حساب الدرجات المرجحة
    const attainmentScore = attainmentPct * 0.50; // حتى 50 نقطة
    const salesScore = salesPctNorm * 0.30; // حتى 30 نقطة
    const collectionScore = collectionPctNorm * 0.20; // حتى 20 نقطة
    
    // 6) حساب الدرجة الإجمالية
    const totalScore = attainmentScore + salesScore + collectionScore;
    
    return totalScore;
  };

  const rankedRepresentatives = useMemo(() => {
    // Calculate balanced score for each representative
    const repsWithScores = representatives.map(rep => ({
      ...rep,
      balancedScore: calculateBalancedScore(rep)
    }));
    
    // Sort by balanced score in descending order
    return [...repsWithScores].sort((a, b) => b.balancedScore! - a.balancedScore!);
  }, [representatives]);

  const handleExportImage = async () => {
    try {
      const element = document.getElementById('performance-podium');
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = `fair-performance-${selectedYear}-${selectedMonth}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('تم تصدير الصورة بنجاح');
    } catch (err) {
      console.error('Error exporting image:', err);
      toast.error('فشل في تصدير الصورة');
    }
  };

  const handleSelectRepForSimulation = (rep: RepresentativePerformance) => {
    setSimulationRep(rep);
    setSimulatedSales(rep.sales);
    setSimulatedTarget(rep.target);
    setSimulatedCollection(rep.collection);
    setSimulatedAchievement(rep.achievement);
    
    // Calculate initial simulated score
    const score = calculateBalancedScore(rep);
    setSimulatedScore(score);
    
    // Calculate initial rank
    const rank = rankedRepresentatives.findIndex(r => r.id === rep.id) + 1;
    setOriginalRank(rank);
    setSimulatedRank(rank);
    setTargetRank(rank);
    setRankChange(0);
    setRequiredValues(null);
    
    setShowSimulation(true);
  };

  const updateSimulation = () => {
    if (!simulationRep) return;
    
    // Create a copy of the simulation rep with updated values
    const updatedRep = {
      ...simulationRep,
      sales: simulatedSales,
      target: simulatedTarget,
      collection: simulatedCollection,
      achievement: simulatedTarget > 0 ? (simulatedSales / simulatedTarget) * 100 : 0
    };
    
    // Calculate new score
    const score = calculateBalancedScore(updatedRep);
    setSimulatedScore(score);
    
    // Calculate new rank
    const simulatedReps = representatives.map(rep => 
      rep.id === simulationRep.id ? updatedRep : rep
    );
    
    const repsWithScores = simulatedReps.map(rep => ({
      ...rep,
      balancedScore: calculateBalancedScore(rep)
    }));
    
    const sortedReps = [...repsWithScores].sort((a, b) => b.balancedScore! - a.balancedScore!);
    const newRank = sortedReps.findIndex(r => r.id === simulationRep.id) + 1;
    
    setSimulatedRank(newRank);
    setRankChange(originalRank - newRank);
    setSimulatedAchievement(updatedRep.achievement);
  };

  // Helper functions for input adjustments
  const incrementValue = (setter: React.Dispatch<React.SetStateAction<number>>, value: number, step: number = 1000) => {
    setter(value + step);
    setTimeout(updateSimulation, 0);
  };

  const decrementValue = (setter: React.Dispatch<React.SetStateAction<number>>, value: number, step: number = 1000) => {
    setter(Math.max(0, value - step));
    setTimeout(updateSimulation, 0);
  };

  // Get color based on achievement percentage
  const getAchievementColor = (percentage: number) => {
    if (percentage >= 100) return 'from-green-500 to-green-600';
    if (percentage >= 80) return 'from-blue-500 to-blue-600';
    if (percentage >= 60) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-green-600';
    if (score >= 60) return 'from-blue-500 to-blue-600';
    if (score >= 40) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  // Calculate required values to reach a specific rank
  const calculateRequiredValues = (targetRankIndex: number) => {
    if (!simulationRep || targetRankIndex < 0 || targetRankIndex >= rankedRepresentatives.length) return null;
    
    // Get the representative at the target rank
    const targetRep = rankedRepresentatives[targetRankIndex];
    
    // Get the target score (add a small buffer to ensure we surpass it)
    const targetScore = targetRep.balancedScore! + 0.1;
    
    // Get the current values
    const currentSales = simulatedSales;
    const currentTarget = simulatedTarget;
    const currentCollection = simulatedCollection;
    
    // Get the maximum values for normalization
    const maxSales = Math.max(...representatives.map(r => r.sales), currentSales);
    const maxCollection = Math.max(...representatives.map(r => r.collection), currentCollection);
    
    // Calculate the current score components
    const currentAttainmentPct = Math.min((currentSales / currentTarget) * 100, 100);
    const currentSalesPctNorm = (currentSales / maxSales) * 100;
    const currentCollectionPctNorm = (currentCollection / maxCollection) * 100;
    
    const currentAttainmentScore = currentAttainmentPct * 0.50;
    const currentSalesScore = currentSalesPctNorm * 0.30;
    const currentCollectionScore = currentCollectionPctNorm * 0.20;
    
    // Calculate how much more score we need
    const scoreNeeded = targetScore - (currentAttainmentScore + currentSalesScore + currentCollectionScore);
    
    if (scoreNeeded <= 0) {
      // We already have enough score
      return {
        sales: currentSales,
        target: currentTarget,
        collection: currentCollection,
        achievement: currentAttainmentPct
      };
    }
    
    // Strategy 1: Increase sales (affects both attainment and sales score)
    // Calculate how much sales we need to increase to reach the target score
    let requiredSales = currentSales;
    let requiredTarget = currentTarget;
    let requiredCollection = currentCollection;
    
    // Iteratively increase sales until we reach the target score
    const stepSize = Math.max(currentSales * 0.01, 1000); // 1% of current sales or at least 1000
    let tempRep = {
      ...simulationRep,
      sales: requiredSales,
      target: requiredTarget,
      collection: requiredCollection
    };
    
    let tempScore = calculateBalancedScore(tempRep);
    
    // Try increasing sales first (most effective)
    while (tempScore < targetScore && requiredSales < maxSales * 2) {
      requiredSales += stepSize;
      tempRep.sales = requiredSales;
      tempRep.achievement = tempRep.target > 0 ? (tempRep.sales / tempRep.target) * 100 : 0;
      tempScore = calculateBalancedScore(tempRep);
    }
    
    // If still not enough, try increasing collection
    if (tempScore < targetScore) {
      requiredCollection = currentCollection;
      while (tempScore < targetScore && requiredCollection < maxCollection * 2) {
        requiredCollection += stepSize;
        tempRep.collection = requiredCollection;
        tempScore = calculateBalancedScore(tempRep);
      }
    }
    
    // Alternative strategy: Decrease target (improves achievement percentage)
    let alternativeTarget = currentTarget;
    let alternativeSales = currentSales;
    let alternativeCollection = currentCollection;
    
    tempRep = {
      ...simulationRep,
      sales: alternativeSales,
      target: alternativeTarget,
      collection: alternativeCollection
    };
    
    tempScore = calculateBalancedScore(tempRep);
    
    while (tempScore < targetScore && alternativeTarget > alternativeSales * 0.5) {
      alternativeTarget -= stepSize;
      tempRep.target = alternativeTarget;
      tempRep.achievement = tempRep.target > 0 ? (tempRep.sales / tempRep.target) * 100 : 0;
      tempScore = calculateBalancedScore(tempRep);
    }
    
    // Choose the better strategy (the one that requires less relative change)
    const salesChangeRatio = (requiredSales - currentSales) / currentSales;
    const targetChangeRatio = (currentTarget - alternativeTarget) / currentTarget;
    
    if (targetChangeRatio > 0 && targetChangeRatio < salesChangeRatio) {
      // Decreasing target is more efficient
      return {
        sales: currentSales,
        target: alternativeTarget,
        collection: currentCollection,
        achievement: alternativeTarget > 0 ? (currentSales / alternativeTarget) * 100 : 0
      };
    } else {
      // Increasing sales is more efficient
      return {
        sales: requiredSales,
        target: currentTarget,
        collection: requiredCollection,
        achievement: currentTarget > 0 ? (requiredSales / currentTarget) * 100 : 0
      };
    }
  };

  // Function to adjust rank directly
  const adjustRank = (direction: 'up' | 'down') => {
    if (!simulationRep) return;
    
    // Get the current sorted representatives with scores
    const repsWithScores = representatives.map(rep => ({
      ...rep,
      balancedScore: calculateBalancedScore(rep)
    }));
    
    const sortedReps = [...repsWithScores].sort((a, b) => b.balancedScore! - a.balancedScore!);
    
    // Find the current rank and the target rank
    const currentIndex = sortedReps.findIndex(r => r.id === simulationRep.id);
    const newTargetRank = direction === 'up' 
      ? Math.max(1, targetRank - 1)  // Move up in rank (lower number)
      : Math.min(sortedReps.length, targetRank + 1);  // Move down in rank (higher number)
    
    // If already at the top/bottom, do nothing
    if (newTargetRank === targetRank) return;
    
    setTargetRank(newTargetRank);
    
    // Calculate the target index (0-based)
    const targetIndex = newTargetRank - 1;
    
    // Calculate required values to reach the target rank
    const required = calculateRequiredValues(targetIndex);
    setRequiredValues(required);
    
    if (required) {
      // Update the simulated values
      setSimulatedSales(required.sales);
      setSimulatedTarget(required.target);
      setSimulatedCollection(required.collection);
      setSimulatedAchievement(required.achievement);
      
      // Update the simulation
      setTimeout(updateSimulation, 0);
    }
  };

  if (loading && !representatives.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">الأداء المتوازن</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportImage}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">تصدير</span>
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">تحديث</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">السنة</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">الشهر</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{t(`months.${m - 1}`)}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showEmptyData}
                onChange={() => setShowEmptyData(!showEmptyData)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">عرض المندوبين بدون بيانات</span>
            </label>
          </div>
        </div>
      </div>

      {/* Performance Podium */}
      <div id="performance-podium" className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">منصة الأداء المتوازن</h3>
          <p className="text-gray-600 text-sm">
            نظام تقييم متوازن يعتمد على ثلاثة معايير: تحقيق الهدف (50%)، حجم المبيعات (30%)، والتحصيل (20%).
          </p>
        </div>
        
        {rankedRepresentatives.length > 0 ? (
          <PerformancePodium 
            performers={rankedRepresentatives.map(rep => ({
              id: rep.id,
              name: rep.name,
              value: rep.sales,
              percentage: rep.achievement,
              fairScore: rep.balancedScore || 0
            }))}
            title=""
            valueLabel="المبيعات"
            className="mb-6"
          />
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">لا توجد بيانات متاحة</p>
          </div>
        )}
      </div>

      {/* Detailed Rankings */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">تفاصيل التقييم المتوازن</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900">الترتيب</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900">المندوب</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900">المبيعات</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900">الهدف</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900">التحصيل</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900">نسبة التحقيق</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900">التقييم المتوازن</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rankedRepresentatives.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Info className="w-12 h-12 text-gray-300 mb-2" />
                      <p className="text-lg font-medium">لا توجد بيانات متاحة</p>
                      <p className="text-sm text-gray-400">جرب تغيير معايير التصفية أو إضافة بيانات جديدة</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rankedRepresentatives.map((rep, index) => (
                  <tr key={rep.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-center font-bold">
                      {index === 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Trophy className="w-3 h-3 mr-1" /> 1
                        </span>
                      ) : index === 1 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <Medal className="w-3 h-3 mr-1" /> 2
                        </span>
                      ) : index === 2 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <Award className="w-3 h-3 mr-1" /> 3
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                          {index + 1}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{rep.name}</td>
                    <td className="px-4 py-3 text-sm tabular-nums">{formatNumber(rep.sales)}</td>
                    <td className="px-4 py-3 text-sm tabular-nums">{formatNumber(rep.target)}</td>
                    <td className="px-4 py-3 text-sm tabular-nums">{formatNumber(rep.collection)}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className={`h-2.5 rounded-full ${
                              rep.achievement >= 100 ? 'bg-green-600' :
                              rep.achievement >= 80 ? 'bg-blue-600' :
                              rep.achievement >= 60 ? 'bg-yellow-500' : 'bg-red-600'
                            }`}
                            style={{ width: `${Math.min(rep.achievement, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium tabular-nums">
                          {formatPercentage(rep.achievement)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium tabular-nums">
                      {rep.balancedScore ? rep.balancedScore.toFixed(1) : '0.0'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleSelectRepForSimulation(rep)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                      >
                        <Sliders className="w-3 h-3 mr-1" />
                        ماذا لو؟
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* What-If Simulation */}
      {showSimulation && simulationRep && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold flex items-center">
                <Sliders className="w-5 h-5 mr-2" />
                محاكاة "ماذا لو؟" للمندوب: {simulationRep.name}
              </h3>
              <button
                onClick={() => setShowSimulation(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Sales Slider */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <Label htmlFor="simulated-sales" className="text-blue-700 font-medium">المبيعات</Label>
                <div className="mt-2 relative">
                  <input
                    id="simulated-sales"
                    type="text"
                    value={formatNumber(simulatedSales)}
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, '');
                      if (!isNaN(Number(value))) {
                        setSimulatedSales(Number(value));
                      }
                    }}
                    onBlur={updateSimulation}
                    className="w-full px-4 py-2 pr-12 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                    <button 
                      className="text-blue-600 hover:text-blue-800 p-0.5"
                      onClick={() => incrementValue(setSimulatedSales, simulatedSales, 1000)}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button 
                      className="text-blue-600 hover:text-blue-800 p-0.5"
                      onClick={() => decrementValue(setSimulatedSales, simulatedSales, 1000)}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <Slider
                    value={[simulatedSales]}
                    min={0}
                    max={simulationRep.sales * 2}
                    step={1000}
                    onValueChange={(values) => {
                      setSimulatedSales(values[0]);
                      updateSimulation();
                    }}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>{formatNumber(simulationRep.sales * 2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Target Slider */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <Label htmlFor="simulated-target" className="text-indigo-700 font-medium">الهدف</Label>
                <div className="mt-2 relative">
                  <input
                    id="simulated-target"
                    type="text"
                    value={formatNumber(simulatedTarget)}
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, '');
                      if (!isNaN(Number(value))) {
                        setSimulatedTarget(Number(value));
                      }
                    }}
                    onBlur={updateSimulation}
                    className="w-full px-4 py-2 pr-12 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                    <button 
                      className="text-indigo-600 hover:text-indigo-800 p-0.5"
                      onClick={() => incrementValue(setSimulatedTarget, simulatedTarget, 1000)}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button 
                      className="text-indigo-600 hover:text-indigo-800 p-0.5"
                      onClick={() => decrementValue(setSimulatedTarget, simulatedTarget, 1000)}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <Slider
                    value={[simulatedTarget]}
                    min={0}
                    max={simulationRep.target * 2}
                    step={1000}
                    onValueChange={(values) => {
                      setSimulatedTarget(values[0]);
                      updateSimulation();
                    }}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>{formatNumber(simulationRep.target * 2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Collection Slider */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <Label htmlFor="simulated-collection" className="text-purple-700 font-medium">التحصيل</Label>
                <div className="mt-2 relative">
                  <input
                    id="simulated-collection"
                    type="text"
                    value={formatNumber(simulatedCollection)}
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, '');
                      if (!isNaN(Number(value))) {
                        setSimulatedCollection(Number(value));
                      }
                    }}
                    onBlur={updateSimulation}
                    className="w-full px-4 py-2 pr-12 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                    <button 
                      className="text-purple-600 hover:text-purple-800 p-0.5"
                      onClick={() => incrementValue(setSimulatedCollection, simulatedCollection, 1000)}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button 
                      className="text-purple-600 hover:text-purple-800 p-0.5"
                      onClick={() => decrementValue(setSimulatedCollection, simulatedCollection, 1000)}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <Slider
                    value={[simulatedCollection]}
                    min={0}
                    max={simulationRep.collection * 2}
                    step={1000}
                    onValueChange={(values) => {
                      setSimulatedCollection(values[0]);
                      updateSimulation();
                    }}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>{formatNumber(simulationRep.collection * 2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Results */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Achievement Percentage */}
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className={clsx(
                  "rounded-lg p-4 text-white shadow-lg bg-gradient-to-br",
                  simulatedAchievement >= 100 ? "from-green-500 to-green-600" :
                  simulatedAchievement >= 80 ? "from-blue-500 to-blue-600" :
                  simulatedAchievement >= 60 ? "from-yellow-500 to-yellow-600" :
                  "from-red-500 to-red-600"
                )}
              >
                <div className="text-center">
                  <div className="text-sm opacity-90 mb-1">نسبة تحقيق الهدف</div>
                  <div className="text-3xl font-bold">
                    {formatPercentage(simulatedAchievement)}
                  </div>
                  <div className="mt-2 h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full"
                      style={{ width: `${Math.min(simulatedAchievement, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
              
              {/* Balanced Score */}
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className={clsx(
                  "rounded-lg p-4 text-white shadow-lg bg-gradient-to-br",
                  simulatedScore >= 80 ? "from-green-500 to-green-600" :
                  simulatedScore >= 60 ? "from-blue-500 to-blue-600" :
                  simulatedScore >= 40 ? "from-yellow-500 to-yellow-600" :
                  "from-red-500 to-red-600"
                )}
              >
                <div className="text-center">
                  <div className="text-sm opacity-90 mb-1">التقييم المتوازن</div>
                  <div className="text-3xl font-bold">
                    {simulatedScore.toFixed(1)}
                  </div>
                  <div className="mt-2 h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full"
                      style={{ width: `${Math.min((simulatedScore / 100) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
              
              {/* Expected Rank */}
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white shadow-lg"
              >
                <div className="text-center">
                  <div className="text-sm opacity-90 mb-1">الترتيب المتوقع</div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <button 
                      onClick={() => adjustRank('up')}
                      className="bg-purple-400 hover:bg-purple-300 text-white p-1 rounded-md transition-colors"
                      title="تحسين الترتيب"
                      disabled={simulatedRank <= 1}
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <div className="text-3xl font-bold mx-2">
                      {simulatedRank}
                    </div>
                    <button 
                      onClick={() => adjustRank('down')}
                      className="bg-purple-400 hover:bg-purple-300 text-white p-1 rounded-md transition-colors"
                      title="خفض الترتيب"
                      disabled={simulatedRank >= representatives.length}
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {rankChange !== 0 && (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {rankChange > 0 ? (
                        <div className="flex items-center text-green-300">
                          <ArrowUp className="w-4 h-4" />
                          <span className="text-sm">
                            {Array(Math.min(rankChange, 3)).fill('•').join('')}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-300">
                          <ArrowDown className="w-4 h-4" />
                          <span className="text-sm">
                            {Array(Math.min(Math.abs(rankChange), 3)).fill('•').join('')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-2 flex justify-center">
                    {simulatedRank === 1 ? (
                      <Trophy className="w-6 h-6 text-yellow-300" />
                    ) : simulatedRank === 2 ? (
                      <Medal className="w-6 h-6 text-gray-300" />
                    ) : simulatedRank === 3 ? (
                      <Award className="w-6 h-6 text-amber-600" />
                    ) : (
                      <span className="text-sm opacity-75">المركز {simulatedRank}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Required Values to Reach Next Rank */}
            {requiredValues && simulatedRank > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-sm p-4 mb-6"
              >
                <h4 className="font-medium mb-3 text-gray-700 border-b pb-2 flex items-center">
                  <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                  المطلوب للوصول إلى المركز {targetRank}:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
                      <span className="text-sm font-medium text-blue-800">الحد الأدنى للمبيعات</span>
                    </div>
                    <div className="text-lg font-bold text-blue-700 tabular-nums">
                      {formatNumber(requiredValues.sales)}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {requiredValues.sales > simulationRep.sales 
                        ? `زيادة بمقدار ${formatNumber(requiredValues.sales - simulationRep.sales)}`
                        : 'لا تغيير مطلوب'}
                    </div>
                  </div>
                  
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <Target className="w-4 h-4 text-indigo-600 mr-1" />
                      <span className="text-sm font-medium text-indigo-800">الهدف المطلوب</span>
                    </div>
                    <div className="text-lg font-bold text-indigo-700 tabular-nums">
                      {formatNumber(requiredValues.target)}
                    </div>
                    <div className="text-xs text-indigo-600 mt-1">
                      {requiredValues.target < simulationRep.target 
                        ? `تخفيض بمقدار ${formatNumber(simulationRep.target - requiredValues.target)}`
                        : 'لا تغيير مطلوب'}
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <Wallet className="w-4 h-4 text-purple-600 mr-1" />
                      <span className="text-sm font-medium text-purple-800">الحد الأدنى للتحصيل</span>
                    </div>
                    <div className="text-lg font-bold text-purple-700 tabular-nums">
                      {formatNumber(requiredValues.collection)}
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      {requiredValues.collection > simulationRep.collection 
                        ? `زيادة بمقدار ${formatNumber(requiredValues.collection - simulationRep.collection)}`
                        : 'لا تغيير مطلوب'}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 p-2 bg-green-50 rounded-lg text-sm text-green-700">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <span>نسبة تحقيق الهدف المطلوبة: <strong>{formatPercentage(requiredValues.achievement)}</strong></span>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Calculation Details */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h4 className="font-medium mb-3 text-gray-700 border-b pb-2">تفاصيل حساب التقييم المتوازن:</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span className="font-medium text-gray-700">تحقيق الهدف (50%):</span>
                  </div>
                  <div className="text-blue-600 font-medium">
                    {formatPercentage(Math.min(simulatedAchievement, 100))} × 0.5 = <span className="text-blue-700 font-bold">{(Math.min(simulatedAchievement, 100) * 0.5).toFixed(1)}</span> نقطة
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
                    <span className="font-medium text-gray-700">حجم المبيعات (30%):</span>
                  </div>
                  <div className="text-indigo-600 font-medium">
                    {formatPercentage((simulatedSales / Math.max(...representatives.map(r => r.sales), simulatedSales)) * 100)} × 0.3 = <span className="text-indigo-700 font-bold">{((simulatedSales / Math.max(...representatives.map(r => r.sales), simulatedSales)) * 100 * 0.3).toFixed(1)}</span> نقطة
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                    <span className="font-medium text-gray-700">التحصيل (20%):</span>
                  </div>
                  <div className="text-purple-600 font-medium">
                    {formatPercentage((simulatedCollection / Math.max(...representatives.map(r => r.collection), simulatedCollection)) * 100)} × 0.2 = <span className="text-purple-700 font-bold">{((simulatedCollection / Math.max(...representatives.map(r => r.collection), simulatedCollection)) * 100 * 0.2).toFixed(1)}</span> نقطة
                  </div>
                </div>
                
                <div className="pt-2 mt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">المجموع:</span>
                    <span className="font-bold text-lg text-blue-700">{simulatedScore.toFixed(1)} نقطة</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Explanation */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">شرح نظام التقييم المتوازن</h3>
        <p className="text-gray-700 leading-relaxed">
          نظام التقييم المتوازن يعتمد على ثلاثة معايير رئيسية بأوزان مختلفة لضمان تقييم عادل للمندوبين:
        </p>
        <ul className="mt-4 space-y-3">
          <li className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
              <span className="text-blue-800 font-bold text-sm">1</span>
            </div>
            <div>
              <span className="font-medium">تحقيق الهدف (50%):</span> يقيس مدى نجاح المندوب في تحقيق الهدف المحدد له، ويمثل 50% من التقييم النهائي. يتم حساب هذا المعيار بأخذ نسبة تحقيق الهدف (بحد أقصى 100%) وضربها في 0.5.
            </div>
          </li>
          <li className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
              <span className="text-blue-800 font-bold text-sm">2</span>
            </div>
            <div>
              <span className="font-medium">حجم المبيعات (30%):</span> يقيس حجم مبيعات المندوب مقارنة بأعلى مبيعات بين جميع المندوبين، ويمثل 30% من التقييم النهائي. يتم حساب هذا المعيار بقسمة مبيعات المندوب على أعلى مبيعات وضرب الناتج في 30.
            </div>
          </li>
          <li className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
              <span className="text-blue-800 font-bold text-sm">3</span>
            </div>
            <div>
              <span className="font-medium">التحصيل (20%):</span> يقيس حجم تحصيل المندوب مقارنة بأعلى تحصيل بين جميع المندوبين، ويمثل 20% من التقييم النهائي. يتم حساب هذا المعيار بقسمة تحصيل المندوب على أعلى تحصيل وضرب الناتج في 20.
            </div>
          </li>
        </ul>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800">
            نأخذ نسبة تحقيق الهدف لكل مندوب (بحد أقصى 100%) ونضربها في 50%، ثم نقوم بتطبيع مبيعات كل مندوب نسبة إلى أعلى مبيعات بين جميع المندوبين ونضربها في 30%، وأخيراً نطبع تحصيل كل مندوب نسبة إلى أعلى تحصيل بين جميع المندوبين ونضربها في 20%. مجموع هذه الأجزاء الثلاثة يعطينا درجة عادلة من 100 تضمن ترتيب المندوبين بشكل مناسب بناءً على أعلى مبيعات وأعلى تحصيل ونسبة تحقيق الهدف.
          </p>
        </div>
      </div>
    </div>
  );
}