import { useState, useEffect } from 'react';
import { 
  PieChart,
  RefreshCw,
  Download,
  BarChart,
  LineChart,
  DollarSign,
  Target,
  Wallet,
  TrendingUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { formatNumber } from '../utils/numberUtils';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler
} from 'chart.js';
import { Pie, Bar, Line, Doughnut } from 'react-chartjs-2';
import html2canvas from 'html2canvas';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler
);

// Vibrant color palette with high contrast
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

interface SalesData {
  category: string;
  total_sales: number;
}

interface MonthlySalesData {
  month: number;
  month_name: string;
  sales: number;
}

interface MonthlyCollectionData {
  month: number;
  month_name: string;
  amount: number;
}

interface RepresentativeTargetData {
  representative_name: string;
  total_target: number;
}

interface CumulativeData {
  month: number;
  month_name: string;
  sales: number;
  collection: number;
}

export default function TestDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  // Data states
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<MonthlySalesData[]>([]);
  const [monthlyCollectionData, setMonthlyCollectionData] = useState<MonthlyCollectionData[]>([]);
  const [representativeTargetData, setRepresentativeTargetData] = useState<RepresentativeTargetData[]>([]);
  const [cumulativeData, setCumulativeData] = useState<CumulativeData[]>([]);
  
  // Summary data
  const [totalSales, setTotalSales] = useState(0);
  const [totalTarget, setTotalTarget] = useState(0);
  const [totalCollection, setTotalCollection] = useState(0);
  
  // Filters
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  // Arabic month names
  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  useEffect(() => {
    fetchAllData();
  }, [selectedYear, selectedMonth]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError('');

      await Promise.all([
        fetchSalesData(),
        fetchMonthlySalesData(),
        fetchMonthlyCollectionData(),
        fetchRepresentativeTargetData(),
        fetchSummaryData(),
        fetchCumulativeData()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('فشل في تحميل البيانات');
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSalesData = async () => {
    try {
      // Fetch sales data by category
      const { data, error } = await supabase
        .from('representative_data')
        .select(`
          category,
          sales
        `)
        .eq('year', selectedYear)
        .eq('month', selectedMonth);

      if (error) throw error;
      
      // Process data to aggregate by category
      const categoryTotals: Record<string, number> = {};
      data?.forEach(item => {
        if (!categoryTotals[item.category]) {
          categoryTotals[item.category] = 0;
        }
        categoryTotals[item.category] += item.sales;
      });
      
      // Convert to array format and sort by value
      const processedData = Object.entries(categoryTotals)
        .map(([category, total_sales]) => ({ category, total_sales }))
        .sort((a, b) => b.total_sales - a.total_sales);
      
      setSalesData(processedData);
      
      // Calculate total sales
      const totalSalesValue = processedData.reduce((sum, item) => sum + item.total_sales, 0);
      setTotalSales(totalSalesValue);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      throw err;
    }
  };

  const fetchMonthlySalesData = async () => {
    try {
      // Fetch monthly sales data
      const { data, error } = await supabase
        .from('representative_data')
        .select(`
          month,
          sales
        `)
        .eq('year', selectedYear);

      if (error) throw error;
      
      // Process data to aggregate by month
      const monthlyTotals: Record<number, number> = {};
      
      // Initialize all months
      for (let i = 1; i <= 12; i++) {
        monthlyTotals[i] = 0;
      }
      
      // Aggregate data
      data?.forEach(item => {
        monthlyTotals[item.month] += item.sales;
      });
      
      // Convert to array format
      const processedData = Object.entries(monthlyTotals)
        .map(([month, sales]) => ({
          month: parseInt(month),
          month_name: arabicMonths[parseInt(month) - 1],
          sales
        }))
        .sort((a, b) => a.month - b.month);
      
      setMonthlySalesData(processedData);
    } catch (err) {
      console.error('Error fetching monthly sales data:', err);
      throw err;
    }
  };

  const fetchMonthlyCollectionData = async () => {
    try {
      // Fetch monthly collection data
      const { data, error } = await supabase
        .from('collection_records')
        .select(`
          month,
          amount
        `)
        .eq('year', selectedYear);

      if (error) throw error;
      
      // Process data to aggregate by month
      const monthlyTotals: Record<number, number> = {};
      
      // Initialize all months
      for (let i = 1; i <= 12; i++) {
        monthlyTotals[i] = 0;
      }
      
      // Aggregate data
      data?.forEach(item => {
        monthlyTotals[item.month] += item.amount;
      });
      
      // Convert to array format
      const processedData = Object.entries(monthlyTotals)
        .map(([month, amount]) => ({
          month: parseInt(month),
          month_name: arabicMonths[parseInt(month) - 1],
          amount
        }))
        .sort((a, b) => a.month - b.month);
      
      setMonthlyCollectionData(processedData);
    } catch (err) {
      console.error('Error fetching monthly collection data:', err);
      throw err;
    }
  };

  const fetchRepresentativeTargetData = async () => {
    try {
      // Fetch representative target data
      const { data, error } = await supabase
        .from('representative_data')
        .select(`
          representative:representative_id(name),
          target
        `)
        .eq('year', selectedYear)
        .eq('month', selectedMonth);

      if (error) throw error;
      
      // Process data to aggregate by representative
      const repTargets: Record<string, number> = {};
      
      // Aggregate data
      data?.forEach(item => {
        const repName = item.representative.name;
        if (!repTargets[repName]) {
          repTargets[repName] = 0;
        }
        repTargets[repName] += item.target;
      });
      
      // Convert to array format and sort by value
      const processedData = Object.entries(repTargets)
        .map(([representative_name, total_target]) => ({ representative_name, total_target }))
        .sort((a, b) => b.total_target - a.total_target);
      
      setRepresentativeTargetData(processedData);
    } catch (err) {
      console.error('Error fetching representative target data:', err);
      throw err;
    }
  };

  const fetchSummaryData = async () => {
    try {
      // Fetch total target
      const { data: targetData, error: targetError } = await supabase
        .from('representative_data')
        .select('target')
        .eq('year', selectedYear)
        .eq('month', selectedMonth);

      if (targetError) throw targetError;
      
      const totalTargetValue = targetData?.reduce((sum, item) => sum + item.target, 0) || 0;
      setTotalTarget(totalTargetValue);
      
      // Fetch total collection
      const { data: collectionData, error: collectionError } = await supabase
        .from('collection_records')
        .select('amount')
        .eq('year', selectedYear)
        .eq('month', selectedMonth);

      if (collectionError) throw collectionError;
      
      const totalCollectionValue = collectionData?.reduce((sum, item) => sum + item.amount, 0) || 0;
      setTotalCollection(totalCollectionValue);
    } catch (err) {
      console.error('Error fetching summary data:', err);
      throw err;
    }
  };

  const fetchCumulativeData = async () => {
    try {
      // Fetch monthly sales data
      const { data: salesData, error: salesError } = await supabase
        .from('representative_data')
        .select(`
          month,
          sales
        `)
        .eq('year', selectedYear);

      if (salesError) throw salesError;
      
      // Fetch monthly collection data
      const { data: collectionData, error: collectionError } = await supabase
        .from('collection_records')
        .select(`
          month,
          amount
        `)
        .eq('year', selectedYear);

      if (collectionError) throw collectionError;
      
      // Process data to aggregate by month
      const monthlySales: Record<number, number> = {};
      const monthlyCollection: Record<number, number> = {};
      
      // Initialize all months
      for (let i = 1; i <= 12; i++) {
        monthlySales[i] = 0;
        monthlyCollection[i] = 0;
      }
      
      // Aggregate sales data
      salesData?.forEach(item => {
        monthlySales[item.month] += item.sales;
      });
      
      // Aggregate collection data
      collectionData?.forEach(item => {
        monthlyCollection[item.month] += item.amount;
      });
      
      // Convert to array format
      const processedData = Object.keys(monthlySales)
        .map(month => {
          const monthNum = parseInt(month);
          return {
            month: monthNum,
            month_name: arabicMonths[monthNum - 1],
            sales: monthlySales[monthNum],
            collection: monthlyCollection[monthNum]
          };
        })
        .sort((a, b) => a.month - b.month);
      
      setCumulativeData(processedData);
    } catch (err) {
      console.error('Error fetching cumulative data:', err);
      throw err;
    }
  };

  const handleRefresh = () => {
    fetchAllData();
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
      link.download = `dashboard-${selectedYear}-${selectedMonth}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('تم تصدير الصورة بنجاح');
    } catch (err) {
      console.error('Error exporting image:', err);
      toast.error('فشل في تصدير الصورة');
    }
  };

  // Prepare data for the charts
  const pieChartData = {
    labels: salesData.map(item => item.category),
    datasets: [
      {
        data: salesData.map(item => item.total_sales),
        backgroundColor: COLORS.slice(0, salesData.length),
        borderColor: 'white',
        borderWidth: 2,
      },
    ],
  };

  const barChartData = {
    labels: monthlySalesData.map(item => item.month_name),
    datasets: [
      {
        label: 'المبيعات',
        data: monthlySalesData.map(item => item.sales),
        backgroundColor: '#4361ee',
        borderColor: '#4361ee',
        borderWidth: 1,
      },
    ],
  };

  const lineChartData = {
    labels: monthlyCollectionData.map(item => item.month_name),
    datasets: [
      {
        label: 'التحصيل',
        data: monthlyCollectionData.map(item => item.amount),
        borderColor: '#f72585',
        backgroundColor: 'rgba(247, 37, 133, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      },
    ],
  };

  const doughnutChartData = {
    labels: representativeTargetData.map(item => item.representative_name),
    datasets: [
      {
        data: representativeTargetData.map(item => item.total_target),
        backgroundColor: COLORS.slice(0, representativeTargetData.length),
        borderColor: 'white',
        borderWidth: 2,
      },
    ],
  };

  // Prepare data for the stacked area chart
  const stackedAreaChartData = {
    labels: cumulativeData.map(item => item.month_name),
    datasets: [
      {
        label: 'المبيعات',
        data: cumulativeData.map(item => item.sales),
        backgroundColor: 'rgba(67, 97, 238, 0.6)',
        borderColor: '#4361ee',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      },
      {
        label: 'التحصيل',
        data: cumulativeData.map(item => item.collection),
        backgroundColor: 'rgba(247, 37, 133, 0.6)',
        borderColor: '#f72585',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }
    ]
  };

  if (loading && !salesData.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard 2</h1>
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
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              {arabicMonths.map((month, index) => (
                <option key={index + 1} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 flex items-center">
          <div className="p-3 bg-blue-100 rounded-full mr-4">
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm text-gray-500">إجمالي المبيعات</h3>
            <p className="text-2xl font-bold">{formatNumber(totalSales)}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-4 flex items-center">
          <div className="p-3 bg-green-100 rounded-full mr-4">
            <Target className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-sm text-gray-500">إجمالي الأهداف</h3>
            <p className="text-2xl font-bold">{formatNumber(totalTarget)}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-4 flex items-center">
          <div className="p-3 bg-purple-100 rounded-full mr-4">
            <Wallet className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm text-gray-500">إجمالي التحصيل</h3>
            <p className="text-2xl font-bold">{formatNumber(totalCollection)}</p>
          </div>
        </div>
      </div>

      {/* Dashboard Container */}
      <div id="dashboard-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Pie Chart - Sales Distribution by Category */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="text-xl font-bold mb-4 text-center">توزيع المبيعات حسب الصنف</h3>
          
          <div className="h-[300px] flex items-center justify-center">
            {salesData.length > 0 ? (
              <Pie 
                data={pieChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      rtl: true,
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
                          const percentage = ((value / totalSales) * 100).toFixed(1);
                          return `${label}: ${formatNumber(value)} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <PieChart className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500">لا توجد بيانات متاحة</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-lg font-semibold">إجمالي المبيعات: {formatNumber(totalSales)}</p>
          </div>
        </div>

        {/* Bar Chart - Monthly Sales */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="text-xl font-bold mb-4 text-center">المبيعات الشهرية</h3>
          
          <div className="h-[300px] flex items-center justify-center">
            {monthlySalesData.some(item => item.sales > 0) ? (
              <Bar 
                data={barChartData} 
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
                          const label = context.dataset.label || '';
                          const value = context.raw as number;
                          return `${label}: ${formatNumber(value)}`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: {
                        display: false
                      }
                    },
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
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <BarChart className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500">لا توجد بيانات متاحة</p>
              </div>
            )}
          </div>
        </div>

        {/* Doughnut Chart - Target Distribution by Representative */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="text-xl font-bold mb-4 text-center">توزيع الأهداف حسب المندوبين</h3>
          
          <div className="h-[300px] flex items-center justify-center">
            {representativeTargetData.length > 0 ? (
              <Doughnut 
                data={doughnutChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      rtl: true,
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
                          const total = representativeTargetData.reduce((sum, item) => sum + item.total_target, 0);
                          const percentage = ((value / total) * 100).toFixed(1);
                          return `${label}: ${formatNumber(value)} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Target className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500">لا توجد بيانات متاحة</p>
              </div>
            )}
          </div>
        </div>

        {/* Line Chart - Monthly Collection Growth */}
        <div className="md:col-span-2 lg:col-span-3 bg-white rounded-xl shadow-md p-4">
          <h3 className="text-xl font-bold mb-4 text-center">نمو التحصيل الشهري</h3>
          
          <div className="h-[300px] flex items-center justify-center">
            {monthlyCollectionData.some(item => item.amount > 0) ? (
              <Line 
                data={lineChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                      rtl: true,
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
                          const value = context.raw as number;
                          return `${label}: ${formatNumber(value)}`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: {
                        display: false
                      }
                    },
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
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <LineChart className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500">لا توجد بيانات متاحة</p>
              </div>
            )}
          </div>
        </div>

        {/* Stacked Area Chart - Cumulative Sales and Collection */}
        <div className="md:col-span-2 lg:col-span-3 bg-white rounded-xl shadow-md p-4">
          <h3 className="text-xl font-bold mb-4 text-center">تحليل المبيعات والتحصيل التراكمي</h3>
          
          <div className="h-[300px] flex items-center justify-center">
            {cumulativeData.some(item => item.sales > 0 || item.collection > 0) ? (
              <Line 
                data={stackedAreaChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                      rtl: true,
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
                          const value = context.raw as number;
                          return `${label}: ${formatNumber(value)}`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: {
                        display: false
                      }
                    },
                    y: {
                      stacked: true,
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
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <TrendingUp className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500">لا توجد بيانات متاحة</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}