import { useState } from 'react';
import { Upload, Download, FileText, AlertCircle } from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { toEnglishDigits, parseNumber } from '../utils/numberUtils';

interface ExcelImportProps {
  onSuccess: () => void;
  companies: { id: string; name: string }[];
  representatives: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}

interface ExcelRow {
  الشركة: string;
  المندوب: string;
  الصنف: string;
  السنة: number;
  الشهر: number;
  المبيعات: number;
  الهدف: number;
  التحصيل?: number; // Optional collection amount
}

interface ValidatedData {
  company_id: string;
  representative_id: string;
  category: string;
  year: number;
  month: number;
  sales: number;
  target: number;
  collection?: number;
}

interface CollectionGroup {
  representative_id: string;
  company_id: string;
  year: number;
  month: number;
  amount: number;
}

export function ExcelImport({ onSuccess, companies, representatives, categories }: ExcelImportProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateRow = (row: ExcelRow, rowIndex: number): ValidatedData => {
    const errors: string[] = [];

    // Convert any non-English digits to English
    const year = typeof row.السنة === 'string' ? parseNumber(toEnglishDigits(row.السنة)) : row.السنة;
    const month = typeof row.الشهر === 'string' ? parseNumber(toEnglishDigits(row.الشهر)) : row.الشهر;
    const sales = typeof row.المبيعات === 'string' ? parseNumber(toEnglishDigits(row.المبيعات)) : row.المبيعات;
    const target = typeof row.الهدف === 'string' ? parseNumber(toEnglishDigits(row.الهدف)) : row.الهدف;
    const collection = row.التحصيل !== undefined ? 
      (typeof row.التحصيل === 'string' ? parseNumber(toEnglishDigits(row.التحصيل)) : row.التحصيل) : 
      undefined;

    // Validate company
    const company = companies.find(c => c.name === row.الشركة);
    if (!company) {
      errors.push(`الشركة "${row.الشركة}" غير موجودة`);
    }

    // Validate representative
    const representative = representatives.find(r => r.name === row.المندوب);
    if (!representative) {
      errors.push(`المندوب "${row.المندوب}" غير موجود`);
    }

    // Validate category
    const category = categories.find(c => c.name === row.الصنف);
    if (!category) {
      errors.push(`الصنف "${row.الصنف}" غير موجود`);
    }

    // Validate year
    if (!year || isNaN(year) || year < 2023 || year > 2030) {
      errors.push('السنة يجب أن تكون بين 2023 و 2030');
    }

    // Validate month
    if (!month || isNaN(month) || month < 1 || month > 12) {
      errors.push('الشهر يجب أن يكون بين 1 و 12');
    }

    // Validate sales and target
    if (isNaN(sales) || sales < 0) {
      errors.push('المبيعات يجب أن تكون رقماً موجباً');
    }
    if (isNaN(target) || target < 0) {
      errors.push('الهدف يجب أن يكون رقماً موجباً');
    }

    // Validate collection if provided
    if (collection !== undefined && (isNaN(collection) || collection < 0)) {
      errors.push('التحصيل يجب أن يكون رقماً موجباً');
    }

    if (errors.length > 0) {
      throw new Error(`أخطاء في السطر ${rowIndex + 1}:\n${errors.join('\n')}`);
    }

    return {
      company_id: company!.id,
      representative_id: representative!.id,
      category: row.الصنف,
      year,
      month,
      sales,
      target,
      collection
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError('');

      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = utils.sheet_to_json<ExcelRow>(worksheet);

      if (rows.length === 0) {
        throw new Error('الملف فارغ');
      }

      // Validate and transform data
      const validatedData = rows.map((row, index) => validateRow(row, index));

      // Group collection records by representative/month/year
      const collectionGroups = new Map<string, CollectionGroup>();

      // Process collection records
      validatedData.forEach(data => {
        if (data.collection !== undefined) {
          const key = `${data.representative_id}-${data.year}-${data.month}`;
          if (!collectionGroups.has(key)) {
            collectionGroups.set(key, {
              representative_id: data.representative_id,
              company_id: data.company_id,
              year: data.year,
              month: data.month,
              amount: data.collection
            });
          }
        }
      });

      // Prepare representative data (without collection)
      const repData = validatedData.map(({ collection, ...data }) => data);

      // Process each record individually to handle updates
      for (const data of repData) {
        // Check if record exists
        const { data: existingRecord } = await supabase
          .from('representative_data')
          .select('id')
          .eq('representative_id', data.representative_id)
          .eq('category', data.category)
          .eq('year', data.year)
          .eq('month', data.month)
          .single();

        if (existingRecord) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('representative_data')
            .update({
              company_id: data.company_id,
              sales: data.sales,
              target: data.target
            })
            .eq('id', existingRecord.id);

          if (updateError) throw updateError;
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from('representative_data')
            .insert([data]);

          if (insertError) throw insertError;
        }
      }

      // Process collection records
      for (const collection of collectionGroups.values()) {
        // Check if collection record exists
        const { data: existingCollection } = await supabase
          .from('collection_records')
          .select('id')
          .eq('representative_id', collection.representative_id)
          .eq('year', collection.year)
          .eq('month', collection.month)
          .single();

        if (existingCollection) {
          // Update existing collection
          const { error: updateError } = await supabase
            .from('collection_records')
            .update({
              company_id: collection.company_id,
              amount: collection.amount
            })
            .eq('id', existingCollection.id);

          if (updateError) throw updateError;
        } else {
          // Insert new collection
          const { error: insertError } = await supabase
            .from('collection_records')
            .insert([collection]);

          if (insertError) throw insertError;
        }
      }

      toast.success('تم استيراد البيانات بنجاح');
      onSuccess();

      // Reset file input
      event.target.value = '';
    } catch (err) {
      console.error('Error importing Excel:', err);
      setError(err instanceof Error ? err.message : 'فشل في استيراد الملف');
      toast.error('فشل في استيراد البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setLoading(true);

      // Fetch data from Supabase
      const { data, error } = await supabase
        .from('representative_data')
        .select(`
          company:company_id(name),
          representative:representative_id(name),
          category,
          year,
          month,
          sales,
          target
        `)
        .order('year', { ascending: false })
        .order('month', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error('لا توجد بيانات للتصدير');
        return;
      }

      // Transform data for Excel
      const excelData = data.map(row => ({
        'الشركة': row.company.name,
        'المندوب': row.representative.name,
        'الصنف': row.category,
        'السنة': row.year,
        'الشهر': row.month,
        'المبيعات': row.sales,
        'الهدف': row.target
      }));

      // Create workbook and worksheet
      const wb = utils.book_new();
      const ws = utils.json_to_sheet(excelData);

      // Add column widths
      ws['!cols'] = [
        { wch: 20 }, // الشركة
        { wch: 20 }, // المندوب
        { wch: 15 }, // الصنف
        { wch: 10 }, // السنة
        { wch: 10 }, // الشهر
        { wch: 15 }, // المبيعات
        { wch: 15 }  // الهدف
      ];

      utils.book_append_sheet(wb, ws, 'البيانات');

      // Save file
      writeFile(wb, 'بيانات_المبيعات.xlsx');
      toast.success('تم تصدير البيانات بنجاح');
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      toast.error('فشل في تصدير البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus-within:ring-4 focus-within:ring-green-300 transition-colors cursor-pointer">
          <Upload className="w-5 h-5" />
          <span>استيراد من Excel</span>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={loading}
            className="hidden"
          />
        </label>

        <button
          onClick={handleExportExcel}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors disabled:opacity-50"
        >
          <FileText className="w-5 h-5" />
          <span>تصدير Excel</span>
        </button>

        {loading && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <pre className="whitespace-pre-wrap font-mono text-sm">{error}</pre>
          </div>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="font-medium mb-2">تنسيق ملف Excel المطلوب:</h4>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-right py-1">اسم العمود</th>
              <th className="text-right py-1">النوع</th>
              <th className="text-right py-1">ملاحظات</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 dark:text-gray-400">
            <tr>
              <td>الشركة</td>
              <td>نص</td>
              <td>يجب أن يكون اسم شركة موجود</td>
            </tr>
            <tr>
              <td>المندوب</td>
              <td>نص</td>
              <td>يجب أن يكون اسم مندوب موجود</td>
            </tr>
            <tr>
              <td>الصنف</td>
              <td>نص</td>
              <td>يجب أن يكون صنف موجود</td>
            </tr>
            <tr>
              <td>السنة</td>
              <td>رقم</td>
              <td>بين 2023 و 2030</td>
            </tr>
            <tr>
              <td>الشهر</td>
              <td>رقم</td>
              <td>بين 1 و 12</td>
            </tr>
            <tr>
              <td>المبيعات</td>
              <td>رقم</td>
              <td>رقم موجب</td>
            </tr>
            <tr>
              <td>الهدف</td>
              <td>رقم</td>
              <td>رقم موجب</td>
            </tr>
            <tr>
              <td>التحصيل</td>
              <td>رقم</td>
              <td>رقم موجب (اختياري) - يتم أخذ أول قيمة تحصيل للمندوب في الشهر فقط</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}