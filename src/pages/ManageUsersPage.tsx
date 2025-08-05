// ✅ صفحة إدارة المستخدمين من جدول app_users وربط صلاحياتهم من admin_users

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';

interface AppUser {
  id: string;
  email: string;
  full_name?: string;
  is_super_admin?: boolean;
  is_admin?: boolean;
  is_data_entry?: boolean;
  is_financial_auditor?: boolean;
}

export default function ManageUsersPage() {
  const { user } = useAuth();

  // ✅ حماية الصفحة للمشرف فقط
  if (!user?.email || !user.is_super_admin) {
    return <div className="p-6">غير مصرح لك بالدخول</div>;
  }

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: appUsers, error: userError } = await supabase
        .from('app_users')
        .select('id, email, full_name');

      if (userError) throw userError;

      const { data: adminUsers, error: adminError } = await supabase
        .from('admin_users')
        .select('*');

      if (adminError) throw adminError;

      const merged = appUsers.map(u => {
        const match = adminUsers.find(a => a.id === u.id);
        return {
          ...u,
          ...match
        };
      });

      setUsers(merged);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('فشل في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (id: string, role: keyof AppUser, value: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ [role]: value })
        .eq('id', id);

      if (error) throw error;

      toast.success('تم تحديث الصلاحيات');
      fetchUsers();
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error('فشل في تحديث الصلاحيات');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('admin_users').delete().eq('id', id);
      if (error) throw error;
      toast.success('تم حذف المستخدم من الصلاحيات');
      fetchUsers();
    } catch (err) {
      toast.error('فشل في الحذف');
    }
  };

  if (loading) return <div className="p-4">جاري التحميل...</div>;

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">إدارة المستخدمين</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">الإيميل</th>
            <th className="p-2">الاسم</th>
            <th className="p-2">Super Admin</th>
            <th className="p-2">Admin</th>
            <th className="p-2">Data Entry</th>
            <th className="p-2">Auditor</th>
            <th className="p-2">حذف</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="text-center border-t">
              <td className="p-2">{user.email}</td>
              <td className="p-2">{user.full_name || '-'}</td>
              {['is_super_admin', 'is_admin', 'is_data_entry', 'is_financial_auditor'].map(role => (
                <td key={role} className="p-2">
                  <input
                    type="checkbox"
                    checked={!!user[role as keyof AppUser]}
                    onChange={(e) => handleRoleChange(user.id, role as keyof AppUser, e.target.checked)}
                  />
                </td>
              ))}
              <td className="p-2">
                <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:underline">
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
