import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { NumberInput } from './NumberInput';
import { toEnglishDigits, parseNumber, formatNumber } from '../utils/numberUtils';

interface CollectionEntryFormProps {
  representativeId: string;
  representativeName: string;
  companyId: string;
  year: number;
  month: number;
  onSave: () => void;
}

export function CollectionEntryForm({
  representativeId,
  representativeName,
  companyId,
  year,
  month,
  onSave
}: CollectionEntryFormProps) {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingRecord, setExistingRecord] = useState<{
    collection_amount: number;
    is_editable: boolean;
  } | null>(null);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    checkExistingRecord();
  }, [representativeId, year, month]);

  const checkExistingRecord = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .rpc('get_collection_amount', {
          p_representative_id: representativeId,
          p_year: year,
          p_month: month
        });

      if (error) throw error;

      if (data && data.length > 0) {
        setExistingRecord(data[0]);
        setAmount(data[0].collection_amount.toString());
      } else {
        setExistingRecord(null);
        setAmount('');
      }
    } catch (err) {
      console.error('Error checking collection record:', err);
      setError('Failed to check existing collection record');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);

      // Convert to English digits and parse
      const englishDigits = toEnglishDigits(amount);
      const numericAmount = parseNumber(englishDigits);

      if (isNaN(numericAmount) || numericAmount < 0) {
        throw new Error('Please enter a valid non-negative amount');
      }

      // Check if we're updating or inserting
      if (existingRecord) {
        if (!isAdmin) {
          throw new Error('Only administrators can modify existing collection records');
        }

        const { error: updateError } = await supabase
          .from('collection_records')
          .update({ amount: numericAmount })
          .eq('representative_id', representativeId)
          .eq('year', year)
          .eq('month', month);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('collection_records')
          .insert({
            representative_id: representativeId,
            company_id: companyId,
            year,
            month,
            amount: numericAmount
          });

        if (insertError) throw insertError;
      }

      toast.success('Collection record saved successfully');
      onSave();
    } catch (err) {
      console.error('Error saving collection record:', err);
      setError(err instanceof Error ? err.message : 'Failed to save collection record');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setAmount(value);
    setError('');
  };

  const handleBlur = () => {
    try {
      const numericAmount = parseNumber(amount);
      if (!isNaN(numericAmount) && numericAmount >= 0) {
        setAmount(formatNumber(numericAmount));
      }
    } catch (err) {
      console.error('Error formatting amount:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">
          المندوب
        </label>
        <input
          type="text"
          value={representativeName}
          disabled
          className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            السنة
          </label>
          <input
            type="text"
            value={year}
            disabled
            className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            الشهر
          </label>
          <input
            type="text"
            value={t(`months.${month - 1}`)}
            disabled
            className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          قيمة التحصيل
        </label>
        <NumberInput
          value={amount}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={existingRecord && !isAdmin}
          placeholder="أدخل قيمة التحصيل"
          className={existingRecord && !isAdmin ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}
        />
        {existingRecord && !isAdmin && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            فقط المشرفين يمكنهم تعديل التحصيل
          </p>
        )}
      </div>

      {existingRecord && !isAdmin ? null : (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      )}
    </form>
  );
}