import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AddCommissionRuleModal, type NewCommissionRule } from '../components/AddCommissionRuleModal';

interface CommissionRule {
  id: string;
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

export function CommissionSettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [deletingRule, setDeletingRule] = useState<CommissionRule | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch commission rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('commission_rules')
        .select('*')
        .order('category');

      if (rulesError) throw rulesError;
      setRules(rulesData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async (newRule: NewCommissionRule) => {
    try {
      const { data, error } = await supabase
        .from('commission_rules')
        .insert([newRule])
        .select()
        .single();

      if (error) throw error;

      setRules([...rules, data]);
      toast.success('تم إضافة قاعدة العمولة بنجاح');
    } catch (err) {
      console.error('Error adding rule:', err);
      throw err;
    }
  };

  const handleUpdateRule = async (rule: CommissionRule) => {
    try {
      const { error } = await supabase
        .from('commission_rules')
        .update({
          tier1_from: rule.tier1_from,
          tier1_to: rule.tier1_to,
          tier1_rate: rule.tier1_rate,
          tier2_from: rule.tier2_from,
          tier2_to: rule.tier2_to,
          tier2_rate: rule.tier2_rate,
          tier3_from: rule.tier3_from,
          tier3_rate: rule.tier3_rate
        })
        .eq('id', rule.id);

      if (error) throw error;

      setRules(rules.map(r => r.id === rule.id ? rule : r));
      toast.success('تم تحديث قاعدة العمولة بنجاح');
    } catch (err) {
      console.error('Error updating rule:', err);
      toast.error('فشل في تحديث قاعدة العمولة');
    }
  };

  const handleDeleteRule = async (rule: CommissionRule) => {
    try {
      const { error } = await supabase
        .from('commission_rules')
        .delete()
        .eq('id', rule.id);

      if (error) throw error;

      setRules(rules.filter(r => r.id !== rule.id));
      toast.success('تم حذف قاعدة العمولة بنجاح');
    } catch (err) {
      console.error('Error deleting rule:', err);
      toast.error('فشل في حذف قاعدة العمولة');
    }
  };

  const handleInputChange = (
    ruleId: string,
    field: keyof CommissionRule,
    value: string
  ) => {
    setRules(prevRules =>
      prevRules.map(rule =>
        rule.id === ruleId
          ? {
              ...rule,
              [field]: field.includes('rate')
                ? parseFloat(value) || 0
                : parseInt(value) || 0
            }
          : rule
      )
    );
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">صلاحية المشرف فقط</h2>
          <p className="text-gray-600 mb-6">
            يمكن للمشرفين فقط إدارة إعدادات العمولات
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 mx-auto text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            رجوع
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl rounded-2xl p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          رجوع
        </button>
        <h2 className="text-3xl font-bold">إعدادات العمولات</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة قاعدة
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {rules.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <p className="text-gray-500 mb-4">لا توجد قواعد عمولات حالياً</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors"
          >
            <Plus className="w-5 h-5" />
            إضافة قاعدة جديدة
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {rules.map(rule => (
            <div key={rule.id} className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{rule.category}</h3>
                <button
                  onClick={() => setDeletingRule(rule)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tier 1 */}
                <div className="space-y-4">
                  <h4 className="font-medium">الشريحة 1</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        من %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={rule.tier1_from}
                        onChange={(e) => handleInputChange(rule.id, 'tier1_from', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        إلى %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={rule.tier1_to}
                        onChange={(e) => handleInputChange(rule.id, 'tier1_to', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      نسبة العمولة
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      value={rule.tier1_rate}
                      onChange={(e) => handleInputChange(rule.id, 'tier1_rate', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Tier 2 */}
                <div className="space-y-4">
                  <h4 className="font-medium">الشريحة 2</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        من %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={rule.tier2_from}
                        onChange={(e) => handleInputChange(rule.id, 'tier2_from', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        إلى %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={rule.tier2_to}
                        onChange={(e) => handleInputChange(rule.id, 'tier2_to', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      نسبة العمولة
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      value={rule.tier2_rate}
                      onChange={(e) => handleInputChange(rule.id, 'tier2_rate', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Tier 3 */}
                <div className="space-y-4">
                  <h4 className="font-medium">الشريحة 3</h4>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      من %
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={rule.tier3_from}
                      onChange={(e) => handleInputChange(rule.id, 'tier3_from', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      نسبة العمولة
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      value={rule.tier3_rate}
                      onChange={(e) => handleInputChange(rule.id, 'tier3_rate', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => handleUpdateRule(rule)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  حفظ التغييرات
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Rule Modal */}
      <AddCommissionRuleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddRule}
        categories={categories}
        existingCategories={rules.map(rule => rule.category)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingRule}
        onClose={() => setDeletingRule(null)}
        onConfirm={() => {
          if (deletingRule) {
            handleDeleteRule(deletingRule);
            setDeletingRule(null);
          }
        }}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف قاعدة العمولة لصنف "${deletingRule?.category}"؟`}
      />
    </div>
  );
}