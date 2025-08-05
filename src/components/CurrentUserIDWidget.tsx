import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export function CurrentUserIDWidget() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        
        setUserId(user?.id || null);
      } catch (error) {
        console.error('Error fetching user ID:', error);
        toast.error('فشل في جلب معرف المستخدم');
      } finally {
        setLoading(false);
      }
    };

    fetchUserId();
  }, []);

  return (
    <div className="max-w-md mx-auto mt-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">معرف المستخدم الحالي</h2>
        {loading ? (
          <Loader2 className="animate-spin w-6 h-6 mx-auto text-gray-500 dark:text-gray-400" />
        ) : (
          <div className="text-sm break-all bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg font-mono">
            {userId || 'غير معروف'}
          </div>
        )}
      </div>
    </div>
  );
}