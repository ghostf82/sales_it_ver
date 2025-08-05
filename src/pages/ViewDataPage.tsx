import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, FileText, Download, Printer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { MultiSelect } from '../components/MultiSelect';
import toast from 'react-hot-toast';
import { calculateCommission } from '../utils/commission';
import { groupCollectionsByRepMonth } from '../utils/collection';
import { formatNumber, formatPercentage } from '../utils/numberUtils';

interface DataEntry {
  id: string;
  company: { id: string; name: string };
  representative: { id: string; name: string };
  category: string;
  sales: number;
  target: number;
  collection?: number;
  year: number;
  month: number;
}

interface FilterState {
  companies: string[];
  representatives: string[];
  categories: string[];
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
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

export function ViewDataPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<DataEntry[]>([]);
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);
  const [showCommissionTiers, setShowCommissionTiers] = useState(false);

  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [representatives, setRepresentatives] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const [filters, setFilters] = useState<FilterState>({
    companies: [],
    representatives: [],
    categories: [],
    startYear: new Date().getFullYear(),
    startMonth: 1,
    endYear: new Date().getFullYear(),
    endMonth: new Date().getMonth() + 1,
  });

  useEffect(() => {
    fetchFilters();
    fetchCommissionRules();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchFilters = async () => {
    try {
      const { data: companiesData } = await supabase.from('companies').select('id, name').order('name');
      setCompanies(companiesData || []);

      const { data: repsData } = await supabase.from('representatives').select('id, name').order('name');
      setRepresentatives(repsData || []);

      const { data: catsData } = await supabase.from('categories').select('id, name').order('name');
      setCategories(catsData || []);
    } catch (err) {
      console.error('Error fetching filters:', err);
      toast.error('فشل في تحميل خيارات التصفية');
    }
  };

  const fetchCommissionRules = async () => {
    try {
      const { data, error } = await supabase.from('commission_rules').select('*').order('category');
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
      setError('');

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
        `and(year.gt.${filters.startYear},year.lt.${filters.endYear}),` +
        `and(year.eq.${filters.startYear},month.gte.${filters.startMonth}),` +
        `and(year.eq.${filters.endYear},month.lte.${filters.endMonth})`
      );

      // Apply other filters
      if (filters.companies.length > 0) {
        query = query.in('company_id', filters.companies);
      }
      if (filters.representatives.length > 0) {
        query = query.in('representative_id', filters.representatives);
      }
      if (filters.categories.length > 0) {
        query = query.in('category', filters.categories);
      }

      // Get representative data
      const { data: repData, error: repError } = await query;
      if (repError) throw repError;

      // Get collection records
      const { data: collectionData, error: collectionError } = await supabase
        .from('collection_records')
        .select('representative_id, year, month, amount');

      if (collectionError) throw collectionError;

      // Create collection lookup map
      const collections = new Map<string, number>();
      collectionData?.forEach(record => {
        const key = `${record.representative_id}-${record.year}-${record.month}`;
        collections.set(key, record.amount);
      });

      // Sort data by representative, year, month, and category
      const sortedData = [...(repData || [])].sort((a, b) => {
        if (a.representative.name !== b.representative.name) {
          return a.representative.name.localeCompare(b.representative.name);
        }
        if (a.year !== b.year) return a.year - b.year;
        if (a.month !== b.month) return a.month - b.month;
        return a.category.localeCompare(b.category);
      });

      // Track shown collections to avoid repetition
      const shownCollections = new Set<string>();

      // Merge data and handle collection display
      const processedData = sortedData.map(row => {
        const collectionKey = `${row.representative.id}-${row.year}-${row.month}`;
        let collection: number | undefined;

        // Only show collection for the first entry of a representative in a month
        if (!shownCollections.has(collectionKey)) {
          collection = collections.get(collectionKey);
          if (collection !== undefined) {
            shownCollections.add(collectionKey);
          }
        }

        return {
          ...row,
          collection
        };
      });

      setData(processedData);
    } catch (err) {
      console.error('Error fetching data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const calculateCommissionTiers = (row: DataEntry) => {
    const rule = commissionRules.find(r => r.category === row.category);
    if (!rule) return { tier1: 0, tier2: 0, tier3: 0, total: 0 };

    const result = calculateCommission({
      sales: row.sales,
      goal: row.target,
      achievement_percent: row.target === 0 ? 0 : (row.sales / row.target) * 100,
      tier1_rate: rule.tier1_rate,
      tier2_rate: rule.tier2_rate,
      tier3_rate: rule.tier3_rate,
    });

    return {
      tier1: result.tier1_commission,
      tier2: result.tier2_commission,
      tier3: result.tier3_commission,
      total: result.total_commission,
    };
  };

  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      
      // Prepare data for export
      const exportData = data.map(row => {
        const commission = calculateCommissionTiers(row);
        const achievement = row.target === 0 ? 0 : (row.sales / row.target) * 100;
        
        const baseData = {
          'الشركة': row.company.name,
          'المندوب': row.representative.name,
          'الصنف': row.category,
          'السنة': row.year,
          'الشهر': t(`months.${row.month - 1}`),
          'المبيعات': row.sales,
          'الهدف': row.target,
          'نسبة التحقيق': `${achievement.toFixed(1)}%`,
          'التحصيل': row.collection !== undefined ? row.collection : '',
          'إجمالي العمولة': commission.total
        };
        
        // Add commission tiers if enabled
        if (showCommissionTiers) {
          return {
            ...baseData,
            'عمولة الشريحة 1': commission.tier1,
            'عمولة الشريحة 2': commission.tier2,
            'عمولة الشريحة 3': commission.tier3
          };
        }
        
        return baseData;
      });
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Add column widths
      const baseColWidths = [
        { wch: 15 }, // الشركة
        { wch: 15 }, // المندوب
        { wch: 15 }, // الصنف
        { wch: 10 }, // السنة
        { wch: 10 }, // الشهر
        { wch: 15 }, // المبيعات
        { wch: 15 }, // الهدف
        { wch: 12 }, // نسبة التحقيق
        { wch: 15 }, // التحصيل
        { wch: 15 }, // إجمالي العمولة
      ];
      
      // Add commission tier column widths if enabled
      const colWidths = showCommissionTiers ? [
        ...baseColWidths,
        { wch: 15 }, // عمولة الشريحة 1
        { wch: 15 }, // عمولة الشريحة 2
        { wch: 15 }, // عمولة الشريحة 3
      ] : baseColWidths;
      
      ws['!cols'] = colWidths;
      
      // Add to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'البيانات');
      
      // Export
      XLSX.writeFile(wb, 'بيانات_المبيعات.xlsx');
      
      toast.success('تم تصدير البيانات بنجاح');
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      toast.error('فشل في تصدير البيانات');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !data.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">عرض البيانات</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCommissionTiers(!showCommissionTiers)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors"
          >
            {showCommissionTiers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showCommissionTiers ? 'إخفاء شرائح العمولة' : 'إظهار شرائح العمولة'}
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Excel تصدير
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors"
          >
            <Printer className="w-4 h-4" />
            طباعة
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
        <h3 className="text-xl font-semibold mb-4">التصفية</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">من</label>
            <div className="grid grid-cols-2 gap-4">
              <select
                value={filters.startYear}
                onChange={(e) => setFilters(prev => ({ ...prev, startYear: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
              >
                {Array.from({ length: 8 }, (_, i) => 2023 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                value={filters.startMonth}
                onChange={(e) => setFilters(prev => ({ ...prev, startMonth: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
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
                value={filters.endYear}
                onChange={(e) => setFilters(prev => ({ ...prev, endYear: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
              >
                {Array.from({ length: 8 }, (_, i) => 2023 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                value={filters.endMonth}
                onChange={(e) => setFilters(prev => ({ ...prev, endMonth: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{t(`months.${month - 1}`)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <MultiSelect
          label="الشركات"
          options={companies.map(company => ({
            value: company.id,
            label: company.name
          }))}
          value={filters.companies}
          onChange={(value) => setFilters(prev => ({ ...prev, companies: value }))}
          placeholder="اختر الشركات..."
        />

        <MultiSelect
          label="المناديب"
          options={representatives.map(rep => ({
            value: rep.id,
            label: rep.name
          }))}
          value={filters.representatives}
          onChange={(value) => setFilters(prev => ({ ...prev, representatives: value }))}
          placeholder="اختر المناديب..."
        />

        <MultiSelect
          label="الأصناف"
          options={categories.map(cat => ({
            value: cat.name,
            label: cat.name
          }))}
          value={filters.categories}
          onChange={(value) => setFilters(prev => ({ ...prev, categories: value }))}
          placeholder="اختر الأصناف..."
        />

        <div className="flex justify-end">
          <button
            onClick={fetchData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors"
          >
            تطبيق الفلتر
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="px-6 py-3 text-right text-sm font-semibold">{t('company')}</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">{t('representative')}</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">{t('category')}</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">{t('year')}</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">{t('month')}</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">{t('sales')}</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">{t('target')}</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">{t('achievement')}</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">{t('collection')}</th>
                {showCommissionTiers && (
                  <>
                    <th className="px-6 py-3 text-right text-sm font-semibold">{t('tier1Commission')}</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">{t('tier2Commission')}</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">{t('tier3Commission')}</th>
                  </>
                )}
                <th className="px-6 py-3 text-right text-sm font-semibold">{t('totalCommission')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((row) => {
                const commission = calculateCommissionTiers(row);
                return (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm">{row.company.name}</td>
                    <td className="px-6 py-4 text-sm">{row.representative.name}</td>
                    <td className="px-6 py-4 text-sm">{row.category}</td>
                    <td className="px-6 py-4 text-sm tabular-nums">{row.year}</td>
                    <td className="px-6 py-4 text-sm">{t(`months.${row.month - 1}`)}</td>
                    <td className="px-6 py-4 text-sm tabular-nums">{formatNumber(row.sales)}</td>
                    <td className="px-6 py-4 text-sm tabular-nums">{formatNumber(row.target)}</td>
                    <td className="px-6 py-4 text-sm tabular-nums">
                      {row.target === 0 ? '0%' : formatPercentage((row.sales / row.target) * 100)}
                    </td>
                    <td className="px-6 py-4 text-sm tabular-nums">
                      {row.collection !== undefined ? formatNumber(row.collection) : ''}
                    </td>
                    {showCommissionTiers && (
                      <>
                        <td className="px-6 py-4 text-sm tabular-nums">{formatNumber(commission.tier1)}</td>
                        <td className="px-6 py-4 text-sm tabular-nums">{formatNumber(commission.tier2)}</td>
                        <td className="px-6 py-4 text-sm tabular-nums">{formatNumber(commission.tier3)}</td>
                      </>
                    )}
                    <td className="px-6 py-4 text-sm tabular-nums">{formatNumber(commission.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}