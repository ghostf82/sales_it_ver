import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Save, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';

interface Item {
  id: string;
  name: string;
}

export function BasicDataPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  const [companies, setCompanies] = useState<Item[]>([]);
  const [representatives, setRepresentatives] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Item[]>([]);
  
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newRepresentativeName, setNewRepresentativeName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      // Fetch representatives
      const { data: representativesData, error: representativesError } = await supabase
        .from('representatives')
        .select('id, name')
        .order('name');

      if (representativesError) throw representativesError;
      setRepresentatives(representativesData || []);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!newCompanyName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('companies')
        .insert([{ name: newCompanyName.trim() }])
        .select()
        .single();

      if (error) throw error;

      setCompanies([...companies, data]);
      setNewCompanyName('');
      toast.success('تم إضافة الشركة بنجاح');
    } catch (err) {
      console.error('Error saving company:', err);
      toast.error('فشل في حفظ الشركة');
    }
  };

  const handleSaveRepresentative = async () => {
    if (!newRepresentativeName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('representatives')
        .insert([{ name: newRepresentativeName.trim() }])
        .select()
        .single();

      if (error) throw error;

      setRepresentatives([...representatives, data]);
      setNewRepresentativeName('');
      toast.success('تم إضافة المندوب بنجاح');
    } catch (err) {
      console.error('Error saving representative:', err);
      toast.error('فشل في حفظ المندوب');
    }
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: newCategoryName.trim() }])
        .select()
        .single();

      if (error) throw error;

      setCategories([...categories, data]);
      setNewCategoryName('');
      toast.success('تم إضافة الصنف بنجاح');
    } catch (err) {
      console.error('Error saving category:', err);
      toast.error('فشل في حفظ الصنف');
    }
  };

  const handleEditCompany = async (company: Item) => {
    const updatedName = prompt('أدخل اسم الشركة الجديد:', company.name);
    if (!updatedName || updatedName.trim() === '') return;

    try {
      const { error } = await supabase
        .from('companies')
        .update({ name: updatedName.trim() })
        .eq('id', company.id);

      if (error) throw error;

      setCompanies(companies.map(c => 
        c.id === company.id ? { ...c, name: updatedName.trim() } : c
      ));
      toast.success('تم تحديث الشركة بنجاح');
    } catch (err) {
      console.error('Error updating company:', err);
      toast.error('فشل في تحديث الشركة');
    }
  };

  const handleEditRepresentative = async (representative: Item) => {
    const updatedName = prompt('أدخل اسم المندوب الجديد:', representative.name);
    if (!updatedName || updatedName.trim() === '') return;

    try {
      const { error } = await supabase
        .from('representatives')
        .update({ name: updatedName.trim() })
        .eq('id', representative.id);

      if (error) throw error;

      setRepresentatives(representatives.map(r => 
        r.id === representative.id ? { ...r, name: updatedName.trim() } : r
      ));
      toast.success('تم تحديث المندوب بنجاح');
    } catch (err) {
      console.error('Error updating representative:', err);
      toast.error('فشل في تحديث المندوب');
    }
  };

  const handleEditCategory = async (category: Item) => {
    const updatedName = prompt('أدخل اسم الصنف الجديد:', category.name);
    if (!updatedName || updatedName.trim() === '') return;

    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: updatedName.trim() })
        .eq('id', category.id);

      if (error) throw error;

      setCategories(categories.map(c => 
        c.id === category.id ? { ...c, name: updatedName.trim() } : c
      ));
      toast.success('تم تحديث الصنف بنجاح');
    } catch (err) {
      console.error('Error updating category:', err);
      toast.error('فشل في تحديث الصنف');
    }
  };

  const handleDeleteCompany = async (company: Item) => {
    if (!confirm('هل أنت متأكد من حذف هذه الشركة؟')) return;

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', company.id);

      if (error) throw error;

      setCompanies(companies.filter(c => c.id !== company.id));
      toast.success('تم حذف الشركة بنجاح');
    } catch (err) {
      console.error('Error deleting company:', err);
      toast.error('فشل في حذف الشركة');
    }
  };

  const handleDeleteRepresentative = async (representative: Item) => {
    if (!confirm('هل أنت متأكد من حذف هذا المندوب؟')) return;

    try {
      const { error } = await supabase
        .from('representatives')
        .delete()
        .eq('id', representative.id);

      if (error) throw error;

      setRepresentatives(representatives.filter(r => r.id !== representative.id));
      toast.success('تم حذف المندوب بنجاح');
    } catch (err) {
      console.error('Error deleting representative:', err);
      toast.error('فشل في حذف المندوب');
    }
  };

  const handleDeleteCategory = async (category: Item) => {
    if (!confirm('هل أنت متأكد من حذف هذا الصنف؟')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;

      setCategories(categories.filter(c => c.id !== category.id));
      toast.success('تم حذف الصنف بنجاح');
    } catch (err) {
      console.error('Error deleting category:', err);
      toast.error('فشل في حذف الصنف');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, handler: () => void) => {
    if (e.key === 'Enter') {
      handler();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">صلاحية المشرف فقط</h2>
          <p className="text-gray-600 mb-6">
            يمكن للمشرفين فقط إدارة البيانات الأساسية
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
        <h2 className="text-3xl font-bold">إدارة البيانات الأساسية</h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Categories Section */}
        <div className="space-y-6 bg-gray-50 p-6 rounded-xl">
          <h3 className="text-xl font-semibold border-b pb-4 mb-6">
            الأصناف
          </h3>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleSaveCategory)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل اسم الصنف"
              />
              <button
                onClick={handleSaveCategory}
                disabled={!newCategoryName.trim()}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                حفظ
              </button>
            </div>

            <div className="space-y-2 mt-6">
              {categories.length === 0 ? (
                <p className="text-gray-500 text-center py-4 bg-white rounded-lg">
                  لم يتم إضافة أصناف بعد
                </p>
              ) : (
                categories.map(category => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                  >
                    <span className="font-medium">{category.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Representatives Section */}
        <div className="space-y-6 bg-gray-50 p-6 rounded-xl">
          <h3 className="text-xl font-semibold border-b pb-4 mb-6">
            المناديب
          </h3>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={newRepresentativeName}
                onChange={(e) => setNewRepresentativeName(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleSaveRepresentative)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل اسم المندوب"
              />
              <button
                onClick={handleSaveRepresentative}
                disabled={!newRepresentativeName.trim()}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                حفظ
              </button>
            </div>

            <div className="space-y-2 mt-6">
              {representatives.length === 0 ? (
                <p className="text-gray-500 text-center py-4 bg-white rounded-lg">
                  لم يتم إضافة مناديب بعد
                </p>
              ) : (
                representatives.map(representative => (
                  <div
                    key={representative.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                  >
                    <span className="font-medium">{representative.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditRepresentative(representative)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRepresentative(representative)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Companies Section */}
        <div className="space-y-6 bg-gray-50 p-6 rounded-xl">
          <h3 className="text-xl font-semibold border-b pb-4 mb-6">
            الشركات
          </h3>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleSaveCompany)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل اسم الشركة"
              />
              <button
                onClick={handleSaveCompany}
                disabled={!newCompanyName.trim()}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                حفظ
              </button>
            </div>

            <div className="space-y-2 mt-6">
              {companies.length === 0 ? (
                <p className="text-gray-500 text-center py-4 bg-white rounded-lg">
                  لم يتم إضافة شركات بعد
                </p>
              ) : (
                companies.map(company => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                  >
                    <span className="font-medium">{company.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditCompany(company)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCompany(company)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}