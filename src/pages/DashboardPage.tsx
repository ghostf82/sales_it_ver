import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, 
  PieChart, 
  TrendingUp, 
  Calendar, 
  Download, 
  RefreshCw,
  Maximize,
  X,
  ChevronDown,
  ChevronUp,
  Filter,
  Target,
  Wallet,
  Coins,
  Users,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { formatNumber, formatPercentage } from '../utils/numberUtils';
import html2canvas from 'html2canvas';
import { MultiSelect } from '../components/MultiSelect';
import { GaugeChart } from '../components/GaugeChart';
import { CircularProgress } from '../components/CircularProgress';
import { PerformancePodium } from '../components/PerformancePodium';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Vibrant color palette
const COLORS = [
  '#4361ee', // Blue
  '#7209b7', // Purple
  '#f72585', // Pink
  '#4cc9f0', // Light Blue
  '#06d6a0', // Teal
  '#ffd166', // Yellow
  '#ef476f', // Red
  '#118ab2', // Dark Blue
  '#ff9e00', // Orange
  '#073b4c', // Dark Teal
  '#6a994e', // Green
  '#bc4749', // Burgundy
];

interface DashboardData {
  totalSales: number;
  totalTarget: number;
  totalCollection: number;
  monthlySales: { month: string; sales: number }[];
  monthlyCollection: { month: string; amount: number }[];
  categorySales: { category: string; sales: number }[];
  topPerformers: { name: string; sales: number; achievement: number }[];
}

interface EnlargedChartProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

interface FilterState {
  year: number;
  month: number;
  companies: string[];
  representatives: string[];
  categories: string[];
}

