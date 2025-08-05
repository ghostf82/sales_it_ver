import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';

export function FinancialDiscountReportPage() {
  const { tenantId, companyId } = useTenant();
  const [total, setTotal] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenantId && companyId) {
      fetchSummary();
    }
  }, [tenantId, companyId]);

  const fetchSummary = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('financial_audit')
      .select('amount, discount_value')
      .eq('tenant_id', tenantId)
      .eq('company_id', companyId);

    if (error) {
      console.error('Error fetching summary:', error);
      setLoading(false);
      return;
    }

    const totalAmount = data?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
    const totalDiscountValue = data?.reduce((sum, item) => sum + (item.discount_value || 0), 0) || 0;

    setTotal(totalAmount);
    setTotalDiscount(totalDiscountValue);
    setLoading(false);
  };

  const net = total - totalDiscount;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg animate-fade-in space-y-6">
      <h2 className="text-2xl font-bold mb-4">تقرير الخصومات المالية</h2>

      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-6 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">إجمالي العمليات</p>
            <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{total.toLocaleString()} ريال</p>
          </div>
          <div className="p-6 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">إجمالي الخصومات</p>
            <p className="text-2xl font-bold text-red-800 dark:text-red-300">{totalDiscount.toLocaleString()} ريال</p>
          </div>
          <div className="p-6 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">الصافي بعد الخصومات</p>
            <p className="text-2xl font-bold text-green-800 dark:text-green-300">{net.toLocaleString()} ريال</p>
          </div>
        </div>
      )}
    </div>
  );
}
