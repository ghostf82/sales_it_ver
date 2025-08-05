import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import { NumberInput } from './NumberInput';
import { toEnglishDigits, parseNumber, formatNumber } from '../utils/numberUtils';

interface EditDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    id: string;
    company: { id: string; name: string };
    representative: { id: string; name: string };
    category: string;
    sales: number;
    target: number;
    collection: number;
    year: number;
    month: number;
  };
  companies: { id: string; name: string }[];
  representatives: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  onSave: (data: EditFormData) => Promise<void>;
}

export interface EditFormData {
  id: string;
  company_id: string;
  representative_id: string;
  category: string;
  sales: string;
  target: string;
  collection: string;
  year: number;
  month: number;
}

export function EditDataModal({ isOpen, onClose, data, companies, representatives, categories, onSave }: EditDataModalProps) {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<EditFormData>({
    id: data.id,
    company_id: data.company.id,
    representative_id: data.representative.id,
    category: data.category,
    sales: formatNumber(data.sales),
    target: formatNumber(data.target),
    collection: formatNumber(data.collection),
    year: data.year,
    month: data.month
  });

  // Update form data when the modal data changes
  useEffect(() => {
    setFormData({
      id: data.id,
      company_id: data.company.id,
      representative_id: data.representative.id,
      category: data.category,
      sales: formatNumber(data.sales),
      target: formatNumber(data.target),
      collection: formatNumber(data.collection),
      year: data.year,
      month: data.month
    });
  }, [data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value) : value
    }));

    setError('');
  };

  const handleNumberChange = (field: 'sales' | 'target' | 'collection', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      
      // Validate numeric fields
      const salesValue = parseNumber(formData.sales);
      const targetValue = parseNumber(formData.target);
      const collectionValue = parseNumber(formData.collection);
      
      if (isNaN(salesValue) || isNaN(targetValue) || isNaN(collectionValue)) {
        throw new Error('Please enter valid numeric values');
      }
      
      if (salesValue < 0 || targetValue < 0 || collectionValue < 0) {
        throw new Error('Values cannot be negative');
      }
      
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error saving data:', err);
      setError(err instanceof Error ? err.message : 'Failed to save data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-xl font-semibold">
                    {t('edit')}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('company')}
                      </label>
                      <select
                        name="company_id"
                        required
                        value={formData.company_id}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {companies.map(company => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('representative')}
                      </label>
                      <select
                        name="representative_id"
                        required
                        value={formData.representative_id}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {representatives.map(rep => (
                          <option key={rep.id} value={rep.id}>
                            {rep.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('category')}
                      </label>
                      <select
                        name="category"
                        required
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('sales')}
                      </label>
                      <NumberInput
                        value={formData.sales}
                        onChange={(value) => handleNumberChange('sales', value)}
                        required
                        min={0}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('target')}
                      </label>
                      <NumberInput
                        value={formData.target}
                        onChange={(value) => handleNumberChange('target', value)}
                        required
                        min={0}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('collection')}
                      </label>
                      <NumberInput
                        value={formData.collection}
                        onChange={(value) => handleNumberChange('collection', value)}
                        disabled={!isAdmin}
                        min={0}
                        className={!isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''}
                      />
                      {!isAdmin && (
                        <p className="mt-1 text-sm text-gray-500">
                          فقط المشرفين يمكنهم تعديل التحصيل
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? 'جاري الحفظ...' : t('save')}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}