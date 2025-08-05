import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface DiscountItem {
  id: string;
  name: string;
  percentage: number | null;
  notes?: string;
}

export function DiscountSettingsPage() {
  const { tenantId, companyId } = useTenant();
  const [discounts, setDiscounts] = useState<DiscountItem[]>([]);
  const [newName, setNewName] = useState('');
  const [newPercentage, setNewPercentage] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<DiscountItem | null>(null);

  useEffect(() => {
    if (tenantId && companyId) {
      fetchDiscounts();
    }
  }, [tenantId, companyId]);

  const fetchDiscounts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('discount_items')
      .select('id, name, percentage, notes')
      .eq('tenant_id', tenantId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('خطأ في تحميل الخصومات');
      console.error(error);
    } else {
      setDiscounts(data || []);
    }

    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.error('الرجاء إدخال اسم الخصم');
      return;
    }

    const percentageValue = newPercentage ? parseFloat(newPercentage) : null;

    const { data, error } = await supabase
      .from('discount_items')
      .insert([
        {
          name: newName.trim(),
          percentage: percentageValue,
          tenant_id: tenantId,
          company_id: companyId
        }
      ])
      .select()
      .single();

    if (error) {
      toast.error('فشل في إضافة الخصم');
      console.error(error);
    } else {
      setDiscounts([data, ...discounts]);
      setNewName('');
      setNewPercentage('');
      toast.success('تمت إضافة الخصم');
    }
  };

  const handleUpdate = async (item: DiscountItem) => {
    const { error } = await supabase
      .from('discount_items')
      .update({ name: item.name, percentage: item.percentage })
      .eq('id', item.id)
      .eq('tenant_id', tenantId)
      .eq('company_id', companyId);

    if (error) {
      toast.error('فشل التعديل');
      console.error(error);
    } else {
      toast.success('تم الحفظ');
    }
  };

  const handleDelete = async (item: DiscountItem) => {
    const { error } = await supabase
      .from('discount_items')
      .delete()
      .eq('id', item.id)
      .eq('tenant_id', tenantId)
      .eq('company_id', companyId);

    if (error) {
      toast.error('فشل الحذف');
      console.error(error);
    } else {
      setDiscounts(discounts.filter(d => d.id !== item.id));
      toast.success('تم حذف الخصم');
    }
  };

  const handleFieldChange = (id: string, field: keyof DiscountItem, value: string) => {
    setDiscounts(prev =>
      prev.map(d =>
        d.id === id
          ? {
              ...d,
              [field]: field === 'percentage' ? (value ? parseFloat(value) : null) : value
            }
          : d
      )
    );
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg animate-fade-in space-y-6">
      <h2 className="text-2xl font-bold mb-4">إعدادات بنود الخصم</h2>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <input
          type="text"
          placeholder="اسم الخصم"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border rounded-lg"
        />
        <input
          type="number"
          placeholder="النسبة المئوية (اختياري)"
          value={newPercentage}
          onChange={(e) => setNewPercentage(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border rounded-lg"
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> إضافة
        </button>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {discounts.map((item) => (
          <div key={item.id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <input
              type="text"
              value={item.name}
              onChange={(e) => handleFieldChange(item.id, 'name', e.target.value)}
              className="w-full md:w-1/3 px-4 py-2 border rounded-lg"
            />
            <input
              type="number"
              value={item.percentage ?? ''}
              onChange={(e) => handleFieldChange(item.id, 'percentage', e.target.value)}
              className="w-full md:w-1/3 px-4 py-2 border rounded-lg"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleUpdate(item)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleting(item)}
                className="px-4 py-2 text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {deleting && (
        <ConfirmDialog
          isOpen={!!deleting}
          title="تأكيد الحذف"
          message={`هل أنت متأكد من حذف الخصم "${deleting.name}"؟`}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            handleDelete(deleting);
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
