import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import { ExcelImport } from '../components/ExcelImport';
import { NumberInput } from '../components/NumberInput';
import { toEnglishDigits, parseNumber, formatNumber } from '../utils/numberUtils';

interface Company {
  id: string;
  name: string;
}

interface Representative {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface FormData {
  year: number;
  month: number;
  companyId: string;
  representativeId: string;
  category: string;
  sales: string;
  target: string;
  collection: string;
}

interface CollectionRecord {
  amount: number;
}

// Generate years array
const years = Array.from({ length: 8 }, (_, i) => 2023 + i);

// Generate months array with Arabic names
const months = [
  { value: 1, label: 'يناير' },
  { value: 2, label: 'فبراير' },
  { value: 3, label: 'مارس' },
  { value: 4, label: 'أبريل' },
  { value: 5, label: 'مايو' },
  { value: 6, label: 'يونيو' },
  { value: 7, label: 'يوليو' },
  { value: 8, label: 'أغسطس' },
  { value: 9, label: 'سبتمبر' },
  { value: 10, label: 'أكتوبر' },
  { value: 11, label: 'نوفمبر' },
  { value: 12, label: 'ديسمبر' }
];

export function DataEntryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [existingCollection, setExistingCollection] = useState<CollectionRecord | null>(null);
  const [existingRecord, setExistingRecord] = useState<{ id: string } | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
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

  useEffect(() => {
    // Fetch existing collection and representative data when criteria are selected
    if (formData.representativeId && formData.year && formData.month && formData.category) {
      fetchExistingData();
    }
  }, [formData.representativeId, formData.year, formData.month, formData.category]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      // Check if user is authenticated
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) throw new Error('Authentication error: ' + authError.message);
      if (!session) throw new Error('No active session');

      // Fetch companies with error handling
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (companiesError) throw new Error('Error fetching companies: ' + companiesError.message);
      setCompanies(companiesData || []);

      // Fetch representatives with error handling
      const { data: representativesData, error: representativesError } = await supabase
        .from('representatives')
        .select('id, name')
        .order('name');

      if (representativesError) throw new Error('Error fetching representatives: ' + representativesError.message);
      setRepresentatives(representativesData || []);

