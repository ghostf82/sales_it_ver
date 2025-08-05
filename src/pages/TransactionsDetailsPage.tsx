import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  FileText,
  ArrowUpDown,
  Info,
  CheckSquare,
  Square
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import { calculateCommission } from '../utils/commission';
import { groupCollectionsByRepMonth } from '../utils/collection';
import { formatNumber, formatPercentage } from '../utils/numberUtils';
import { MultiSelect } from '../components/MultiSelect';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface Transaction {
  id: string;
  representative_id: string;
  representative_name: string;
  company_id: string;
  company_name: string;
  category: string;
  transaction_date: string;
  sales: number;
  target: number;
  achievement_percentage: number;
  total_commission: number;
  commission_breakdown?: {
    tier1_commission: number;
    tier2_commission: number;
    tier3_commission: number;
  };
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

interface FilterState {
  representatives: string[];
  companies: string[];
  categories: string[];
  dateRange: {
    startYear: number;
    startMonth: number;
    endYear: number;
    endMonth: number;
  };
  searchTerm: string;
}

export function TransactionsDetailsPage() {
  const { t } = useTranslation();
  const { isAdmin, isSuperAdmin } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);
  
  // Filter options
  const [representatives, setRepresentatives] = useState<{ id: string; name: string }[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  
  // UI state
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'asc' | 'desc' }>({
    key: 'transaction_date',
    direction: 'desc'
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState<FilterState>({
    representatives: [],
    companies: [],
    categories: [],
    dateRange: {
      startYear: new Date().getFullYear(),
      startMonth: 1,
      endYear: new Date().getFullYear(),
      endMonth: new Date().getMonth() + 1
    },
    searchTerm: ''
  });

  useEffect(() => {
    fetchFilterOptions();
    fetchCommissionRules();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    // When selectAll changes, update selectedTransactions
    if (selectAll) {
      setSelectedTransactions(sortedTransactions.map(t => t.id));
    } else {
      setSelectedTransactions([]);
    }
  }, [selectAll]);

  const fetchFilterOptions = async () => {
    try {
      // Fetch representatives
      const { data: repsData, error: repsError } = await supabase
        .from('representatives')
        .select('id, name')
        .order('name');

      if (repsError) throw repsError;
      setRepresentatives(repsData || []);

      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);
    } catch (err) {
      console.error('Error fetching filter options:', err);
      toast.error('فشل في تحميل خيارات التصفية');
    }
  };

  const fetchCommissionRules = async () => {
    try {
      const { data, error } = await supabase
        .from('commission_rules')
        .select('*');

      if (error) throw error;
      setCommissionRules(data || []);
    } catch (err) {
      console.error('Error fetching commission rules:', err);
      setError('فشل في تحميل قواعد العمولات');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError('');

      // Build query for representative data
      let query = supabase
        .from('representative_data')
        .select(`
          id,
          representative_id,
          representative:representative_id(id, name),
          company_id,
          company:company_id(id, name),
          category,
          sales,
          target,
          year,
          month,
          created_at
        `);

      // Apply date range filter
      const { startYear, startMonth, endYear, endMonth } = filters.dateRange;
      
      query = query.or(
        `and(year.gt.${startYear-1},year.lt.${endYear+1})` // Get all years in range
      ).or(
        `and(year.eq.${startYear},month.gte.${startMonth})`,
        `and(year.eq.${endYear},month.lte.${endMonth})`
      );

      // Apply other filters
      if (filters.representatives.length > 0) {
        query = query.in('representative_id', filters.representatives);
      }
      
      if (filters.companies.length > 0) {
        query = query.in('company_id', filters.companies);
      }
      
      if (filters.categories.length > 0) {
        query = query.in('category', filters.categories);
      }

      // Order by date (newest first)
      query = query.order('year', { ascending: false })
        .order('month', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Process data to calculate achievement percentage and commission
      const processedData: Transaction[] = (data || []).map(item => {
        const achievementPercentage = item.target > 0 ? (item.sales / item.target) * 100 : 0;
        
        // Find commission rule for this category
        const rule = commissionRules.find(r => r.category === item.category);
        
        // Calculate commission
        let totalCommission = 0;
        let commissionBreakdown = undefined;
        
        if (rule) {
          const result = calculateCommission({
            sales: item.sales,
            goal: item.target,
            achievement_percent: achievementPercentage,
            tier1_rate: rule.tier1_rate,
            tier2_rate: rule.tier2_rate,
            tier3_rate: rule.tier3_rate
          });
          
          totalCommission = result.total_commission;
          commissionBreakdown = {
            tier1_commission: result.tier1_commission,
            tier2_commission: result.tier2_commission,
            tier3_commission: result.tier3_commission
          };
        }
        
        return {
          id: item.id,
          representative_id: item.representative_id,
          representative_name: item.representative.name,
          company_id: item.company_id,
          company_name: item.company.name,
          category: item.category,
          transaction_date: `${item.year}-${item.month.toString().padStart(2, '0')}`,
          sales: item.sales,
          target: item.target,
          achievement_percentage: achievementPercentage,
          total_commission: totalCommission,
          commission_breakdown: commissionBreakdown,
          year: item.year,
          month: item.month
        };
      });

      setTransactions(processedData);
      setSelectAll(false);
      setSelectedTransactions([]);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('فشل في تحميل بيانات العمليات');
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      
      // Prepare data for export
      const exportData = filteredTransactions.map(transaction => ({
        'المندوب': transaction.representative_name,
        'الشركة': transaction.company_name,
        'الصنف': transaction.category,
        'التاريخ': transaction.transaction_date,
        'المبيعات': transaction.sales,
        'الهدف': transaction.target,
        'نسبة التحقيق': `${transaction.achievement_percentage.toFixed(1)}%`,
        'إجمالي العمولة': transaction.total_commission,
        'عمولة الشريحة 1': transaction.commission_breakdown?.tier1_commission || 0,
        'عمولة الشريحة 2': transaction.commission_breakdown?.tier2_commission || 0,
        'عمولة الشريحة 3': transaction.commission_breakdown?.tier3_commission || 0
      }));
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const colWidths = [
        { wch: 20 }, // المندوب
        { wch: 20 }, // الشركة
        { wch: 15 }, // الصنف
        { wch: 12 }, // التاريخ
        { wch: 15 }, // المبيعات
        { wch: 15 }, // الهدف
        { wch: 12 }, // نسبة التحقيق
        { wch: 15 }, // إجمالي العمولة
        { wch: 15 }, // عمولة الشريحة 1
        { wch: 15 }, // عمولة الشريحة 2
        { wch: 15 }, // عمولة الشريحة 3
      ];
      ws['!cols'] = colWidths;
      
      // Add to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'تفاصيل العمليات');
      
      // Export
      XLSX.writeFile(wb, `تفاصيل_العمليات_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('تم تصدير البيانات بنجاح');
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      toast.error('فشل في تصدير البيانات');
    }
  };

  const handleToggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSort = (key: keyof Transaction) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    
    setSortConfig({ key, direction });
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (!isSuperAdmin) {
      toast.error('فقط المشرف العام يمكنه حذف العمليات');
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('representative_data')
        .delete()
        .eq('id', transaction.id);
      
      if (error) throw error;
      
      setTransactions(transactions.filter(t => t.id !== transaction.id));
      toast.success('تم حذف العملية بنجاح');
    } catch (err) {
      console.error('Error deleting transaction:', err);
      toast.error('فشل في حذف العملية');
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
      setTransactionToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!isSuperAdmin) {
      toast.error('فقط المشرف العام يمكنه حذف العمليات');
      return;
    }
    
    if (selectedTransactions.length === 0) {
      toast.error('لم يتم تحديد أي عمليات للحذف');
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('representative_data')
        .delete()
        .in('id', selectedTransactions);
      
      if (error) throw error;
      
      setTransactions(transactions.filter(t => !selectedTransactions.includes(t.id)));
      setSelectedTransactions([]);
      setSelectAll(false);
      toast.success(`تم حذف ${selectedTransactions.length} عملية بنجاح`);
    } catch (err) {
      console.error('Error deleting transactions:', err);
      toast.error('فشل في حذف العمليات');
    } finally {
      setLoading(false);
      setBulkDeleteConfirmOpen(false);
    }
  };

  const handleToggleSelectTransaction = (id: string) => {
    setSelectedTransactions(prev => {
      if (prev.includes(id)) {
        return prev.filter(transactionId => transactionId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleToggleSelectAll = () => {
    setSelectAll(!selectAll);
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDateRangeChange = (field: keyof FilterState['dateRange'], value: number) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };

  const applyFilters = () => {
    fetchData();
  };

  const resetFilters = () => {
    setFilters({
      representatives: [],
      companies: [],
      categories: [],
      dateRange: {
        startYear: new Date().getFullYear(),
        startMonth: 1,
        endYear: new Date().getFullYear(),
        endMonth: new Date().getMonth() + 1
      },
      searchTerm: ''
    });
  };

  // Apply client-side search filter
  const filteredTransactions = useMemo(() => {
    if (!filters.searchTerm) return transactions;
    
    const searchTerm = filters.searchTerm.toLowerCase();
    return transactions.filter(transaction => 
      transaction.representative_name.toLowerCase().includes(searchTerm) ||
      transaction.company_name.toLowerCase().includes(searchTerm) ||
      transaction.category.toLowerCase().includes(searchTerm)
    );
  }, [transactions, filters.searchTerm]);

  // Apply sorting
  const sortedTransactions = useMemo(() => {
    const { key, direction } = sortConfig;
    return [...filteredTransactions].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTransactions, sortConfig]);

  // Get achievement status color
  const getAchievementColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-100 text-green-800';
    if (percentage >= 80) return 'bg-blue-100 text-blue-800';
    if (percentage >= 60) return 'bg-purple-100 text-purple-800';
    if (percentage >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading && !transactions.length) {
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
        <h2 className="text-3xl font-bold">تفاصيل العمليات</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">التصفية</span>
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
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm">تصدير Excel</span>
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
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium">تصفية البيانات</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">من</label>
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={filters.dateRange.startYear}
                  onChange={(e) => handleDateRangeChange('startYear', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 8 }, (_, i) => 2023 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <select
                  value={filters.dateRange.startMonth}
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
                  value={filters.dateRange.endYear}
                  onChange={(e) => handleDateRangeChange('endYear', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 8 }, (_, i) => 2023 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <select
                  value={filters.dateRange.endMonth}
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <MultiSelect
              label="المناديب"
              options={representatives.map(rep => ({
                value: rep.id,
                label: rep.name
              }))}
              value={filters.representatives}
              onChange={(value) => handleFilterChange('representatives', value)}
              placeholder="اختر المناديب..."
              showSelectAll
            />
            
            <MultiSelect
              label="الشركات"
              options={companies.map(company => ({
                value: company.id,
                label: company.name
              }))}
              value={filters.companies}
              onChange={(value) => handleFilterChange('companies', value)}
              placeholder="اختر الشركات..."
              showSelectAll
            />
            
            <MultiSelect
              label="الأصناف"
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
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">بحث</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                placeholder="ابحث عن مندوب، شركة، أو صنف..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-4">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              إعادة تعيين
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              تطبيق
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {isSuperAdmin && selectedTransactions.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between">
          <div className="text-blue-700">
            تم تحديد {selectedTransactions.length} عملية
          </div>
          <button
            onClick={() => setBulkDeleteConfirmOpen(true)}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            حذف المحدد
          </button>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {isSuperAdmin && (
                  <th className="px-4 py-3 text-center">
                    <button
                      onClick={handleToggleSelectAll}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      {selectAll ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                )}
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">
                  <button 
                    className="flex items-center gap-1"
                    onClick={() => handleSort('representative_name')}
                  >
                    المندوب
                    {sortConfig.key === 'representative_name' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">
                  <button 
                    className="flex items-center gap-1"
                    onClick={() => handleSort('company_name')}
                  >
                    الشركة
                    {sortConfig.key === 'company_name' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">
                  <button 
                    className="flex items-center gap-1"
                    onClick={() => handleSort('category')}
                  >
                    الصنف
                    {sortConfig.key === 'category' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">
                  <button 
                    className="flex items-center gap-1"
                    onClick={() => handleSort('transaction_date')}
                  >
                    التاريخ
                    {sortConfig.key === 'transaction_date' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">
                  <button 
                    className="flex items-center gap-1"
                    onClick={() => handleSort('sales')}
                  >
                    المبيعات
                    {sortConfig.key === 'sales' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">
                  <button 
                    className="flex items-center gap-1"
                    onClick={() => handleSort('target')}
                  >
                    الهدف
                    {sortConfig.key === 'target' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">
                  <button 
                    className="flex items-center gap-1"
                    onClick={() => handleSort('achievement_percentage')}
                  >
                    نسبة التحقيق
                    {sortConfig.key === 'achievement_percentage' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">
                  <button 
                    className="flex items-center gap-1"
                    onClick={() => handleSort('total_commission')}
                  >
                    إجمالي العمولة
                    {sortConfig.key === 'total_commission' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">
                  التفاصيل
                </th>
                {isSuperAdmin && (
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">
                    الإجراءات
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 11 : 9} className="px-6 py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Info className="w-12 h-12 text-gray-300 mb-2" />
                      <p className="text-lg font-medium">لا توجد بيانات متاحة</p>
                      <p className="text-sm text-gray-400">جرب تغيير معايير التصفية أو إضافة بيانات جديدة</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedTransactions.map(transaction => (
                  <>
                    <tr 
                      key={transaction.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleToggleRow(transaction.id)}
                    >
                      {isSuperAdmin && (
                        <td className="px-4 py-4 text-center\" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleToggleSelectTransaction(transaction.id)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            {selectedTransactions.includes(transaction.id) ? (
                              <CheckSquare className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm">{transaction.representative_name}</td>
                      <td className="px-6 py-4 text-sm">{transaction.company_name}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {transaction.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {t(`months.${transaction.month - 1}`)} {transaction.year}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium tabular-nums">
                        {formatNumber(transaction.sales)}
                      </td>
                      <td className="px-6 py-4 text-sm tabular-nums">
                        {formatNumber(transaction.target)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAchievementColor(transaction.achievement_percentage)}`}>
                          {formatPercentage(transaction.achievement_percentage)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium tabular-nums text-green-600">
                        {formatNumber(transaction.total_commission)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRow(transaction.id);
                          }}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          {expandedRows[transaction.id] ? (
                            <EyeOff className="w-5 h-5 text-gray-500" />
                          ) : (
                            <Eye className="w-5 h-5 text-blue-600" />
                          )}
                        </button>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle edit (not implemented in this example)
                                toast.info('وظيفة التعديل قيد التطوير');
                              }}
                              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTransactionToDelete(transaction);
                                setDeleteConfirmOpen(true);
                              }}
                              className="p-1 text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                    {expandedRows[transaction.id] && transaction.commission_breakdown && (
                      <tr className="bg-gray-50">
                        <td colSpan={isSuperAdmin ? 11 : 9} className="px-6 py-4">
                          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                            <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                              <Info className="w-5 h-5 text-blue-600" />
                              تفاصيل شرائح العمولة
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Tier 1 */}
                              <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                  <h5 className="font-medium">الشريحة الأولى</h5>
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    70% من الهدف
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 text-sm">المبلغ الخاضع:</span>
                                    <span className="font-medium tabular-nums">
                                      {formatNumber(transaction.target * 0.7)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 text-sm">نسبة العمولة:</span>
                                    <span className="font-medium">
                                      {(commissionRules.find(r => r.category === transaction.category)?.tier1_rate || 0) * 100}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between border-t border-blue-100 pt-2 mt-2">
                                    <span className="text-gray-800 font-medium">العمولة:</span>
                                    <span className="font-bold text-blue-700 tabular-nums">
                                      {formatNumber(transaction.commission_breakdown.tier1_commission)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Tier 2 */}
                              <div className="bg-purple-50 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                  <h5 className="font-medium">الشريحة الثانية</h5>
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                    30% من الهدف
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 text-sm">المبلغ الخاضع:</span>
                                    <span className="font-medium tabular-nums">
                                      {formatNumber(transaction.target * 0.3)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 text-sm">نسبة العمولة:</span>
                                    <span className="font-medium">
                                      {(commissionRules.find(r => r.category === transaction.category)?.tier2_rate || 0) * 100}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between border-t border-purple-100 pt-2 mt-2">
                                    <span className="text-gray-800 font-medium">العمولة:</span>
                                    <span className="font-bold text-purple-700 tabular-nums">
                                      {formatNumber(transaction.commission_breakdown.tier2_commission)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Tier 3 */}
                              <div className="bg-green-50 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                  <h5 className="font-medium">الشريحة الثالثة</h5>
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                    ما يزيد عن الهدف
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 text-sm">المبلغ الخاضع:</span>
                                    <span className="font-medium tabular-nums">
                                      {formatNumber(Math.max(0, transaction.sales - transaction.target))}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 text-sm">نسبة العمولة:</span>
                                    <span className="font-medium">
                                      {(commissionRules.find(r => r.category === transaction.category)?.tier3_rate || 0) * 100}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between border-t border-green-100 pt-2 mt-2">
                                    <span className="text-gray-800 font-medium">العمولة:</span>
                                    <span className="font-bold text-green-700 tabular-nums">
                                      {formatNumber(transaction.commission_breakdown.tier3_commission)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-lg">إجمالي العمولة:</span>
                                <span className="font-bold text-xl text-green-600 tabular-nums">
                                  {formatNumber(transaction.total_commission)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              إجمالي السجلات: {sortedTransactions.length}
            </div>
            {isSuperAdmin && selectedTransactions.length > 0 && (
              <button
                onClick={() => setBulkDeleteConfirmOpen(true)}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                حذف المحدد ({selectedTransactions.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setTransactionToDelete(null);
        }}
        onConfirm={() => {
          if (transactionToDelete) {
            handleDeleteTransaction(transactionToDelete);
          }
        }}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف هذه العملية؟ لا يمكن التراجع عن هذا الإجراء.`}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={bulkDeleteConfirmOpen}
        onClose={() => setBulkDeleteConfirmOpen(false)}
        onConfirm={handleBulkDelete}
        title="تأكيد حذف العمليات المحددة"
        message={`هل أنت متأكد من حذف ${selectedTransactions.length} عملية؟ لا يمكن التراجع عن هذا الإجراء.`}
      />
    </div>
  );
}