import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Wallet, Coins, 
  Target, Calendar, ArrowUpRight, ArrowDownRight,
  Download, Share2, RefreshCw, Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { MultiSelect } from '../components/MultiSelect';
import toast from 'react-hot-toast';
import { calculateCommission } from '../utils/commission';
import { groupCollectionsByRepMonth, calculateTotalCollection } from '../utils/collection';
import { useRealtimeData } from '../hooks/useRealtimeData';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { AIAnalysisModal } from '../components/AIAnalysisModal';
import html2canvas from 'html2canvas';
import { formatNumber, formatPercentage, formatDisplayNumber } from '../utils/numberUtils';
import { useDataPersistence, useFilterPersistence } from '../hooks/useDataPersistence';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DataEntry {
  id: string;
  company: { id: string; name: string };
  representative: { id: string; name: string };
  category: string;
  sales: number;
  target: number;
  collection: number;
  year: number;
  month: number;
}

interface CommissionRule {
  category: string;
  tier1_from: number;
  tier1_to: number;
  tier1_rate: number;
  tier2_from: number;
  tier2_to: number;
  tier2_rate: number;
  tier3_from: number;
  tier3_rate: number;
}

interface DateRange {
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
}

interface PeriodData {
  totalSales: number;
  totalTarget: number;
  totalCollection: number;
  totalCommission: number;
  topSeller: {
    name: string;
    value: number;
  } | null;
  topCategory: {
    name: string;
    value: number;
  } | null;
  lowestPerformer: {
    name: string;
    achievement: number;
  } | null;
  monthlySales: Record<string, number>;
  monthlyCollection: Record<string, number>;
  monthlyTarget: Record<string, number>;
  monthlyCommission: Record<string, number>;
}

