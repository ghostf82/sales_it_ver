import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  FileText, 
  Download, 
  RefreshCw, 
  Calculator, 
  DollarSign,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import { NumberInput } from '../components/NumberInput';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatNumber, parseNumber } from '../utils/numberUtils';
import { MultiSelect } from '../components/MultiSelect';
import clsx from 'clsx';

interface RepresentativeTotalSales {
  representative_id: string;
  representative_name: string;
  company_id: string;
  company_name: string;
  month: number;
  year: number;
  total_sales: number;
  has_financial_audit: boolean;
}

interface FinancialAuditData {
  id?: string;
  representative_id: string;
  company_id: string;
  month: number;
  year: number;
  total_sales: string;
  deduction_operating: string;
  deduction_transportation: string;
  deduction_general: string;
  deduction_custom_label: string;
  deduction_custom_amount: string;
  net_total_sales: string;
  salesperson_name?: string;
  company?: string;
}

interface CustomDeduction {
  id: string;
  label: string;
  amount: string;
}

export function FinancialAuditPage() {
  const { t } = useTranslation();
  const { isAdmin, isFinancialAuditor, isSuperAdmin } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [salesData, setSalesData] = useState<RepresentativeTotalSales[]>([]);
  const [selectedItem, setSelectedItem] = useState<RepresentativeTotalSales | null>(null);
  const [auditData, setAuditData] = useState<FinancialAuditData | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customDeductions, setCustomDeductions] = useState<CustomDeduction[]>([]);
  const [newDeductionLabel, setNewDeductionLabel] = useState('');
  const [newDeductionAmount, setNewDeductionAmount] = useState('');
  
  // Filters
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [monthFilter, setMonthFilter] = useState<number>(new Date().getMonth() + 1);
  const [representativeFilter, setRepresentativeFilter] = useState<string[]>([]);
  const [companyFilter, setCompanyFilter] = useState<string[]>([]);
  
  // Filter options
  const [representatives, setRepresentatives] = useState<{ id: string; name: string }[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  // Check if user has permission to edit
  const canEdit = isAdmin || isFinancialAuditor || isSuperAdmin;

  useEffect(() => {
    fetchFilterOptions();
    fetchSalesData();
  }, []);

  useEffect(() => {
    fetchSalesData();
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

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError('');

      // Use the RPC function to get representative total sales
      const { data, error } = await supabase.rpc('get_representative_total_sales', {
        p_year: yearFilter,
        p_month: monthFilter
      });

      if (error) throw error;
      
      // Apply client-side filtering for representatives and companies
      let filteredData = data || [];
      
      if (representativeFilter.length > 0) {
        filteredData = filteredData.filter(item => 
          representativeFilter.includes(item.representative_id)
        );
      }
      
      if (companyFilter.length > 0) {
        filteredData = filteredData.filter(item => 
          companyFilter.includes(item.company_id)
        );
      }
      
      setSalesData(filteredData);
      setSelectedItem(null);
      setAuditData(null);
      setCustomDeductions([]);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError('فشل في تحميل بيانات المبيعات');
      toast.error('فشل في تحميل بيانات المبيعات');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSalesData().finally(() => setRefreshing(false));
  };

  const handleSelectItem = async (item: RepresentativeTotalSales) => {
    setSelectedItem(item);
    setCustomDeductions([]);
    
    if (item.has_financial_audit) {
      try {
        // Fetch financial audit data directly without joining with auth.users
        const { data, error } = await supabase
          .from('financial_audit')
          .select('*')
          .eq('representative_id', item.representative_id)
          .eq('company_id', item.company_id)
          .eq('year', item.year)
          .eq('month', item.month)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setAuditData({
            id: data.id,
            representative_id: data.representative_id,
            company_id: data.company_id,
            month: data.month,
            year: data.year,
            total_sales: formatNumber(data.total_sales),
            deduction_operating: formatNumber(data.deduction_operating),
            deduction_transportation: formatNumber(data.deduction_transportation),
            deduction_general: formatNumber(data.deduction_general),
            deduction_custom_label: data.deduction_custom_label || '',
            deduction_custom_amount: formatNumber(data.deduction_custom_amount || 0),
            net_total_sales: formatNumber(data.net_total_sales),
            salesperson_name: data.salesperson_name || item.representative_name,
            company: data.company || item.company_name
          });
          
          // If the custom label is "تفاصيل متعددة", try to parse it from the label
          if (data.deduction_custom_label === 'خصومات متعددة' && data.deduction_custom_amount > 0) {
            // We don't have the actual breakdown, so we'll just create a placeholder
            setCustomDeductions([{
              id: '1',
              label: 'خصومات متعددة',
              amount: formatNumber(data.deduction_custom_amount)
            }]);
          }
        }
      } catch (err) {
        console.error('Error fetching audit data:', err);
        toast.error('فشل في تحميل بيانات التدقيق المالي');
      }
    } else {
      setAuditData({
        representative_id: item.representative_id,
        company_id: item.company_id,
        month: item.month,
        year: item.year,
        total_sales: formatNumber(item.total_sales),
        deduction_operating: '0',
        deduction_transportation: '0',
        deduction_general: '0',
        deduction_custom_label: '',
        deduction_custom_amount: '0',
        net_total_sales: formatNumber(item.total_sales),
        salesperson_name: item.representative_name,
        company: item.company_name
      });
    }
  };

  const handleInputChange = (field: keyof FinancialAuditData, value: string) => {
    if (!auditData) return;
    
    setAuditData(prev => {
      if (!prev) return prev;
      
      const updatedData = { ...prev, [field]: value };
      
      // Recalculate net_total_sales if any deduction field changes
      if (field.startsWith('deduction_')) {
        const totalSales = parseNumber(updatedData.total_sales);
        const deductionOperating = parseNumber(updatedData.deduction_operating);
        const deductionTransportation = parseNumber(updatedData.deduction_transportation);
        const deductionGeneral = parseNumber(updatedData.deduction_general);
        
        // Calculate total custom deductions
        const totalCustomDeductions = customDeductions.reduce(
          (sum, deduction) => sum + parseNumber(deduction.amount), 
          0
        );
        
        const netTotalSales = totalSales - (
          deductionOperating + 
          deductionTransportation + 
          deductionGeneral + 
          totalCustomDeductions
        );
        
        updatedData.net_total_sales = formatNumber(Math.max(0, netTotalSales));
        updatedData.deduction_custom_amount = formatNumber(totalCustomDeductions);
      }
      
      return updatedData;
    });
  };

  const handleAddCustomDeduction = () => {
    if (!newDeductionLabel.trim() || !newDeductionAmount.trim()) {
      toast.error('الرجاء إدخال اسم وقيمة الخصم');
      return;
    }
    
    const newDeduction: CustomDeduction = {
      id: Date.now().toString(),
      label: newDeductionLabel.trim(),
      amount: newDeductionAmount
    };
    
    setCustomDeductions(prev => [...prev, newDeduction]);
    setNewDeductionLabel('');
    setNewDeductionAmount('');
    
    // Update total custom deduction amount
    if (auditData) {
      const totalCustomDeductions = [
        ...customDeductions, 
        newDeduction
      ].reduce((sum, deduction) => sum + parseNumber(deduction.amount), 0);
      
      const totalSales = parseNumber(auditData.total_sales);
      const deductionOperating = parseNumber(auditData.deduction_operating);
      const deductionTransportation = parseNumber(auditData.deduction_transportation);
      const deductionGeneral = parseNumber(auditData.deduction_general);
      
      const netTotalSales = totalSales - (
        deductionOperating + 
        deductionTransportation + 
        deductionGeneral + 
        totalCustomDeductions
      );
      
      setAuditData({
        ...auditData,
        deduction_custom_label: 'خصومات متعددة',
        deduction_custom_amount: formatNumber(totalCustomDeductions),
        net_total_sales: formatNumber(Math.max(0, netTotalSales))
      });
    }
  };

  const handleRemoveCustomDeduction = (id: string) => {
    setCustomDeductions(prev => prev.filter(item => item.id !== id));
    
    // Update total custom deduction amount
    if (auditData) {
      const updatedDeductions = customDeductions.filter(item => item.id !== id);
      const totalCustomDeductions = updatedDeductions.reduce(
        (sum, deduction) => sum + parseNumber(deduction.amount), 
        0
      );
      
      const totalSales = parseNumber(auditData.total_sales);
      const deductionOperating = parseNumber(auditData.deduction_operating);
      const deductionTransportation = parseNumber(auditData.deduction_transportation);
      const deductionGeneral = parseNumber(auditData.deduction_general);
      
      const netTotalSales = totalSales - (
        deductionOperating + 
        deductionTransportation + 
        deductionGeneral + 
        totalCustomDeductions
      );
      
      setAuditData({
        ...auditData,
        deduction_custom_label: updatedDeductions.length > 0 ? 'خصومات متعددة' : '',
        deduction_custom_amount: formatNumber(totalCustomDeductions),
        net_total_sales: formatNumber(Math.max(0, netTotalSales))
      });
    }
  };

  const handleSaveAudit = async () => {
    if (!auditData || !selectedItem) return;
    
    try {
      setLoading(true);
      
      // Calculate total custom deductions
      const totalCustomDeductions = customDeductions.reduce(
        (sum, deduction) => sum + parseNumber(deduction.amount), 
        0
      );
      
      const payload = {
        representative_id: auditData.representative_id,
        company_id: auditData.company_id,
        month: auditData.month,
        year: auditData.year,
        total_sales: parseNumber(auditData.total_sales),
        deduction_operating: parseNumber(auditData.deduction_operating),
        deduction_transportation: parseNumber(auditData.deduction_transportation),
        deduction_general: parseNumber(auditData.deduction_general),
        deduction_custom_label: customDeductions.length > 0 ? 'خصومات متعددة' : null,
        deduction_custom_amount: totalCustomDeductions,
        salesperson_name: auditData.salesperson_name, // Include the salesperson_name in the payload
        company: auditData.company, // Include the company name in the payload
        // Set updated_at to avoid trigger recursion
        updated_at: new Date().toISOString()
      };
      
      let result;
      
      if (auditData.id) {
        // Update existing record
        result = await supabase
          .from('financial_audit')
          .update(payload)
          .eq('id', auditData.id);
      } else {
        // Insert new record
        result = await supabase
          .from('financial_audit')
          .insert([payload]);
      }
      
      if (result.error) throw result.error;
      
      toast.success('تم حفظ بيانات التدقيق المالي بنجاح');
      fetchSalesData();
    } catch (err) {
      console.error('Error saving audit data:', err);
      setError('فشل في حفظ بيانات التدقيق المالي');
      toast.error('فشل في حفظ بيانات التدقيق المالي: ' + (err instanceof Error ? err.message : 'خطأ غير معروف'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAudit = async () => {
    if (!auditData?.id) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('financial_audit')
        .delete()
        .eq('id', auditData.id);
      
      if (error) throw error;
      
      toast.success('تم حذف بيانات التدقيق المالي بنجاح');
      fetchSalesData();
      setSelectedItem(null);
      setAuditData(null);
      setCustomDeductions([]);
    } catch (err) {
      console.error('Error deleting audit data:', err);
      toast.error('فشل في حذف بيانات التدقيق المالي');
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      
      // Prepare data for export
      const exportData = salesData.map(row => {
        const auditRecord = row.has_financial_audit ? 
          salesData.find(item => 
            item.representative_id === row.representative_id && 
            item.company_id === row.company_id &&
            item.year === row.year &&
            item.month === row.month
          ) : null;
        
        return {
          'المندوب': row.representative_name,
          'الشركة': row.company_name,
          'السنة': row.year,
          'الشهر': t(`months.${row.month - 1}`),
          'إجمالي المبيعات': row.total_sales,
          'تم التدقيق المالي': row.has_financial_audit ? 'نعم' : 'لا',
        };
      });
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const colWidths = [
        { wch: 20 }, // المندوب
        { wch: 20 }, // الشركة
        { wch: 10 }, // السنة
        { wch: 10 }, // الشهر
        { wch: 15 }, // إجمالي المبيعات
        { wch: 15 }, // تم التدقيق المالي
      ];
      ws['!cols'] = colWidths;
      
      // Add to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'التدقيق المالي');
      
      // Export
      XLSX.writeFile(wb, `تقرير_التدقيق_المالي_${yearFilter}_${monthFilter}.xlsx`);
      
      toast.success('تم تصدير البيانات بنجاح');
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      toast.error('فشل في تصدير البيانات');
    }
  };

  if (loading && !salesData.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">التدقيق المالي</h2>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-medium mb-4">تصفية البيانات</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">السنة</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(parseInt(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 8 }, (_, i) => 2023 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">الشهر</label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(parseInt(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{t(`months.${month - 1}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">المناديب</label>
              <MultiSelect
                options={representatives.map(rep => ({
                  value: rep.id,
                  label: rep.name
                }))}
                value={representativeFilter}
                onChange={setRepresentativeFilter}
                placeholder="اختر المناديب..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">الشركات</label>
              <MultiSelect
                options={companies.map(company => ({
                  value: company.id,
                  label: company.name
                }))}
                value={companyFilter}
                onChange={setCompanyFilter}
                placeholder="اختر الشركات..."
              />
            </div>
          </div>
        </div>

        {/* Sales Data Table */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium">بيانات المبيعات</h3>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900">المندوب</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900">الشركة</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900">إجمالي المبيعات</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {salesData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                      لا توجد بيانات متاحة
                    </td>
                  </tr>
                ) : (
                  salesData.map((item, index) => (
                    <tr 
                      key={`${item.representative_id}-${item.company_id}-${item.year}-${item.month}`}
                      className={clsx(
                        "hover:bg-gray-50 cursor-pointer",
                        selectedItem?.representative_id === item.representative_id && 
                        selectedItem?.company_id === item.company_id &&
                        selectedItem?.year === item.year &&
                        selectedItem?.month === item.month
                          ? "bg-blue-50"
                           : ""
                      )}
                      onClick={() => handleSelectItem(item)}
                    >
                      <td className="px-4 py-3 text-sm">{item.representative_name}</td>
                      <td className="px-4 py-3 text-sm">{item.company_name}</td>
                      <td className="px-4 py-3 text-sm tabular-nums">{formatNumber(item.total_sales)}</td>
                      <td className="px-4 py-3 text-sm">
                        {item.has_financial_audit ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            تم التدقيق
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            بانتظار التدقيق
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Audit Form */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium">نموذج التدقيق المالي</h3>
          </div>
          
          {selectedItem ? (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">المندوب</label>
                  <input
                    type="text"
                    value={selectedItem.representative_name}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">الشركة</label>
                  <input
                    type="text"
                    value={selectedItem.company_name}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">الشهر</label>
                  <input
                    type="text"
                    value={t(`months.${selectedItem.month - 1}`)}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">السنة</label>
                  <input
                    type="text"
                    value={selectedItem.year}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>

              {auditData && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">إجمالي المبيعات</label>
                    <NumberInput
                      value={auditData.total_sales}
                      onChange={(value) => handleInputChange('total_sales', value)}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-red-500" />
                      الخصومات
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">تكاليف التشغيل</label>
                        <NumberInput
                          value={auditData.deduction_operating}
                          onChange={(value) => handleInputChange('deduction_operating', value)}
                          disabled={!canEdit}
                          className={!canEdit ? "bg-gray-100 cursor-not-allowed" : ""}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">رسوم النقل</label>
                        <NumberInput
                          value={auditData.deduction_transportation}
                          onChange={(value) => handleInputChange('deduction_transportation', value)}
                          disabled={!canEdit}
                          className={!canEdit ? "bg-gray-100 cursor-not-allowed" : ""}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">خصومات عامة</label>
                        <NumberInput
                          value={auditData.deduction_general}
                          onChange={(value) => handleInputChange('deduction_general', value)}
                          disabled={!canEdit}
                          className={!canEdit ? "bg-gray-100 cursor-not-allowed" : ""}
                        />
                      </div>
                      
                      {/* Custom Deductions Section */}
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h5 className="text-md font-medium mb-3">خصومات إضافية</h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">اسم الخصم</label>
                            <input
                              type="text"
                              value={newDeductionLabel}
                              onChange={(e) => setNewDeductionLabel(e.target.value)}
                              disabled={!canEdit}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEdit ? "bg-gray-100 cursor-not-allowed" : ""}`}
                              placeholder="أدخل اسم الخصم"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">قيمة الخصم</label>
                            <div className="flex">
                              <NumberInput
                                value={newDeductionAmount}
                                onChange={setNewDeductionAmount}
                                placeholder="أدخل قيمة الخصم"
                                disabled={!canEdit}
                                className={`flex-1 ${!canEdit ? "bg-gray-100 cursor-not-allowed" : ""}`}
                              />
                              <button
                                type="button"
                                onClick={handleAddCustomDeduction}
                                disabled={!canEdit}
                                className={`flex items-center justify-center ml-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* List of custom deductions */}
                        {customDeductions.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4 mt-2">
                            <h6 className="text-sm font-medium mb-2">قائمة الخصومات الإضافية</h6>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {customDeductions.map(deduction => (
                                <div 
                                  key={deduction.id}
                                  className="flex items-center justify-between bg-white p-2 rounded-lg"
                                >
                                  <div className="flex-1">
                                    <span className="text-sm font-medium">{deduction.label}</span>
                                    <span className="text-sm text-gray-500 mr-2">
                                      ({formatNumber(parseNumber(deduction.amount))})
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCustomDeduction(deduction.id)}
                                    disabled={!canEdit}
                                    className={`text-red-500 hover:text-red-700 ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between">
                              <span className="text-sm font-medium">المجموع:</span>
                              <span className="text-sm font-bold">
                                {formatNumber(
                                  customDeductions.reduce(
                                    (sum, deduction) => sum + parseNumber(deduction.amount), 
                                    0
                                  )
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <div>
                      <label className="block text-lg font-medium mb-2 flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-green-500" />
                        صافي المبيعات
                      </label>
                      <NumberInput
                        value={auditData.net_total_sales}
                        onChange={(value) => handleInputChange('net_total_sales', value)}
                        disabled
                        className="bg-gray-100 cursor-not-allowed font-bold text-lg"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    {auditData.id && canEdit && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmOpen(true)}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        حذف
                      </button>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={handleSaveAudit}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors disabled:opacity-50 mr-auto"
                      >
                        <Save className="w-4 h-4" />
                        {loading ? 'جاري الحفظ...' : 'حفظ'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="bg-gray-50 rounded-lg p-8">
                <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  الرجاء اختيار مندوب من القائمة لعرض أو إدخال بيانات التدقيق المالي
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteAudit}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف بيانات التدقيق المالي؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
}