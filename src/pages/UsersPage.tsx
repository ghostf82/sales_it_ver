import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Shield, ShieldOff, Key, Trash2, Calculator } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { ConfirmDialog } from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  is_admin: boolean;
  is_financial_auditor: boolean;
  last_sign_in_at: string;
}

export function UsersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToToggleAdmin, setUserToToggleAdmin] = useState<User | null>(null);
  const [userToToggleFinancial, setUserToToggleFinancial] = useState<User | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_users_with_admin_status');
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
      toast.error(t('users.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (user: User) => {
    try {
      if (user.email === 'fucurl@gmail.com') {
        toast.error('لا يمكن تعديل صلاحيات مسؤول النظام');
        return;
      }

      const { error: updateError } = await supabase.rpc('update_user_roles', {
        user_id: user.id,
        is_admin: !user.is_admin,
        is_financial_auditor: user.is_financial_auditor
      });

      if (updateError) throw updateError;

      setUsers(users.map(u =>
        u.id === user.id
          ? { ...u, is_admin: !u.is_admin }
          : u
      ));

      toast.success(
        t(!user.is_admin ? 'users.adminAdded' : 'users.adminRemoved') +
        '. المستخدم يحتاج إلى تسجيل الخروج وإعادة تسجيل الدخول لتفعيل التغييرات.'
      );
    } catch (err) {
      console.error('Error toggling admin status:', err);
      toast.error(t('users.errorUpdating'));
    } finally {
      setUserToToggleAdmin(null);
    }
  };

  const handleToggleFinancial = async (user: User) => {
    try {
      if (user.email === 'fucurl@gmail.com') {
        toast.error('لا يمكن تعديل صلاحيات مسؤول النظام');
        return;
      }

      const { error: updateError } = await supabase.rpc('update_user_roles', {
        user_id: user.id,
        is_admin: user.is_admin,
        is_financial_auditor: !user.is_financial_auditor
      });

      if (updateError) throw updateError;

      setUsers(users.map(u =>
        u.id === user.id
          ? { ...u, is_financial_auditor: !u.is_financial_auditor }
          : u
      ));

      toast.success(
        !user.is_financial_auditor ? 'تم إضافة صلاحية المدقق المالي' : 'تم إزالة صلاحية المدقق المالي' +
        '. المستخدم يحتاج إلى تسجيل الخروج وإعادة تسجيل الدخول لتفعيل التغييرات.'
      );
    } catch (err) {
      console.error('Error toggling financial auditor status:', err);
      toast.error('فشل في تحديث صلاحيات المستخدم');
    } finally {
      setUserToToggleFinancial(null);
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      if (user.email === 'fucurl@gmail.com') {
        toast.error('لا يمكن حذف حساب مسؤول النظام');
        return;
      }

      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) throw error;
      setUsers(users.filter(u => u.id !== user.id));
      toast.success(t('users.deleted'));
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error(t('users.errorDeleting'));
    } finally {
      setUserToDelete(null);
    }
  };

  const handleResetPassword = async (user: User) => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password: '123456'
      });
      if (error) throw error;
      toast.success(t('users.passwordReset'));
    } catch (err) {
      console.error('Error resetting password:', err);
      toast.error(t('users.errorResetting'));
    } finally {
      setUserToResetPassword(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">{t('users.title')}</h2>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">{t('users.email')}</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">{t('users.role')}</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">مدقق مالي</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">{t('users.lastLogin')}</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">{t('users.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{user.email}</td>
                  <td className="px-6 py-4 text-sm">
                    {user.is_admin ? 'مشرف' : 'مستخدم'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {user.is_financial_auditor ? 'نعم' : 'لا'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleString()
                      : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      {user.email !== 'fucurl@gmail.com' && isAdmin && (
                        <button
                          onClick={() => setUserToToggleAdmin(user)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title={user.is_admin ? 'إزالة صلاحية المشرف' : 'تعيين كمشرف'}
                        >
                          {user.is_admin ? (
                            <ShieldOff className="w-5 h-5" />
                          ) : (
                            <Shield className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      {user.email !== 'fucurl@gmail.com' && isAdmin && (
                        <button
                          onClick={() => setUserToToggleFinancial(user)}
                          className="p-1 text-green-600 hover:text-green-800"
                          title={user.is_financial_auditor ? 'إزالة صلاحية المدقق المالي' : 'تعيين كمدقق مالي'}
                        >
                          <Calculator className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => setUserToResetPassword(user)}
                        className="p-1 text-yellow-600 hover:text-yellow-800"
                        title={t('users.resetPassword')}
                      >
                        <Key className="w-5 h-5" />
                      </button>
                      {user.email !== 'fucurl@gmail.com' && isAdmin && (
                        <button
                          onClick={() => setUserToDelete(user)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title={t('users.delete')}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {userToDelete && (
        <ConfirmDialog
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={() => handleDeleteUser(userToDelete)}
          title={t('users.confirmDelete')}
          message={t('users.confirmDeleteMessage', { email: userToDelete.email })}
        />
      )}

      {userToToggleAdmin && (
        <ConfirmDialog
          isOpen={!!userToToggleAdmin}
          onClose={() => setUserToToggleAdmin(null)}
          onConfirm={() => handleToggleAdmin(userToToggleAdmin)}
          title={userToToggleAdmin.is_admin ? t('users.confirmRemoveAdmin') : t('users.confirmMakeAdmin')}
          message={t(
            userToToggleAdmin.is_admin
              ? 'users.confirmRemoveAdminMessage'
              : 'users.confirmMakeAdminMessage',
            { email: userToToggleAdmin.email }
          )}
        />
      )}

      {userToToggleFinancial && (
        <ConfirmDialog
          isOpen={!!userToToggleFinancial}
          onClose={() => setUserToToggleFinancial(null)}
          onConfirm={() => handleToggleFinancial(userToToggleFinancial)}
          title={userToToggleFinancial.is_financial_auditor ? 'تأكيد إزالة صلاحية المدقق المالي' : 'تأكيد تعيين مدقق مالي'}
          message={
            userToToggleFinancial.is_financial_auditor
              ? `هل أنت متأكد من إزالة صلاحية المدقق المالي من ${userToToggleFinancial.email}؟`
              : `هل أنت متأكد من تعيين ${userToToggleFinancial.email} كمدقق مالي؟`
          }
        />
      )}

      {userToResetPassword && (
        <ConfirmDialog
          isOpen={!!userToResetPassword}
          onClose={() => setUserToResetPassword(null)}
          onConfirm={() => handleResetPassword(userToResetPassword)}
          title={t('users.confirmReset')}
          message={t('users.confirmResetMessage', { email: userToResetPassword.email })}
        />
      )}
    </div>
  );
}