export function AnalysisPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Data state with persistence
  const { data, updateData } = useDataPersistence<DataEntry[]>([], 'analysis');
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [representatives, setRepresentatives] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  
  // Period data with persistence
  const { data: currentPeriodData, updateData: updateCurrentPeriodData } = useDataPersistence<PeriodData | null>(null, 'currentPeriod');
  const { data: previousPeriodData, updateData: updatePreviousPeriodData } = useDataPersistence<PeriodData | null>(null, 'previousPeriod');
  
  // AI Analysis
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [showAiAnalysisModal, setShowAiAnalysisModal] = useState(false);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);

  // Date range state with persistence
  const { data: dateRange, updateData: updateDateRange } = useDataPersistence<DateRange>({
    startYear: new Date().getFullYear(),
    startMonth: 1,
    endYear: new Date().getFullYear(),
    endMonth: new Date().getMonth() + 1
  }, 'dateRange');

  // Subscribe to real-time updates
  useRealtimeData({
    table: 'representative_data',
    onInsert: () => {
      fetchData();
      toast.success('تم تحديث البيانات');
    },
    onUpdate: () => {
      fetchData();
      toast.success('تم تحديث البيانات');
    },
    onDelete: () => {
      fetchData();
      toast.success('تم تحديث البيانات');
    }
  });

  useEffect(() => {
    fetchCompanies();
    fetchRepresentatives();
    fetchCategories();
    fetchCommissionRules();
  }, []);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
      toast.error('فشل في تحميل بيانات الشركات');
    }
  };

  const fetchRepresentatives = async () => {
    try {
      const { data, error } = await supabase
        .from('representatives')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setRepresentatives(data || []);
    } catch (err) {
      console.error('Error fetching representatives:', err);
      toast.error('فشل في تحميل بيانات المندوبين');
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.error('فشل في تحميل بيانات الأصناف');
    }
  };

  const fetchCommissionRules = async () => {
    try {
      const { data, error } = await supabase
        .from('commission_rules')
        .select('*')
        .order('category');

      if (error) throw error;
      setCommissionRules(data || []);
    } catch (err) {
      console.error('Error fetching commission rules:', err);
      setError('Failed to load commission rules');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError('');

      // Calculate current period date range
      const currentStartDate = new Date(dateRange.startYear, dateRange.startMonth - 1, 1);
      const currentEndDate = new Date(dateRange.endYear, dateRange.endMonth, 0);
      
      // Calculate previous period with same duration
      const durationInMonths = 
        (dateRange.endYear - dateRange.startYear) * 12 + 
        (dateRange.endMonth - dateRange.startMonth) + 1;
      
      let prevStartDate = new Date(currentStartDate);
      prevStartDate.setMonth(prevStartDate.getMonth() - durationInMonths);
      
      let prevEndDate = new Date(currentEndDate);
      prevEndDate.setMonth(prevEndDate.getMonth() - durationInMonths);
      
      const prevStartYear = prevStartDate.getFullYear();
      const prevStartMonth = prevStartDate.getMonth() + 1;
      const prevEndYear = prevEndDate.getFullYear();
      const prevEndMonth = prevEndDate.getMonth() + 1;

      // Fetch current period data
      const currentPeriodResult = await fetchPeriodData(
        dateRange.startYear,
        dateRange.startMonth,
        dateRange.endYear,
        dateRange.endMonth
      );
      
      // Fetch previous period data
      const previousPeriodResult = await fetchPeriodData(
        prevStartYear,
        prevStartMonth,
        prevEndYear,
        prevEndMonth
      );

      updateCurrentPeriodData(currentPeriodResult);
      updatePreviousPeriodData(previousPeriodResult);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPeriodData = async (
    startYear: number,
    startMonth: number,
    endYear: number,
    endMonth: number
  ): Promise<PeriodData> => {
    // Build query for representative data
    let query = supabase
      .from('representative_data')
      .select(`
        id,
        company:company_id(id, name),
        representative:representative_id(id, name),
        category,
        sales,
        target,
        year,
        month
      `);

    // Apply date range filter
    query = query.or(
      `and(year.gt.${startYear-1},year.lt.${endYear+1})` // Get all years in range
    ).or(
      `and(year.eq.${startYear},month.gte.${startMonth})`,
      `and(year.eq.${endYear},month.lte.${endMonth})`
    );

    const { data: repData, error: repError } = await query;
    if (repError) throw repError;

    // Get collection records
    let collectionQuery = supabase
      .from('collection_records')
      .select(`
        representative:representative_id(id, name),
        amount,
        year,
        month
      `);

    // Apply date range filter
    collectionQuery = collectionQuery.or(
      `and(year.gt.${startYear-1},year.lt.${endYear+1})` // Get all years in range
    ).or(
      `and(year.eq.${startYear},month.gte.${startMonth})`,
      `and(year.eq.${endYear},month.lte.${endMonth})`
    );

    const { data: collectionData, error: collectionError } = await collectionQuery;
    if (collectionError) throw collectionError;

    // Filter data to only include the specified date range
    const filteredRepData = repData?.filter(record => {
      // Skip records with null representative
      if (!record.representative) {
        console.warn('Skipping record with null representative:', record);
        return false;
      }
      
      const recordDate = new Date(record.year, record.month - 1);
      const startDate = new Date(startYear, startMonth - 1);
      const endDate = new Date(endYear, endMonth - 1);
      return recordDate >= startDate && recordDate <= endDate;
    }) || [];

    const filteredCollectionData = collectionData?.filter(record => {
      const recordDate = new Date(record.year, record.month - 1);
      const startDate = new Date(startYear, startMonth - 1);
      const endDate = new Date(endYear, endMonth - 1);
      return recordDate >= startDate && recordDate <= endDate;
    }) || [];

    // Process data
    let totalSales = 0;
    let totalTarget = 0;
    let totalCommission = 0;
    let totalCollection = 0;
    
    // For top performers
    const repSales: Record<string, number> = {};
    const repAchievement: Record<string, { sales: number; target: number }> = {};
    const categorySales: Record<string, number> = {};
    
    // For monthly data
    const monthlySales: Record<string, number> = {};
    const monthlyTarget: Record<string, number> = {};
    const monthlyCommission: Record<string, number> = {};
    const monthlyCollection: Record<string, number> = {};

    // Process sales data
    filteredRepData.forEach(record => {
      const { sales, target, representative, category, year, month } = record;
      
      // Add to totals
      totalSales += sales;
      totalTarget += target;
      
      // Add to representative totals
      const repId = representative.id;
      const repName = representative.name;
      
      if (!repSales[repId]) {
        repSales[repId] = 0;
        repAchievement[repId] = { sales: 0, target: 0 };
      }
      
      repSales[repId] += sales;
      repAchievement[repId].sales += sales;
      repAchievement[repId].target += target;
      
      // Add to category totals
      if (!categorySales[category]) {
        categorySales[category] = 0;
      }
      categorySales[category] += sales;
      
      // Add to monthly data
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      if (!monthlySales[monthKey]) {
        monthlySales[monthKey] = 0;
        monthlyTarget[monthKey] = 0;
        monthlyCommission[monthKey] = 0;
      }
      
      monthlySales[monthKey] += sales;
      monthlyTarget[monthKey] += target;
      
      // Calculate commission
      const rule = commissionRules.find(r => r.category === category);
      if (rule) {
        const result = calculateCommission({
          sales,
          goal: target,
          achievement_percent: target === 0 ? 0 : (sales / target) * 100,
          tier1_rate: rule.tier1_rate,
          tier2_rate: rule.tier2_rate,
          tier3_rate: rule.tier3_rate
        });
        
        totalCommission += result.total_commission;
        monthlyCommission[monthKey] += result.total_commission;
      }
    });

    // Process collection data
    filteredCollectionData.forEach(record => {
      const { amount, year, month } = record;
      
      totalCollection += amount;
      
      // Add to monthly data
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      if (!monthlyCollection[monthKey]) {
        monthlyCollection[monthKey] = 0;
      }
      
      monthlyCollection[monthKey] += amount;
    });

    // Find top seller
    let topSeller = null;
    let maxSales = 0;
    Object.entries(repSales).forEach(([repId, sales]) => {
      if (sales > maxSales) {
        maxSales = sales;
        const rep = representatives.find(r => r.id === repId);
        if (rep) {
          topSeller = {
            name: rep.name,
            value: sales
          };
        }
      }
    });

    // Find top category
    let topCategory = null;
    let maxCategorySales = 0;
    Object.entries(categorySales).forEach(([category, sales]) => {
      if (sales > maxCategorySales) {
        maxCategorySales = sales;
        topCategory = {
          name: category,
          value: sales
        };
      }
    });

    // Find lowest performer (based on achievement percentage)
    let lowestPerformer = null;
    let lowestAchievement = Infinity;
    Object.entries(repAchievement).forEach(([repId, data]) => {
      if (data.target > 0) {
        const achievement = (data.sales / data.target) * 100;
        if (achievement < lowestAchievement) {
          lowestAchievement = achievement;
          const rep = representatives.find(r => r.id === repId);
          if (rep) {
            lowestPerformer = {
              name: rep.name,
              achievement
            };
          }
        }
      }
    });

    return {
      totalSales,
      totalTarget,
      totalCollection,
      totalCommission,
      topSeller,
      topCategory,
      lowestPerformer,
      monthlySales,
      monthlyCollection,
      monthlyTarget,
      monthlyCommission
    };
  };

  const handleDateRangeChange = (field: keyof DateRange, value: number) => {
    updateDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleExportImage = async () => {
    try {
      const dashboardElement = document.getElementById('analysis-dashboard');
      if (!dashboardElement) return;
      
      const canvas = await html2canvas(dashboardElement, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = `dashboard-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('تم تصدير الصورة بنجاح');
    } catch (err) {
      console.error('Error exporting image:', err);
      toast.error('فشل في تصدير الصورة');
    }
  };

  const generateAIAnalysis = async () => {
    if (!currentPeriodData || !previousPeriodData) return;
    
    try {
      setGeneratingAnalysis(true);
      
      // Prepare data for analysis
      const analysisData = {
        currentPeriod: {
          startDate: `${dateRange.startMonth}/${dateRange.startYear}`,
          endDate: `${dateRange.endMonth}/${dateRange.endYear}`,
          totalSales: currentPeriodData.totalSales,
          totalTarget: currentPeriodData.totalTarget,
          totalCollection: currentPeriodData.totalCollection,
          totalCommission: currentPeriodData.totalCommission,
          topSeller: currentPeriodData.topSeller,
          topCategory: currentPeriodData.topCategory,
          lowestPerformer: currentPeriodData.lowestPerformer,
          salesAchievement: currentPeriodData.totalTarget > 0 
            ? (currentPeriodData.totalSales / currentPeriodData.totalTarget) * 100 
            : 0,
          collectionRate: currentPeriodData.totalSales > 0 
            ? (currentPeriodData.totalCollection / currentPeriodData.totalSales) * 100 
            : 0
        },
        previousPeriod: {
          totalSales: previousPeriodData.totalSales,
          totalTarget: previousPeriodData.totalTarget,
          totalCollection: previousPeriodData.totalCollection,
          totalCommission: previousPeriodData.totalCommission,
          salesAchievement: previousPeriodData.totalTarget > 0 
            ? (previousPeriodData.totalSales / previousPeriodData.totalTarget) * 100 
            : 0,
          collectionRate: previousPeriodData.totalSales > 0 
            ? (previousPeriodData.totalCollection / previousPeriodData.totalSales) * 100 
            : 0
        },
        changes: {
          sales: calculatePercentageChange(previousPeriodData.totalSales, currentPeriodData.totalSales),
          target: calculatePercentageChange(previousPeriodData.totalTarget, currentPeriodData.totalTarget),
          collection: calculatePercentageChange(previousPeriodData.totalCollection, currentPeriodData.totalCollection),
          commission: calculatePercentageChange(previousPeriodData.totalCommission, currentPeriodData.totalCommission),
          salesAchievement: calculatePercentageChange(
            previousPeriodData.totalTarget > 0 ? (previousPeriodData.totalSales / previousPeriodData.totalTarget) * 100 : 0,
            currentPeriodData.totalTarget > 0 ? (currentPeriodData.totalSales / currentPeriodData.totalTarget) * 100 : 0
          ),
          collectionRate: calculatePercentageChange(
            previousPeriodData.totalSales > 0 ? (previousPeriodData.totalCollection / previousPeriodData.totalSales) * 100 : 0,
            currentPeriodData.totalSales > 0 ? (currentPeriodData.totalCollection / currentPeriodData.totalSales) * 100 : 0
          )
        }
      };

      // Generate analysis text
      const analysisText = `
تحليل أداء المبيعات والتحصيل

الفترة: ${dateRange.startMonth}/${dateRange.startYear} إلى ${dateRange.endMonth}/${dateRange.endYear}

1. ملخص الأداء:
   - إجمالي المبيعات: ${formatNumber(currentPeriodData.totalSales)} (${analysisData.changes.sales > 0 ? '+' : ''}${formatPercentage(analysisData.changes.sales)} عن الفترة السابقة)
   - إجمالي التحصيل: ${formatNumber(currentPeriodData.totalCollection)} (${analysisData.changes.collection > 0 ? '+' : ''}${formatPercentage(analysisData.changes.collection)} عن الفترة السابقة)
   - إجمالي الأهداف: ${formatNumber(currentPeriodData.totalTarget)} (${analysisData.changes.target > 0 ? '+' : ''}${formatPercentage(analysisData.changes.target)} عن الفترة السابقة)
   - إجمالي العمولات: ${formatNumber(currentPeriodData.totalCommission)} (${analysisData.changes.commission > 0 ? '+' : ''}${formatPercentage(analysisData.changes.commission)} عن الفترة السابقة)

2. مؤشرات الأداء الرئيسية:
   - نسبة تحقيق الهدف: ${formatPercentage(analysisData.currentPeriod.salesAchievement)} (${analysisData.changes.salesAchievement > 0 ? '+' : ''}${formatPercentage(analysisData.changes.salesAchievement)} عن الفترة السابقة)
   - نسبة التحصيل من المبيعات: ${formatPercentage(analysisData.currentPeriod.collectionRate)} (${analysisData.changes.collectionRate > 0 ? '+' : ''}${formatPercentage(analysisData.changes.collectionRate)} عن الفترة السابقة)

3. أفضل الأداء:
   - أفضل مندوب مبيعات: ${currentPeriodData.topSeller?.name || 'غير متوفر'} (${formatNumber(currentPeriodData.topSeller?.value || 0)})
   - أفضل صنف مبيعاً: ${currentPeriodData.topCategory?.name || 'غير متوفر'} (${formatNumber(currentPeriodData.topCategory?.value || 0)})

4. فرص التحسين:
   - أقل أداء مقارنة بالأهداف: ${currentPeriodData.lowestPerformer?.name || 'غير متوفر'} (${formatPercentage(currentPeriodData.lowestPerformer?.achievement || 0)} من الهدف)

5. التوصيات:
${analysisData.changes.sales < 0 ? '   - العمل على زيادة المبيعات من خلال حملات ترويجية وتحفيز المندوبين\n' : ''}
${analysisData.changes.collection < 0 ? '   - تحسين عمليات التحصيل وتطوير آليات المتابعة\n' : ''}
${analysisData.currentPeriod.salesAchievement < 70 ? '   - مراجعة الأهداف وتعديلها لتكون أكثر واقعية\n' : ''}
${currentPeriodData.lowestPerformer ? '   - تقديم الدعم والتدريب للمندوب ' + currentPeriodData.lowestPerformer.name + ' لتحسين أدائه\n' : ''}
${analysisData.currentPeriod.collectionRate < 80 ? '   - تطوير استراتيجيات التحصيل وتحفيز العملاء على السداد\n' : ''}
${analysisData.changes.commission < 0 ? '   - مراجعة نظام العمولات وتحفيز المندوبين\n' : ''}

6. الخلاصة:
   الأداء العام ${analysisData.changes.sales > 0 ? 'إيجابي مع نمو في المبيعات' : 'يحتاج إلى تحسين'} مقارنة بالفترة السابقة. 
   ${analysisData.currentPeriod.salesAchievement >= 90 ? 'تم تحقيق نسبة ممتازة من الأهداف.' : 
   analysisData.currentPeriod.salesAchievement >= 70 ? 'تم تحقيق نسبة جيدة من الأهداف.' : 
   'نسبة تحقيق الأهداف تحتاج إلى تحسين.'}
   ${analysisData.currentPeriod.collectionRate >= 90 ? 'نسبة التحصيل ممتازة.' : 
   analysisData.currentPeriod.collectionRate >= 70 ? 'نسبة التحصيل جيدة.' : 
   'نسبة التحصيل تحتاج إلى تحسين.'}
`;

      setAiAnalysis(analysisText);
      setShowAiAnalysisModal(true);
    } catch (err) {
      console.error('Error generating AI analysis:', err);
      toast.error('فشل في إنشاء التحليل');
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  const calculatePercentageChange = (previous: number, current: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getChangeColor = (change: number) => {
    return change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-500';
  };

  const getChangeIcon = (change: number) => {
    return change > 0 ? <ArrowUpRight className="w-4 h-4" /> : change < 0 ? <ArrowDownRight className="w-4 h-4" /> : null;
  };

  const getMonthsInRange = () => {
    const months: string[] = [];
    let currentDate = new Date(dateRange.startYear, dateRange.startMonth - 1);
    const endDate = new Date(dateRange.endYear, dateRange.endMonth - 1);
    
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      months.push(`${year}-${month.toString().padStart(2, '0')}`);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return months;
  };

  const getMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return `${t(`months.${parseInt(month) - 1}`)} ${year}`;
  };

  const chartData = useMemo(() => {
    if (!currentPeriodData) return null;
    
    const months = getMonthsInRange();
    
    return {
      labels: months.map(getMonthLabel),
      datasets: [
        {
          label: 'المبيعات',
          data: months.map(month => currentPeriodData.monthlySales[month] || 0),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          fill: false,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'التحصيل',
          data: months.map(month => currentPeriodData.monthlyCollection[month] || 0),
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.3,
          fill: false,
          pointBackgroundColor: 'rgb(168, 85, 247)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'الأهداف',
          data: months.map(month => currentPeriodData.monthlyTarget[month] || 0),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.3,
          fill: false,
          pointBackgroundColor: 'rgb(34, 197, 94)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'العمولات',
          data: months.map(month => currentPeriodData.monthlyCommission[month] || 0),
          borderColor: 'rgb(249, 115, 22)',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          tension: 0.3,
          fill: false,
          pointBackgroundColor: 'rgb(249, 115, 22)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
  }, [currentPeriodData, dateRange]);

  if (loading && !currentPeriodData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="analysis-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">المقارنة والتحليل</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm">تحديث</span>
          </button>
          <button
            onClick={handleExportImage}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">تصدير</span>
          </button>
          <button
            onClick={generateAIAnalysis}
            disabled={generatingAnalysis || !currentPeriodData || !previousPeriodData}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${generatingAnalysis ? 'animate-pulse' : ''}`} />
            <span className="text-sm">تحليل ذكي</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-xl font-semibold">الفترة الزمنية</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">من</label>
            <div className="grid grid-cols-2 gap-4">
              <select
                value={dateRange.startYear}
                onChange={(e) => handleDateRangeChange('startYear', parseInt(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 8 }, (_, i) => 2023 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                value={dateRange.startMonth}
                onChange={(e) => handleDateRangeChange('startMonth', parseInt(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{t(`months.${month - 1}`)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">إلى</label>
            <div className="grid grid-cols-2 gap-4">
              <select
                value={dateRange.endYear}
                onChange={(e) => handleDateRangeChange('endYear', parseInt(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 8 }, (_, i) => 2023 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                value={dateRange.endMonth}
                onChange={(e) => handleDateRangeChange('endMonth', parseInt(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{t(`months.${month - 1}`)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {currentPeriodData && (
        <>
          {/* KPI Ticker Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sales KPI */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-medium">المبيعات</h3>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {previousPeriodData && (
                      <>
                        <span className={getChangeColor(calculatePercentageChange(previousPeriodData.totalSales, currentPeriodData.totalSales))}>
                          {getChangeIcon(calculatePercentageChange(previousPeriodData.totalSales, currentPeriodData.totalSales))}
                        </span>
                        <span className={getChangeColor(calculatePercentageChange(previousPeriodData.totalSales, currentPeriodData.totalSales))}>
                          {calculatePercentageChange(previousPeriodData.totalSales, currentPeriodData.totalSales) > 0 ? '+' : ''}
                          {formatPercentage(calculatePercentageChange(previousPeriodData.totalSales, currentPeriodData.totalSales))}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <motion.div 
                  className="text-3xl font-bold text-blue-600 tabular-nums"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {formatNumber(currentPeriodData.totalSales)}
                </motion.div>
                {previousPeriodData && (
                  <div className="mt-2 text-sm text-gray-500">
                    الفترة السابقة: {formatNumber(previousPeriodData.totalSales)}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Collection KPI */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-purple-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Wallet className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-medium">التحصيل</h3>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {previousPeriodData && (
                      <>
                        <span className={getChangeColor(calculatePercentageChange(previousPeriodData.totalCollection, currentPeriodData.totalCollection))}>
                          {getChangeIcon(calculatePercentageChange(previousPeriodData.totalCollection, currentPeriodData.totalCollection))}
                        </span>
                        <span className={getChangeColor(calculatePercentageChange(previousPeriodData.totalCollection, currentPeriodData.totalCollection))}>
                          {calculatePercentageChange(previousPeriodData.totalCollection, currentPeriodData.totalCollection) > 0 ? '+' : ''}
                          {formatPercentage(calculatePercentageChange(previousPeriodData.totalCollection, currentPeriodData.totalCollection))}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <motion.div 
                  className="text-3xl font-bold text-purple-600 tabular-nums"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {formatNumber(currentPeriodData.totalCollection)}
                </motion.div>
                {previousPeriodData && (
                  <div className="mt-2 text-sm text-gray-500">
                    الفترة السابقة: {formatNumber(previousPeriodData.totalCollection)}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Target KPI */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-green-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Target className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-medium">الأهداف</h3>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {previousPeriodData && (
                      <>
                        <span className={getChangeColor(calculatePercentageChange(previousPeriodData.totalTarget, currentPeriodData.totalTarget))}>
                          {getChangeIcon(calculatePercentageChange(previousPeriodData.totalTarget, currentPeriodData.totalTarget))}
                        </span>
                        <span className={getChangeColor(calculatePercentageChange(previousPeriodData.totalTarget, currentPeriodData.totalTarget))}>
                          {calculatePercentageChange(previousPeriodData.totalTarget, currentPeriodData.totalTarget) > 0 ? '+' : ''}
                          {formatPercentage(calculatePercentageChange(previousPeriodData.totalTarget, currentPeriodData.totalTarget))}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <motion.div 
                  className="text-3xl font-bold text-green-600 tabular-nums"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  {formatNumber(currentPeriodData.totalTarget)}
                </motion.div>
                {previousPeriodData && (
                  <div className="mt-2 text-sm text-gray-500">
                    الفترة السابقة: {formatNumber(previousPeriodData.totalTarget)}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Commission KPI */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-orange-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Coins className="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 className="font-medium">العمولات</h3>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {previousPeriodData && (
                      <>
                        <span className={getChangeColor(calculatePercentageChange(previousPeriodData.totalCommission, currentPeriodData.totalCommission))}>
                          {getChangeIcon(calculatePercentageChange(previousPeriodData.totalCommission, currentPeriodData.totalCommission))}
                        </span>
                        <span className={getChangeColor(calculatePercentageChange(previousPeriodData.totalCommission, currentPeriodData.totalCommission))}>
                          {calculatePercentageChange(previousPeriodData.totalCommission, currentPeriodData.totalCommission) > 0 ? '+' : ''}
                          {formatPercentage(calculatePercentageChange(previousPeriodData.totalCommission, currentPeriodData.totalCommission))}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <motion.div 
                  className="text-3xl font-bold text-orange-600 tabular-nums"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  {formatNumber(currentPeriodData.totalCommission)}
                </motion.div>
                {previousPeriodData && (
                  <div className="mt-2 text-sm text-gray-500">
                    الفترة السابقة: {formatNumber(previousPeriodData.totalCommission)}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Line Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-medium mb-4">تطور المؤشرات الرئيسية</h3>
            <div className="h-[400px]">
              {chartData && (
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: 'index',
                      intersect: false,
                    },
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: {
                          usePointStyle: true,
                          padding: 20,
                          font: {
                            size: 12
                          }
                        }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#333',
                        bodyColor: '#666',
                        borderColor: '#ddd',
                        borderWidth: 1,
                        padding: 12,
                        boxPadding: 6,
                        usePointStyle: true,
                        callbacks: {
                          label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                              label += ': ';
                            }
                            if (context.parsed.y !== null) {
                              label += formatNumber(context.parsed.y);
                            }
                            return label;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45
                        }
                      },
                      y: {
                        beginAtZero: true,
                        grid: {
                          drawBorder: false
                        },
                        ticks: {
                          callback: function(value) {
                            return formatDisplayNumber(Number(value));
                          }
                        }
                      }
                    }
                  }}
                />
              )}
            </div>
          </motion.div>

          {/* Top Performers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Seller */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <span className="text-xl">🥇</span>
                </div>
                <h3 className="font-medium">أعلى مندوب مبيعات</h3>
              </div>
              
              {currentPeriodData.topSeller ? (
                <div className="mt-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {currentPeriodData.topSeller.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{currentPeriodData.topSeller.name}</div>
                      <div className="text-gray-600 tabular-nums">{formatNumber(currentPeriodData.topSeller.value)}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  لا توجد بيانات
                </div>
              )}
            </motion.div>

            {/* Top Category */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-100 rounded-full">
                  <span className="text-xl">🧾</span>
                </div>
                <h3 className="font-medium">أعلى صنف مبيعاً</h3>
              </div>
              
              {currentPeriodData.topCategory ? (
                <div className="mt-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {currentPeriodData.topCategory.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{currentPeriodData.topCategory.name}</div>
                      <div className="text-gray-600 tabular-nums">{formatNumber(currentPeriodData.topCategory.value)}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  لا توجد بيانات
                </div>
              )}
            </motion.div>

            {/* Lowest Performer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <span className="text-xl">🔻</span>
                </div>
                <h3 className="font-medium">أقل أداء مقارنة بالأهداف</h3>
              </div>
              
              {currentPeriodData.lowestPerformer ? (
                <div className="mt-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {currentPeriodData.lowestPerformer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{currentPeriodData.lowestPerformer.name}</div>
                      <div className="text-gray-600 tabular-nums">
                        {formatPercentage(currentPeriodData.lowestPerformer.achievement)} من الهدف
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  لا توجد بيانات
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}

      {/* AI Analysis Modal */}
      <AIAnalysisModal
        isOpen={showAiAnalysisModal}
        onClose={() => setShowAiAnalysisModal(false)}
        analysis={aiAnalysis}
      />
    </div>
  );
}