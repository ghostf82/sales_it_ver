import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface FinancialAudit {
  id: string;
  description: string;
  amount: number;
  discount_item_id?: string;
  discount_value?: number;
}

interface DiscountItem {
  id: string;
  name: string;
  percentage: number | null;
}

export function FinancialDiscountPage() {
  const { tenantId, companyId } = useTenant();
  const [audits, setAudits] = useState<FinancialAudit[]>([]);
  const [discounts, setDiscounts] = useState<DiscountItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenantId && companyId) {
      fetchAll();
    }
  }, [tenantId, companyId]);

  const fetchAll = async () => {
    setLoading(true);

    const { data: auditsData } = await supabase
      .from('financial_audit')
      .select('id, description, amount, discount_item_id, discount_value')
      .eq('tenant_id', tenantId)
      .eq('company_id', companyId);

    const { data: discountsData } = await supabase
      .from('discount_items')
      .select('id, name, percentage')
      .eq('tenant_id', tenantId)
      .eq('company_id', companyId);

    setAudits(auditsData || []);
    setDiscounts(discountsData || []);
    setLoading(false);
  };

  const handleDiscountChange = (id: string, discountId: string) => {
    const discount = discounts.find((d) => d.id === discountId);
    setAudits((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              discount_item_id: discountId,
              discount_value: discount?.percentage
                ? Number(((a.amount * discount.percentage) / 100).toFixed(2))
                : 0
            }
          : a
      )
    );
  };

  const handleSave = async (audit: FinancialAudit) => {
    const { error } = await supabase
      .from('financial_audit')
      .update({
        discount_item_id: audit.discount_item_id,
        discount_value: audit.discount_value
      })
      .eq('id', audit.id)
      .eq('tenant_id', tenantId)
      .eq('company_id', companyId);

    if (error) {
      toast.error('فشل حفظ الخصم');
      console.error(error);
    } else {
      toast.success('تم الحفظ بنجاح');
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold mb-4">تطبيق الخصومات على العمليات المالية</h2>

      {loading && <p>جاري التحميل...</p>}

      {!loading && audits.length === 0 && <p>لا توجد عمليات مالية.</p>}

      {!loading && audits.map((audit) => (
        <div key={audit.id} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <strong>{audit.description}</strong>
            <span>{audit.amount.toLocaleString()} ريال</span>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <select
              value={audit.discount_item_id || ''}
              onChange={(e) => handleDiscountChange(audit.id, e.target.value)}
              className="w-full md:w-1/3 px-4 py-2 border rounded-lg"
            >
              <option value="">اختر بند خصم</option>
              {discounts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.percentage ? `(${d.percentage}%)` : ''}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={audit.discount_value ?? ''}
              readOnly
              className="w-full md:w-1/4 px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-600"
              placeholder="قيمة الخصم"
            />

            <button
              onClick={() => handleSave(audit)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Save className="w-4 h-4" />
              حفظ
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
