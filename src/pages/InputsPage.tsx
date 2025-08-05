import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface Input {
  id: string;
  year: number;
  company: { id: string; name: string };
  representative: { id: string; name: string };
  category: string;
  sales: number;
  target: number;
  collection: number;
  created_at: string;
}

interface FormData {
  year: number;
  companyId: string;
  representativeId: string;
  category: string;
  sales: string;
  target: string;
  collection: string;
}

const years = Array.from({ length: 8 }, (_, i) => 2023 + i);

export function InputsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [inputs, setInputs] = useState<Input[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string; }[]>([]);
  const [representatives, setRepresentatives] = useState<{ id: string; name: string; }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; }[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInput, setEditingInput] = useState<Input | null>(null);
  const [deletingInput, setDeletingInput] = useState<Input | null>(null);
  const [formData, setFormData] = useState<FormData>({
    year: new Date().getFullYear(),
    companyId: '',
    representativeId: '',
    category: '',
    sales: '',
    target: '',
    collection: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch inputs
      const { data: inputsData, error: inputsError } = await supabase
        .from('inputs')
        .select(`
          id,
          year,
          company:company_id(id, name),
          representative:representative_id(id, name),
          category,
          sales,
          target,
          collection,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (inputsError) throw inputsError;
      setInputs(inputsData || []);

      // Fetch companies
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');
      setCompanies(companiesData || []);

      // Fetch representatives
      const { data: repsData } = await supabase
        .from('representatives')
        .select('id, name')
        .order('name');
      setRepresentatives(repsData || []);

      // Fetch categories
      const { data: catsData } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      setCategories(catsData || []);

    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('فشل في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      const payload = {
        year: formData.year,
        company_id: formData.companyId,
        representative_id: formData.representativeId,
        category: formData.category,
        sales: parseFloat(formData.sales.replace(/,/g, '')),
        target: parseFloat(formData.target.replace(/,/g, '')),
        collection: parseFloat(formData.collection.replace(/,/g, ''))
      };

      let error;
      if (editingInput) {
        ({ error } = await supabase
          .from('inputs')
          .update(payload)
          .eq('id', editingInput.id));
      } else {
        ({ error } = await supabase
          .from('inputs')
          .insert([payload]));
      }

      if (error) throw error;

      toast.success(editingInput ? 'تم تحديث المدخل بنجاح' : 'تم إضافة المدخل بنجاح');
      await fetchData();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving input:', err);
      toast.error('فشل في حفظ المدخل');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (input: Input) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('inputs')
        .delete()
        .eq('id', input.id);

      if (error) throw error;

      toast.success('تم حذف المدخل بنجاح');
      await fetchData();
    } catch (err) {
      console.error('Error deleting input:', err);
      toast.error('فشل في حذف المدخل');
    } finally {
      setLoading(false);
      setDeletingInput(null);
    }
  };

  const handleEdit = (input: Input) => {
    setFormData({
      year: input.year,
      companyId: input.company.id,
      representativeId: input.representative.id,
      category: input.category,
      sales: input.sales.toString(),
      target: input.target.toString(),
      collection: input.collection.toString()
    });
    setEditingInput(input);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setFormData({
      year: new Date().getFullYear(),
      companyId: '',
      representativeId: '',
      category: '',
      sales: '',
      target: '',
      collection: ''
    });
    setEditingInput(null);
    setShowAddModal(false);
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('en-US');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          رجوع
        </button>
        <h2 className="text-3xl font-bold">المدخلات</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة مدخل
        </button>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50">
              <th className="px-6 py-3 text-right text-sm font-semibold">السنة</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">اسم الشركة</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">اسم المندوب</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">الصنف</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">المبيعات</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">الهدف</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">التحصيل</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">العمولة</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {inputs.map(input => (
              <tr key={input.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 text-sm">{input.year}</td>
                <td className="px-6 py-4 text-sm">{input.company.name}</td>
                <td className="px-6 py-4 text-sm">{input.representative.name}</td>
                <td className="px-6 py-4 text-sm">{input.category}</td>
                <td className="px-6 py-4 text-sm">{formatNumber(input.sales)}</td>
                <td className="px-6 py-4 text-sm">{formatNumber(input.target)}</td>
                <td className="px-6 py-4 text-sm">{formatNumber(input.collection)}</td>
                <td className="px-6 py-4 text-sm">{formatNumber(input.sales * 0.1)}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleEdit(input)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingInput(input)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={editingInput ? 'تعديل المدخل' : 'إضافة مدخل جديد'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                السنة
              </label>
              <select
                name="year"
                required
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                اسم الشركة
              </label>
              <select
                name="companyId"
                required
                value={formData.companyId}
                onChange={(e) => setFormData(prev => ({ ...prev, companyId: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="">اختر الشركة</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                اسم المندوب
              </label>
              <select
                name="representativeId"
                required
                value={formData.representativeId}
                onChange={(e) => setFormData(prev => ({ ...prev, representativeId: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="">اختر المندوب</option>
                {representatives.map(rep => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                الصنف
              </label>
              <select
                name="category"
                required
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="">اختر الصنف</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                المبيعات
              </label>
              <input
                type="text"
                name="sales"
                required
                value={formData.sales}
                onChange={(e) => setFormData(prev => ({ ...prev, sales: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                placeholder="أدخل قيمة المبيعات"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                الهدف
              </label>
              <input
                type="text"
                name="target"
                required
                value={formData.target}
                onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                placeholder="أدخل قيمة الهدف"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                التحصيل
              </label>
              <input
                type="text"
                name="collection"
                value={formData.collection}
                onChange={(e) => setFormData(prev => ({ ...prev, collection: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                placeholder="أدخل قيمة التحصيل"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      {deletingInput && (
        <ConfirmDialog
          isOpen={!!deletingInput}
          onClose={() => setDeletingInput(null)}
          onConfirm={() => handleDelete(deletingInput)}
          title="حذف المدخل"
          message={`هل أنت متأكد من حذف هذا المدخل؟`}
        />
      )}
    </div>
  );
}