      // Fetch categories with error handling
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (categoriesError) throw new Error('Error fetching categories: ' + categoriesError.message);
      setCategories(categoriesData || []);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'فشل في تحميل البيانات');
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingData = async () => {
    try {
      // Fetch existing collection record
      const { data: collectionData, error: collectionError } = await supabase
        .from('collection_records')
        .select('amount')
        .eq('representative_id', formData.representativeId)
        .eq('year', formData.year)
        .eq('month', formData.month)
        .limit(1)
        .maybeSingle();

      if (collectionError) throw collectionError;

      if (collectionData) {
        setExistingCollection(collectionData);
        setFormData(prev => ({
          ...prev,
          collection: formatNumber(collectionData.amount)
        }));
      } else {
        setExistingCollection(null);
        setFormData(prev => ({
          ...prev,
          collection: ''
        }));
      }

      // Fetch existing representative data
      const { data: repData, error: repError } = await supabase
        .from('representative_data')
        .select('id, sales, target, company_id')
        .eq('representative_id', formData.representativeId)
        .eq('category', formData.category)
        .eq('year', formData.year)
        .eq('month', formData.month)
        .limit(1)
        .maybeSingle();

      if (repError) throw repError;

      if (repData) {
        setExistingRecord(repData);
        setFormData(prev => ({
          ...prev,
          sales: formatNumber(repData.sales),
          target: formatNumber(repData.target),
          companyId: repData.company_id
        }));
      } else {
        setExistingRecord(null);
      }
    } catch (err) {
      console.error('Error fetching existing data:', err);
      toast.error('فشل في تحميل البيانات الموجودة');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'month' ? parseInt(value) : value
    }));

    // Auto advance to next step
    if (name === 'companyId' && value) {
      setStep(2);
    }
  };

  const handleNumberInputChange = (field: 'sales' | 'target' | 'collection', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyId || !formData.representativeId) {
      setError('الرجاء اختيار الشركة والمندوب');
      return;
    }

    try {
      setLoading(true);

      // Parse numeric values ensuring English digits
      const salesValue = parseNumber(formData.sales);
      const targetValue = parseNumber(formData.target);
      const collectionValue = formData.collection ? parseNumber(formData.collection) : 0;
      
      if (isNaN(salesValue) || isNaN(targetValue) || (formData.collection && isNaN(collectionValue))) {
        throw new Error('الرجاء إدخال قيم رقمية صحيحة');
      }

      const repData = {
        year: formData.year,
        month: formData.month,
        company_id: formData.companyId,
        representative_id: formData.representativeId,
        category: formData.category,
        sales: salesValue,
        target: targetValue
      };

      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('representative_data')
          .update(repData)
          .eq('id', existingRecord.id);

        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('representative_data')
          .insert([repData]);

        if (insertError) throw insertError;
      }

      // Handle collection if provided and no existing collection or user is admin
      if (formData.collection && (!existingCollection || isAdmin)) {
        const collectionData = {
          representative_id: formData.representativeId,
          company_id: formData.companyId,
          year: formData.year,
          month: formData.month,
          amount: collectionValue,
          updated_by: user?.id
        };

        if (existingCollection) {
          // Update existing collection
          const { error: updateError } = await supabase
            .from('collection_records')
            .update(collectionData)
            .eq('representative_id', formData.representativeId)
            .eq('year', formData.year)
            .eq('month', formData.month);

          if (updateError) throw updateError;
        } else {
          // Insert new collection
          const { error: insertError } = await supabase
            .from('collection_records')
            .insert([collectionData]);

          if (insertError) throw insertError;
        }
      }

      toast.success('تم حفظ البيانات بنجاح');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving data:', err);
      setError('فشل في حفظ البيانات');
    } finally {
      setLoading(false);
    }
  };

  const canProceedToStep3 = () => {
    return formData.year && formData.month && formData.representativeId;
  };

  const canSubmit = () => {
    return formData.category && formData.sales && formData.target;
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
        <h2 className="text-3xl font-bold">إدخال البيانات</h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-8">
        <ExcelImport
          onSuccess={fetchData}
          companies={companies}
          representatives={representatives}
          categories={categories}
        />

        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Company Selection */}
            <div className={`transition-all duration-300 ${step !== 1 ? 'opacity-50' : ''}`}>
              <h3 className="text-xl font-semibold mb-4">1. اختيار الشركة</h3>
              <div>
                <label className="block text-sm font-medium mb-2">
                  اسم الشركة
                </label>
                <select
                  name="companyId"
                  required
                  value={formData.companyId}
                  onChange={handleInputChange}
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
            </div>

            {/* Step 2: Year, Month, and Representative */}
            {step >= 2 && (
              <div className={`transition-all duration-300 ${step !== 2 ? 'opacity-50' : ''}`}>
                <h3 className="text-xl font-semibold mb-4">2. معلومات المندوب والفترة</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      السنة
                    </label>
                    <select
                      name="year"
                      required
                      value={formData.year}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                    >
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      الشهر
                    </label>
                    <select
                      name="month"
                      required
                      value={formData.month}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                    >
                      {months.map(month => (
                        <option key={month.value} value={month.value}>
                          {month.label}
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
                      onChange={(e) => {
                        handleInputChange(e);
                        if (e.target.value) {
                          setStep(3);
                        }
                      }}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                    >
                      <option value="">اختر المندوب</option>
                      {representatives.map(representative => (
                        <option key={representative.id} value={representative.id}>
                          {representative.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Performance Data */}
            {step >= 3 && canProceedToStep3() && (
              <div className="transition-all duration-300">
                <h3 className="text-xl font-semibold mb-4">3. بيانات الأداء</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      الصنف
                    </label>
                    <select
                      name="category"
                      required
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                    >
                      <option value="">اختر الصنف</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      الهدف
                    </label>
                    <NumberInput
                      value={formData.target}
                      onChange={(value) => handleNumberInputChange('target', value)}
                      required
                      min={0}
                      placeholder="أدخل قيمة الهدف"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      المبيعات
                    </label>
                    <NumberInput
                      value={formData.sales}
                      onChange={(value) => handleNumberInputChange('sales', value)}
                      required
                      min={0}
                      placeholder="أدخل قيمة المبيعات"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium">
                        التحصيل
                      </label>
                      <div className="relative group">
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                        <div className="absolute bottom-full mb-2 p-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap right-0">
                          هذا الحقل يمثل إجمالي المبلغ المحصل من المندوب لجميع الأصناف في هذا الشهر. يمكن تعديله من قبل المشرفين فقط.
                        </div>
                      </div>
                    </div>
                    <NumberInput
                      value={formData.collection}
                      onChange={(value) => handleNumberInputChange('collection', value)}
                      disabled={existingCollection !== null && !isAdmin}
                      min={0}
                      placeholder="أدخل قيمة التحصيل"
                      className={existingCollection !== null && !isAdmin ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}
                    />
                    {existingCollection !== null && !isAdmin && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        تم إدخال قيمة التحصيل لهذا الشهر. فقط المشرفين يمكنهم تعديلها.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            {step === 3 && canProceedToStep3() && canSubmit() && (
              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'جاري الحفظ...' : existingRecord ? 'تحديث البيانات' : 'حفظ البيانات'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}