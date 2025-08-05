import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';

interface AddCommissionRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: NewCommissionRule) => Promise<void>;
  categories: { id: string; name: string }[];
  existingCategories: string[];
}

export interface NewCommissionRule {
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

export function AddCommissionRuleModal({ isOpen, onClose, onSave, categories, existingCategories }: AddCommissionRuleModalProps) {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<NewCommissionRule>({
    category: '',
    tier1_from: 50,
    tier1_to: 70,
    tier1_rate: 0.0025,
    tier2_from: 71,
    tier2_to: 100,
    tier2_rate: 0.003,
    tier3_from: 101,
    tier3_rate: 0.004
  });

  const availableCategories = categories.filter(
    category => !existingCategories.includes(category.name)
  );

  const validateForm = () => {
    if (!formData.category) {
      throw new Error('Please select a category');
    }

    if (!isAdmin) {
      throw new Error('Only administrators can modify commission rules');
    }

    // Validate tier ranges
    if (formData.tier1_from >= formData.tier1_to) {
      throw new Error('Tier 1: "From" value must be less than "To" value');
    }

    if (formData.tier2_from >= formData.tier2_to) {
      throw new Error('Tier 2: "From" value must be less than "To" value');
    }

    if (formData.tier1_to >= formData.tier2_from) {
      throw new Error('Tier 1 "To" value must be less than Tier 2 "From" value');
    }

    if (formData.tier2_to >= formData.tier3_from) {
      throw new Error('Tier 2 "To" value must be less than Tier 3 "From" value');
    }

    // Validate rates
    if (formData.tier1_rate <= 0 || formData.tier2_rate <= 0 || formData.tier3_rate <= 0) {
      throw new Error('All rates must be greater than 0');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      validateForm();
      setLoading(true);
      await onSave(formData);
      toast.success('Commission rule saved successfully');
      onClose();
    } catch (err) {
      console.error('Error saving rule:', err);
      setError(err instanceof Error ? err.message : 'Failed to save rule');
      toast.error('Failed to save commission rule');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof NewCommissionRule, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'category' ? value : (parseFloat(value) || 0)
    }));
    setError('');
  };

  // If not an admin, show access denied message
  if (!isAdmin) {
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title className="text-xl font-semibold">
                      Access Denied
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
                    Only administrators can modify commission rules
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      {t('basicData.cancel')}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  }

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
                    Add Commission Rule
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
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select a category</option>
                      {availableCategories.map(category => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tier 1 */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Tier 1</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            From %
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            max="100"
                            step="1"
                            value={formData.tier1_from}
                            onChange={(e) => handleInputChange('tier1_from', e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            To %
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            max="100"
                            step="1"
                            value={formData.tier1_to}
                            onChange={(e) => handleInputChange('tier1_to', e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Rate
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.0001"
                          value={formData.tier1_rate}
                          onChange={(e) => handleInputChange('tier1_rate', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Tier 2 */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Tier 2</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            From %
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            max="100"
                            step="1"
                            value={formData.tier2_from}
                            onChange={(e) => handleInputChange('tier2_from', e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            To %
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            max="100"
                            step="1"
                            value={formData.tier2_to}
                            onChange={(e) => handleInputChange('tier2_to', e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Rate
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.0001"
                          value={formData.tier2_rate}
                          onChange={(e) => handleInputChange('tier2_rate', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Tier 3 */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Tier 3</h4>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          From %
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="1"
                          value={formData.tier3_from}
                          onChange={(e) => handleInputChange('tier3_from', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Rate
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.0001"
                          value={formData.tier3_rate}
                          onChange={(e) => handleInputChange('tier3_rate', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      {t('basicData.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : t('basicData.save')}
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