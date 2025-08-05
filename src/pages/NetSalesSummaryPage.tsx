import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Download, 
  RefreshCw, 
  Filter, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import { formatNumber, formatPercentage } from '../utils/numberUtils';
import { MultiSelect } from '../components/MultiSelect';

interface NetSalesSummaryItem {
  record_id: string;
  representative_id: string;
  representative_name: string;
  company_id: string;
  company_name: string;
  category: string;
  sales: number;
  net_total_sales: number;
  net_sales_per_category: number;
  net_sales_percentage: number;
  month: number;
  year: number;
}

export function NetSalesSummaryPage() {
  const { t } = useTranslation();
  const { isAdmin, isFinancialAuditor } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<NetSalesSummaryItem[]>([]);
  
  // Filters
  const [yearFilter, setYearFilter] = useState<string[]>([new Date().getFullYear().toString()]);
  const [monthFilter, setMonthFilter] = useState<string[]>([new Date().getMonth() + 1 + '']);
  const [representativeFilter, setRepresentativeFilter] = useState<string[]>([]);
  const [companyFilter, setCompanyFilter] = useState<string[]>([]);
  
  // Filter options
  const [representatives, setRepresentatives] = useState<{ id: string; name: string }[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchFilterOptions();
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [yearFilter, monthFilter, representativeFilter, companyFilter]);

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
    } catch (err) {
      console.error('Error fetching filter options:', err);
      toast.error('فشل في تحميل خيارات التصفية');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      let query = supabase
        .from('net_sales_per_category_view')
        .select('*');

      // Apply year filter
      if (yearFilter.length > 0) {
        query = query.in('year', yearFilter.map(Number));
      }

      // Apply month filter
      if (monthFilter.length > 0) {
        query = query.in('month', monthFilter.map(Number));
      }

      // Apply representative filter
      if (representativeFilter.length > 0) {
        query = query.in('representative_id', representativeFilter);
      }

      // Apply company filter
      if (companyFilter.length > 0) {
        query = query.in('company_id', companyFilter);
      }

      // Add ordering
      query = query.order('representative_name', { ascending: true })
        .order('company_name', { ascending: true })
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .order('category', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      
      setData(data || []);
    } catch (err) {
      console.error('Error fetching net sales data:', err);
      setError('فشل في تحميل بيانات صافي المبيعات');
      toast.error('فشل في تحميل بيانات صافي المبيعات');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  };

  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      
      // Prepare data for export
      const exportData = data.map(row => ({
        'المندوب': row.representative_name,
        'الشركة': row.company_name,
        'الشهر': t(`months.${row.month - 1}`),
        'السنة': row.year,
        'الصنف': row.category,
        'المبيعات': row.sales,
        'إجمالي صافي المبيعات': row.net_total_sales,
        'صافي المبيعات للصنف': row.net_sales_per_category,
        'نسبة صافي المبيعات من المبيعات': formatPercentage(row.net_sales_percentage)
      }));
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const colWidths = [
        { wch: 20 }, // المندوب
        { wch: 20 }, // الشركة
        { wch: 10 }, // الشهر
        { wch: 10 }, // السنة
        { wch: 15 }, // الصنف
        { wch: 15 }, // المبيعات
        { wch: 20 }, // إجمالي صافي المبيعات
        { wch: 20 }, // صافي المبيعات للصنف
        { wch: 25 }, // نسبة صافي المبيعات من المبيعات
      ];
      ws['!cols'] = colWidths;
      
      // Add to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'صافي المبيعات');
      
      // Export
      const filename = `تقرير_صافي_المبيعات_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast.success('تم تصدير البيانات بنجاح');
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      toast.error('فشل في تصدير البيانات');
    }
  };

  if (loading && !data.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">ملخص صافي المبيعات</h2>
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
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium">تصفية البيانات</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">السنة</label>
            <MultiSelect
              options={Array.from({ length: 8 }, (_, i) => ({
                value: (2023 + i).toString(),
                label: (2023 + i).toString()
              }))}
              value={yearFilter}
              onChange={setYearFilter}
              placeholder="اختر السنوات..."
              showSelectAll={true}
              selectAllLabel="عرض كل السنوات"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">الشهر</label>
            <MultiSelect
              options={Array.from({ length: 12 }, (_, i) => ({
                value: (i + 1).toString(),
                label: t(`months.${i}`)
              }))}
              value={monthFilter}
              onChange={setMonthFilter}
              placeholder="اختر الشهور..."
              showSelectAll={true}
              selectAllLabel="عرض كل الشهور"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MultiSelect
            label="المناديب"
            options={representatives.map(rep => ({
              value: rep.id,
              label: rep.name
            }))}
            value={representativeFilter}
            onChange={setRepresentativeFilter}
            placeholder="اختر المناديب..."
            showSelectAll={true}
            selectAllLabel="عرض كل المناديب"
          />
          
          <MultiSelect
            label="الشركات"
            options={companies.map(company => ({
              value: company.id,
              label: company.name
            }))}
            value={companyFilter}
            onChange={setCompanyFilter}
            placeholder="اختر الشركات..."
            showSelectAll={true}
            selectAllLabel="عرض كل الشركات"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">المندوب</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">الشركة</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">الشهر</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">السنة</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">الصنف</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">المبيعات</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">إجمالي صافي المبيعات</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">صافي المبيعات للصنف</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">النسبة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                    لا توجد بيانات متاحة
                  </td>
                </tr>
              ) : (
                data.map((row) => {
                  const isLowRatio = row.net_sales_percentage < 60;
                  
                  return (
                    <tr 
                      key={row.record_id}
                      className={isLowRatio ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"}
                    >
                      <td className="px-6 py-4 text-sm">{row.representative_name}</td>
                      <td className="px-6 py-4 text-sm">{row.company_name}</td>
                      <td className="px-6 py-4 text-sm">{t(`months.${row.month - 1}`)}</td>
                      <td className="px-6 py-4 text-sm tabular-nums">{row.year}</td>
                      <td className="px-6 py-4 text-sm">{row.category}</td>
                      <td className="px-6 py-4 text-sm tabular-nums">{formatNumber(row.sales)}</td>
                      <td className="px-6 py-4 text-sm tabular-nums">{formatNumber(row.net_total_sales)}</td>
                      <td className="px-6 py-4 text-sm tabular-nums">{formatNumber(row.net_sales_per_category)}</td>
                      <td className={`px-6 py-4 text-sm tabular-nums ${isLowRatio ? 'text-red-600 font-semibold' : ''}`}>
                        {formatPercentage(row.net_sales_percentage)}
                        {isLowRatio && (
                          <AlertTriangle className="inline-block w-4 h-4 ml-1 text-red-600" />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              إجمالي السجلات: {data.length}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-100 rounded-full"></div>
                <span className="text-sm text-gray-600">صافي المبيعات أقل من 60% من المبيعات</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}