function EnlargedChart({ isOpen, onClose, title, children }: EnlargedChartProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-5xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-xl font-semibold">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<DashboardData>({
    totalSales: 0,
    totalTarget: 0,
    totalCollection: 0,
    monthlySales: [],
    monthlyCollection: [],
    categorySales: [],
    topPerformers: []
  });
  
  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    year: new Date().getFullYear(),
    month: 0, // 0 means all months
    companies: [],
    representatives: [],
    categories: []
  });
  
  // Filter options
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [representatives, setRepresentatives] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [enlargedChart, setEnlargedChart] = useState<{
    isOpen: boolean;
    title: string;
    content: React.ReactNode | null;
  }>({
    isOpen: false,
    title: '',
    content: null
  });
  
  // Section collapse state
  const [collapsedSections, setCollapsedSections] = useState({
    overview: false,
    performance: false,
    balancedPerformance: false,
    details: true
  });

  // Balanced performance data
  const [balancedPerformers, setBalancedPerformers] = useState<any[]>([]);

  useEffect(() => {
    fetchFilterOptions();
    fetchDashboardData();
    fetchBalancedPerformance();
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchBalancedPerformance();
  }, [filters]);

  const fetchFilterOptions = async () => {
    try {
      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      // Fetch representatives
      const { data: repsData, error: repsError } = await supabase
        .from('representatives')
        .select('id, name')
        .order('name');

      if (repsError) throw repsError;
      setRepresentatives(repsData || []);

      // Fetch categories
      const { data: catsData, error: catsError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (catsError) throw catsError;
      setCategories(catsData || []);
    } catch (err) {
      console.error('Error fetching filter options:', err);
      toast.error('فشل في تحميل خيارات التصفية');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError('');

      // Build query for sales data
      let query = supabase
        .from('representative_data')
        .select(`
          sales,
          target,
          category,
          representative:representative_id(id, name),
          company:company_id(id, name),
          month,
          year
        `);

      // Apply filters
      if (filters.year) {
        query = query.eq('year', filters.year);
      }
      
      if (filters.month > 0) {
        query = query.eq('month', filters.month);
      }
      
      if (filters.representatives.length > 0) {
        query = query.in('representative_id', filters.representatives);
      }
      
      if (filters.companies.length > 0) {
        query = query.in('company_id', filters.companies);
      }
      
      if (filters.categories.length > 0) {
        query = query.in('category', filters.categories);
      }

      const { data: salesData, error: salesError } = await query;
      if (salesError) throw salesError;

      // Build query for collection data
      let collectionQuery = supabase
        .from('collection_records')
        .select(`
          amount,
          representative:representative_id(id, name),
          company:company_id(id, name),
          month,
          year
        `);

      // Apply filters
      if (filters.year) {
        collectionQuery = collectionQuery.eq('year', filters.year);
      }
      
      if (filters.month > 0) {
        collectionQuery = collectionQuery.eq('month', filters.month);
      }
      
      if (filters.representatives.length > 0) {
        collectionQuery = collectionQuery.in('representative_id', filters.representatives);
      }
      
      if (filters.companies.length > 0) {
        collectionQuery = collectionQuery.in('company_id', filters.companies);
      }

      const { data: collectionData, error: collectionError } = await collectionQuery;
      if (collectionError) throw collectionError;

      // Process data
      const processedData = processDashboardData(salesData || [], collectionData || []);
      setData(processedData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('فشل في تحميل البيانات');
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBalancedPerformance = async () => {
    try {
      // Build query for representative data
      let query = supabase
        .from('representative_data')
        .select(`
          representative_id,
          representative:representative_id(name),
          sales,
          target,
          year,
          month
        `);

      // Apply filters
      if (filters.year) {
        query = query.eq('year', filters.year);
      }
      
      if (filters.month > 0) {
        query = query.eq('month', filters.month);
      }
      
      if (filters.representatives.length > 0) {
        query = query.in('representative_id', filters.representatives);
      }

      const { data: repData, error: repError } = await query;
      if (repError) throw repError;

      // Build query for collection data
      let collectionQuery = supabase
        .from('collection_records')
        .select(`
          representative_id,
          amount,
          year,
          month
        `);

      // Apply filters
      if (filters.year) {
        collectionQuery = collectionQuery.eq('year', filters.year);
      }
      
      if (filters.month > 0) {
        collectionQuery = collectionQuery.eq('month', filters.month);
      }
      
      if (filters.representatives.length > 0) {
        collectionQuery = collectionQuery.in('representative_id', filters.representatives);
      }

      const { data: collectionData, error: collectionError } = await collectionQuery;
      if (collectionError) throw collectionError;

      // Process data for balanced performance
      const repMap = new Map();
      
      // Aggregate sales and target by representative
      repData?.forEach(item => {
        const repId = item.representative_id;
        if (!repMap.has(repId)) {
          repMap.set(repId, {
            id: repId,
            name: item.representative.name,
            sales: 0,
            target: 0,
            collection: 0,
            percentage: 0
          });
        }
        
        const rep = repMap.get(repId);
        rep.sales += item.sales;
        rep.target += item.target;
      });
      
      // Aggregate collection by representative
      collectionData?.forEach(item => {
        const repId = item.representative_id;
        if (repMap.has(repId)) {
          const rep = repMap.get(repId);
          rep.collection += item.amount;
        }
      });
      
      // Calculate achievement percentage
      repMap.forEach(rep => {
        rep.percentage = rep.target > 0 ? (rep.sales / rep.target) * 100 : 0;
      });
      
      // Convert to array and sort by sales
      const performersArray = Array.from(repMap.values());
      setBalancedPerformers(performersArray);
    } catch (err) {
      console.error('Error fetching balanced performance data:', err);
    }
  };

  const processDashboardData = (salesData: any[], collectionData: any[]): DashboardData => {
    // Calculate totals
    const totalSales = salesData.reduce((sum, item) => sum + item.sales, 0);
    const totalTarget = salesData.reduce((sum, item) => sum + item.target, 0);
    const totalCollection = collectionData.reduce((sum, item) => sum + item.amount, 0);
    
    // Process monthly data
    const monthlySalesMap = new Map<number, number>();
    const monthlyCollectionMap = new Map<number, number>();
    
    // Initialize all months
    for (let i = 1; i <= 12; i++) {
      monthlySalesMap.set(i, 0);
      monthlyCollectionMap.set(i, 0);
    }
    
    // Aggregate sales by month
    salesData.forEach(item => {
      const month = item.month;
      monthlySalesMap.set(month, (monthlySalesMap.get(month) || 0) + item.sales);
    });
    
    // Aggregate collection by month
    collectionData.forEach(item => {
      const month = item.month;
      monthlyCollectionMap.set(month, (monthlyCollectionMap.get(month) || 0) + item.amount);
    });
    
    // Convert to array format
    const monthlySales = Array.from(monthlySalesMap.entries())
      .map(([month, sales]) => ({
        month: t(`months.${month - 1}`),
        sales
      }))
      .sort((a, b) => {
        const monthA = t('months').indexOf(a.month);
        const monthB = t('months').indexOf(b.month);
        return monthA - monthB;
      });
    
    const monthlyCollection = Array.from(monthlyCollectionMap.entries())
      .map(([month, amount]) => ({
        month: t(`months.${month - 1}`),
        amount
      }))
      .sort((a, b) => {
        const monthA = t('months').indexOf(a.month);
        const monthB = t('months').indexOf(b.month);
        return monthA - monthB;
      });
    
    // Process category sales
    const categorySalesMap = new Map<string, number>();
    
    salesData.forEach(item => {
      const category = item.category;
      categorySalesMap.set(category, (categorySalesMap.get(category) || 0) + item.sales);
    });
    
    const categorySales = Array.from(categorySalesMap.entries())
      .map(([category, sales]) => ({ category, sales }))
      .sort((a, b) => b.sales - a.sales);
    
    // Process top performers
    const performersMap = new Map<string, { name: string; sales: number; target: number }>();
    
    salesData.forEach(item => {
      const name = item.representative.name;
      
      if (!performersMap.has(name)) {
        performersMap.set(name, { name, sales: 0, target: 0 });
      }
      
      const performer = performersMap.get(name)!;
      performer.sales += item.sales;
      performer.target += item.target;
    });
    
    const topPerformers = Array.from(performersMap.values())
      .map(performer => ({
        name: performer.name,
        sales: performer.sales,
        achievement: performer.target > 0 ? (performer.sales / performer.target) * 100 : 0
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
    
    return {
      totalSales,
      totalTarget,
      totalCollection,
      monthlySales,
      monthlyCollection,
      categorySales,
      topPerformers
    };
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRefresh = () => {
    fetchDashboardData();
    fetchBalancedPerformance();
  };

  const handleExportImage = async () => {
    try {
      const element = document.getElementById('dashboard-container');
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = `dashboard-${filters.year}-${filters.month || 'all'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('تم تصدير الصورة بنجاح');
    } catch (err) {
      console.error('Error exporting image:', err);
      toast.error('فشل في تصدير الصورة');
    }
  };

  const handleEnlargeChart = (title: string, content: React.ReactNode) => {
    setEnlargedChart({
      isOpen: true,
      title,
      content
    });
  };

  const closeEnlargedChart = () => {
    setEnlargedChart({
      isOpen: false,
      title: '',
      content: null
    });
  };

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Calculate percentage change
  const calculatePercentageChange = (previous: number, current: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Get change color
  const getChangeColor = (change: number) => {
    return change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-500';
  };

  // Get change icon
  const getChangeIcon = (change: number) => {
    return change > 0 ? <ArrowUpRight className="w-4 h-4" /> : change < 0 ? <ArrowDownRight className="w-4 h-4" /> : null;
  };

  // Prepare chart data
  const monthlySalesChartData = {
    labels: data.monthlySales.map(item => item.month),
    datasets: [
      {
        label: 'المبيعات',
        data: data.monthlySales.map(item => item.sales),
        backgroundColor: 'rgba(67, 97, 238, 0.7)',
        borderColor: '#4361ee',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  const monthlyCollectionChartData = {
    labels: data.monthlyCollection.map(item => item.month),
    datasets: [
      {
        label: 'التحصيل',
        data: data.monthlyCollection.map(item => item.amount),
        backgroundColor: 'rgba(114, 9, 183, 0.7)',
        borderColor: '#7209b7',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  const categorySalesChartData = {
    labels: data.categorySales.map(item => item.category),
    datasets: [
      {
        data: data.categorySales.map(item => item.sales),
        backgroundColor: COLORS.slice(0, data.categorySales.length),
        borderColor: 'white',
        borderWidth: 2,
      }
    ]
  };

  const salesVsCollectionChartData = {
    labels: data.monthlySales.map(item => item.month),
    datasets: [
      {
        label: 'المبيعات',
        data: data.monthlySales.map(item => item.sales),
        borderColor: '#4361ee',
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'التحصيل',
        data: data.monthlyCollection.map(item => item.amount),
        borderColor: '#7209b7',
        backgroundColor: 'rgba(114, 9, 183, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  // Calculate achievement percentage
  const achievementPercentage = data.totalTarget > 0 ? (data.totalSales / data.totalTarget) * 100 : 0;
  
  // Calculate collection percentage
  const collectionPercentage = data.totalSales > 0 ? (data.totalCollection / data.totalSales) * 100 : 0;

  if (loading && !data.totalSales) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">لوحة التحكم</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">التصفية</span>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
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
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">السنة</label>
              <select
                value={filters.year}
                onChange={(e) => handleFilterChange('year', parseInt(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">الشهر</label>
              <select
                value={filters.month}
                onChange={(e) => handleFilterChange('month', parseInt(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={0}>كل الشهور</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{t(`months.${month - 1}`)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الشركات</label>
              <MultiSelect
                options={companies.map(company => ({
                  value: company.id,
                  label: company.name
                }))}
                value={filters.companies}
                onChange={(value) => handleFilterChange('companies', value)}
                placeholder="اختر الشركات..."
                showSelectAll
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">المناديب</label>
              <MultiSelect
                options={representatives.map(rep => ({
                  value: rep.id,
                  label: rep.name
                }))}
                value={filters.representatives}
                onChange={(value) => handleFilterChange('representatives', value)}
                placeholder="اختر المناديب..."
                showSelectAll
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الأصناف</label>
              <MultiSelect
                options={categories.map(category => ({
                  value: category.name,
                  label: category.name
                }))}
                value={filters.categories}
                onChange={(value) => handleFilterChange('categories', value)}
                placeholder="اختر الأصناف..."
                showSelectAll
              />
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <div id="dashboard-container" className="space-y-6">
        {/* Section 1: Overview & KPIs */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              نظرة عامة
            </h3>
            <button 
              onClick={() => toggleSection('overview')}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              {collapsedSections.overview ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          </div>
          
          {!collapsedSections.overview && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Total Sales Card */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="font-medium">إجمالي المبيعات</h3>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-blue-600 tabular-nums">
                    {formatNumber(data.totalSales)}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    الهدف: {formatNumber(data.totalTarget)}
                    {data.totalTarget > 0 && (
                      <span className="ml-2">
                        ({formatPercentage((data.totalSales / data.totalTarget) * 100)})
                      </span>
                    )}
                  </div>
                </div>

                {/* Total Collection Card */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Wallet className="w-5 h-5 text-purple-600" />
                      </div>
                      <h3 className="font-medium">إجمالي التحصيل</h3>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-purple-600 tabular-nums">
                    {formatNumber(data.totalCollection)}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    نسبة التحصيل: 
                    {data.totalSales > 0 && (
                      <span className="ml-2">
                        {formatPercentage((data.totalCollection / data.totalSales) * 100)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Top Performer Card */}
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Users className="w-5 h-5 text-yellow-600" />
                      </div>
                      <h3 className="font-medium">أفضل مندوب</h3>
                    </div>
                  </div>
                  {data.topPerformers.length > 0 ? (
                    <>
                      <div className="text-xl font-bold text-yellow-600">
                        {data.topPerformers[0].name}
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        المبيعات: {formatNumber(data.topPerformers[0].sales)}
                        <span className="ml-2">
                          ({formatPercentage(data.topPerformers[0].achievement)})
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500">لا توجد بيانات</div>
                  )}
                </div>
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Monthly Sales Chart */}
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">المبيعات الشهرية</h3>
                    <button 
                      onClick={() => handleEnlargeChart('المبيعات الشهرية', 
                        <div className="h-[60vh]">
                          <Bar 
                            data={monthlySalesChartData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  display: false
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      return `المبيعات: ${formatNumber(context.parsed.y)}`;
                                    }
                                  }
                                }
                              },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  ticks: {
                                    callback: function(value) {
                                      return formatNumber(value as number);
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      )}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      title="تكبير"
                    >
                      <Maximize className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  <div className="h-[300px]">
                    <Bar 
                      data={monthlySalesChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                return `المبيعات: ${formatNumber(context.parsed.y)}`;
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: function(value) {
                                return formatNumber(value as number);
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Monthly Collection Chart */}
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">التحصيل الشهري</h3>
                    <button 
                      onClick={() => handleEnlargeChart('التحصيل الشهري', 
                        <div className="h-[60vh]">
                          <Bar 
                            data={monthlyCollectionChartData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  display: false
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      return `التحصيل: ${formatNumber(context.parsed.y)}`;
                                    }
                                  }
                                }
                              },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  ticks: {
                                    callback: function(value) {
                                      return formatNumber(value as number);
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      )}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      title="تكبير"
                    >
                      <Maximize className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  <div className="h-[300px]">
                    <Bar 
                      data={monthlyCollectionChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                return `التحصيل: ${formatNumber(context.parsed.y)}`;
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: function(value) {
                                return formatNumber(value as number);
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category Sales Chart */}
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">توزيع المبيعات حسب الصنف</h3>
                    <button 
                      onClick={() => handleEnlargeChart('توزيع المبيعات حسب الصنف', 
                        <div className="h-[60vh] flex items-center justify-center">
                          <div className="w-[80%] max-w-xl">
                            <Pie 
                              data={categorySalesChartData}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: 'right',
                                    labels: {
                                      usePointStyle: true,
                                      padding: 20,
                                      font: {
                                        size: 14
                                      }
                                    }
                                  },
                                  tooltip: {
                                    callbacks: {
                                      label: function(context) {
                                        const label = context.label || '';
                                        const value = context.raw as number;
                                        const percentage = ((value / data.totalSales) * 100).toFixed(1);
                                        return `${label}: ${formatNumber(value)} (${percentage}%)`;
                                      }
                                    }
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      title="تكبير"
                    >
                      <Maximize className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  <div className="h-[300px] flex items-center justify-center">
                    {data.categorySales.length > 0 ? (
                      <div className="w-[80%]">
                        <Pie 
                          data={categorySalesChartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'right',
                                labels: {
                                  usePointStyle: true,
                                  padding: 20,
                                  font: {
                                    size: 12
                                  }
                                }
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw as number;
                                    const percentage = ((value / data.totalSales) * 100).toFixed(1);
                                    return `${label}: ${formatNumber(value)} (${percentage}%)`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <PieChart className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500">لا توجد بيانات متاحة</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sales vs Collection Chart */}
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">المبيعات مقابل التحصيل</h3>
                    <button 
                      onClick={() => handleEnlargeChart('المبيعات مقابل التحصيل', 
                        <div className="h-[60vh]">
                          <Line 
                            data={salesVsCollectionChartData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'top',
                                  labels: {
                                    usePointStyle: true,
                                    padding: 20,
                                    font: {
                                      size: 14
                                    }
                                  }
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      const label = context.dataset.label || '';
                                      const value = context.parsed.y;
                                      return `${label}: ${formatNumber(value)}`;
                                    }
                                  }
                                }
                              },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  ticks: {
                                    callback: function(value) {
                                      return formatNumber(value as number);
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      )}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      title="تكبير"
                    >
                      <Maximize className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  <div className="h-[300px]">
                    <Line 
                      data={salesVsCollectionChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
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
                            callbacks: {
                              label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${formatNumber(value)}`;
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: function(value) {
                                return formatNumber(value as number);
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Section 2: Performance Indicators */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              مؤشرات الأداء
            </h3>
            <button 
              onClick={() => toggleSection('performance')}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              {collapsedSections.performance ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          </div>
          
          {!collapsedSections.performance && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Achievement Percentage */}
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">نسبة تحقيق الأهداف</h3>
                  <button 
                    onClick={() => handleEnlargeChart('نسبة تحقيق الأهداف', 
                      <div className="h-[60vh] flex items-center justify-center">
                        <div className="w-[80%] max-w-xl">
                          <GaugeChart
                            currentValue={data.totalSales}
                            targetValue={data.totalTarget}
                            title=""
                            showAnimation={true}
                            height={500}
                            width={500}
                          />
                        </div>
                      </div>
                    )}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    title="تكبير"
                  >
                    <Maximize className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="flex items-center justify-center">
                  <GaugeChart
                    currentValue={data.totalSales}
                    targetValue={data.totalTarget}
                    title=""
                    showAnimation={true}
                    height={300}
                    width={400}
                  />
                </div>
                <div className="text-center mt-4">
                  <p className="text-xl font-bold">
                    نسبة تحقيق الأهداف: {formatPercentage(achievementPercentage)}
                  </p>
                </div>
              </div>

              {/* Collection Percentage */}
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">نسبة التحصيل من المبيعات</h3>
                  <button 
                    onClick={() => handleEnlargeChart('نسبة التحصيل من المبيعات', 
                      <div className="h-[60vh] flex items-center justify-center">
                        <div className="w-[80%] max-w-xl">
                          <CircularProgress
                            data={[
                              { label: 'التحصيل', value: data.totalCollection, color: '#7209b7' },
                              { label: 'المبيعات', value: data.totalSales - data.totalCollection, color: '#e5e7eb' }
                            ]}
                            totalLabel="إجمالي المبيعات"
                            totalValue={data.totalSales}
                            size={400}
                          />
                        </div>
                      </div>
                    )}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    title="تكبير"
                  >
                    <Maximize className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="flex items-center justify-center">
                  <CircularProgress
                    data={[
                      { label: 'التحصيل', value: data.totalCollection, color: '#7209b7' },
                      { label: 'المبيعات', value: data.totalSales - data.totalCollection, color: '#e5e7eb' }
                    ]}
                    totalLabel="إجمالي المبيعات"
                    totalValue={data.totalSales}
                    size={300}
                  />
                </div>
                <div className="text-center mt-4">
                  <p className="text-xl font-bold">
                    نسبة التحصيل: {formatPercentage(collectionPercentage)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Balanced Performance */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Coins className="w-5 h-5 text-blue-600" />
              الأداء المتوازن
            </h3>
            <button 
              onClick={() => toggleSection('balancedPerformance')}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              {collapsedSections.balancedPerformance ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          </div>
          
          {!collapsedSections.balancedPerformance && (
            <div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">منصة الأداء المتوازن</h3>
                  <button 
                    onClick={() => handleEnlargeChart('منصة الأداء المتوازن', 
                      <div className="h-[60vh] flex items-center justify-center">
                        <div className="w-full">
                          <PerformancePodium 
                            performers={balancedPerformers.map(rep => ({
                              id: rep.id,
                              name: rep.name,
                              value: rep.sales,
                              percentage: rep.percentage
                            }))}
                            title=""
                            valueLabel="المبيعات"
                          />
                        </div>
                      </div>
                    )}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    title="تكبير"
                  >
                    <Maximize className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <PerformancePodium 
                  performers={balancedPerformers.map(rep => ({
                    id: rep.id,
                    name: rep.name,
                    value: rep.sales,
                    percentage: rep.percentage
                  }))}
                  title=""
                  valueLabel="المبيعات"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Top Performers */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              تفاصيل أداء المندوبين
            </h3>
            <button 
              onClick={() => toggleSection('details')}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              {collapsedSections.details ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          </div>
          
          {!collapsedSections.details && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">المندوب</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">المبيعات</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">الهدف</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">نسبة تحقيق الهدف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.topPerformers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        لا توجد بيانات متاحة
                      </td>
                    </tr>
                  ) : (
                    data.topPerformers.map((performer, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <span className="font-bold text-blue-600">{index + 1}</span>
                            </div>
                            {performer.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm tabular-nums">
                          {formatNumber(performer.sales)}
                        </td>
                        <td className="px-6 py-4 text-sm tabular-nums">
                          {formatNumber(performer.sales / (performer.achievement / 100))}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center">
                            <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  performer.achievement >= 100 ? 'bg-green-600' :
                                  performer.achievement >= 80 ? 'bg-blue-600' :
                                  performer.achievement >= 60 ? 'bg-yellow-500' : 'bg-red-600'
                                }`}
                                style={{ width: `${Math.min(performer.achievement, 100)}%` }}
                              ></div>
                            </div>
                            <span>{formatPercentage(performer.achievement)}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Enlarged Chart Modal */}
      <EnlargedChart
        isOpen={enlargedChart.isOpen}
        onClose={closeEnlargedChart}
        title={enlargedChart.title}
      >
        {enlargedChart.content}
      </EnlargedChart>
    </div>
  );
}