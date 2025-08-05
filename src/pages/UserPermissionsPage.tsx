import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  RefreshCw, 
  FileText, 
  Shield, 
  ShieldAlert, 
  Calculator, 
  X, 
  Check, 
  Edit, 
  Save, 
  Filter,
  FileInput,
  Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { MultiSelect } from '../components/MultiSelect';
import clsx from 'clsx';

interface User {
  id: string;
  email: string;
  is_super_admin?: boolean;
  is_admin: boolean;
  is_financial_auditor: boolean;
  is_data_entry?: boolean;
  last_sign_in_at: string;
}

interface EditUserForm {
  id: string;
  email: string;
  is_super_admin: boolean;
  is_admin: boolean;
  is_financial_auditor: boolean;
  is_data_entry: boolean;
}

export function UserPermissionsPage() {
  const { t } = useTranslation();
  const { isAdmin, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<EditUserForm | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // Filters
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, roleFilter, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase.rpc('get_users_with_admin_status');

      if (error) throw error;
      
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('فشل في تحميل بيانات المستخدمين');
      toast.error('فشل في تحميل بيانات المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];
    
    // Apply role filter
    if (roleFilter.length > 0) {
      filtered = filtered.filter(user => {
        return (
          (roleFilter.includes('super_admin') && user.is_super_admin) ||
          (roleFilter.includes('admin') && user.is_admin) ||
          (roleFilter.includes('financial_auditor') && user.is_financial_auditor) ||
          (roleFilter.includes('data_entry') && user.is_data_entry)
        );
      });
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(term)
      );
    }
    
    setFilteredUsers(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers().finally(() => setRefreshing(false));
  };

  const handleEditUser = (user: User) => {
    setEditingUser({
      id: user.id,
      email: user.email,
      is_super_admin: user.is_super_admin || false,
      is_admin: user.is_admin,
      is_financial_auditor: user.is_financial_auditor,
      is_data_entry: user.is_data_entry || false
    });
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setEditingUser(null);
    setIsDrawerOpen(false);
  };

  const handleSaveUserRoles = async () => {
    if (!editingUser) return;
    
    try {
      setLoading(true);
      
      // Check if trying to modify fucurl@gmail.com
      if (editingUser.email === 'fucurl@gmail.com' && !editingUser.is_super_admin) {
        toast.error('لا يمكن تعديل صلاحيات مسؤول النظام');
        return;
      }
      
      // Call the RPC function to update user roles
      const { error } = await supabase.rpc('update_user_roles_v2', {
        p_user_id: editingUser.id,
        p_is_admin: editingUser.is_admin,
        p_is_financial_auditor: editingUser.is_financial_auditor,
        p_is_data_entry: editingUser.is_data_entry,
        p_is_super_admin: editingUser.is_super_admin
      });
      
      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.id === editingUser.id
          ? {
              ...user,
              is_admin: editingUser.is_admin,
              is_financial_auditor: editingUser.is_financial_auditor,
              is_data_entry: editingUser.is_data_entry,
              is_super_admin: editingUser.is_super_admin
            }
          : user
      ));
      
      toast.success('تم تحديث صلاحيات المستخدم بنجاح');
      handleCloseDrawer();
    } catch (err) {
      console.error('Error updating user roles:', err);
      setError('فشل في تحديث صلاحيات المستخدم');
      toast.error('فشل في تحديث صلاحيات المستخدم');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      if (user.email === 'fucurl@gmail.com') {
        toast.error('لا يمكن حذف حساب مسؤول النظام');
        return;
      }

      setLoading(true);
      
      // Delete user from admin_users table
      const { error: deleteError } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', user.id);
      
      if (deleteError) throw deleteError;
      
      // Update local state
      setUsers(users.filter(u => u.id !== user.id));
      
      toast.success('تم حذف صلاحيات المستخدم بنجاح');
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('فشل في حذف صلاحيات المستخدم');
    } finally {
      setLoading(false);
      setUserToDelete(null);
    }
  };

  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      
      // Prepare data for export
      const exportData = filteredUsers.map(user => ({
        'البريد الإلكتروني': user.email,
        'مشرف عام': user.is_super_admin ? 'نعم' : 'لا',
        'مشرف': user.is_admin ? 'نعم' : 'لا',
        'مدقق مالي': user.is_financial_auditor ? 'نعم' : 'لا',
        'إدخال بيانات': user.is_data_entry ? 'نعم' : 'لا',
        'آخر تسجيل دخول': user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '-'
      }));
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const colWidths = [
        { wch: 30 }, // البريد الإلكتروني
        { wch: 10 }, // مشرف عام
        { wch: 10 }, // مشرف
        { wch: 10 }, // مدقق مالي
        { wch: 10 }, // إدخال بيانات
        { wch: 20 }, // آخر تسجيل دخول
      ];
      ws['!cols'] = colWidths;
      
      // Add to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'صلاحيات المستخدمين');
      
      // Export
      XLSX.writeFile(wb, `صلاحيات_المستخدمين_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('تم تصدير البيانات بنجاح');
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      toast.error('فشل في تصدير البيانات');
    }
  };

  if (loading && !users.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">إدارة الصلاحيات</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm">تحديث</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm">تصدير Excel</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium">تصفية المستخدمين</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">البحث بالبريد الإلكتروني</label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="أدخل البريد الإلكتروني..."
                className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">تصفية حسب الصلاحية</label>
            <MultiSelect
              options={[
                { value: 'super_admin', label: 'مشرف عام' },
                { value: 'admin', label: 'مشرف' },
                { value: 'financial_auditor', label: 'مدقق مالي' },
                { value: 'data_entry', label: 'إدخال بيانات' }
              ]}
              value={roleFilter}
              onChange={setRoleFilter}
              placeholder="اختر الصلاحيات..."
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">البريد الإلكتروني</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">آخر تسجيل دخول</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">مشرف عام</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">مشرف</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">مدقق مالي</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">إدخال بيانات</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    لا توجد بيانات متاحة
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr 
                    key={user.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-sm">{user.email}</td>
                    <td className="px-6 py-4 text-sm">
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.is_super_admin ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.is_admin ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.is_financial_auditor ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.is_data_entry ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          disabled={user.is_super_admin && user.email === 'fucurl@gmail.com'}
                          className={clsx(
                            "flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors",
                            user.is_super_admin && user.email === 'fucurl@gmail.com'
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          )}
                        >
                          <Edit className="w-4 h-4" />
                          <span className="text-sm">تعديل الصلاحيات</span>
                        </button>
                        
                        {user.email !== 'fucurl@gmail.com' && (
                          <button
                            onClick={() => setUserToDelete(user)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            <span className="text-sm">حذف</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Drawer */}
      {isDrawerOpen && editingUser && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseDrawer}></div>
          
          <div className="absolute inset-y-0 left-0 max-w-md w-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-semibold">تعديل صلاحيات المستخدم</h3>
                <button
                  onClick={handleCloseDrawer}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
                    <input
                      type="text"
                      value={editingUser.email}
                      disabled
                      className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed text-gray-800"
                    />
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-lg font-medium mb-4">الصلاحيات</h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <ShieldAlert className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <h5 className="font-medium">مشرف عام</h5>
                            <p className="text-sm text-gray-500">صلاحيات كاملة للنظام</p>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={editingUser.is_super_admin}
                            disabled={editingUser.email === 'fucurl@gmail.com'}
                            onChange={(e) => setEditingUser({
                              ...editingUser,
                              is_super_admin: e.target.checked,
                              is_admin: e.target.checked ? true : editingUser.is_admin,
                              is_financial_auditor: e.target.checked ? editingUser.is_financial_auditor : editingUser.is_financial_auditor
                            })}
                            className="sr-only"
                            id="super-admin-toggle"
                          />
                          <label
                            htmlFor="super-admin-toggle"
                            className={clsx(
                              "block w-14 h-8 rounded-full transition-colors cursor-pointer",
                              editingUser.is_super_admin ? "bg-purple-600" : "bg-gray-300",
                              editingUser.email === 'fucurl@gmail.com' && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <span
                              className={clsx(
                                "block w-6 h-6 mt-1 ml-1 bg-white rounded-full transition-transform",
                                editingUser.is_super_admin && "transform translate-x-6"
                              )}
                            ></span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Shield className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h5 className="font-medium">مشرف</h5>
                            <p className="text-sm text-gray-500">إدارة البيانات والمستخدمين</p>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={editingUser.is_admin}
                            disabled={editingUser.is_super_admin}
                            onChange={(e) => setEditingUser({
                              ...editingUser,
                              is_admin: e.target.checked,
                              is_financial_auditor: e.target.checked ? false : editingUser.is_financial_auditor,
                              is_data_entry: e.target.checked ? false : editingUser.is_data_entry
                            })}
                            className="sr-only"
                            id="admin-toggle"
                          />
                          <label
                            htmlFor="admin-toggle"
                            className={clsx(
                              "block w-14 h-8 rounded-full transition-colors cursor-pointer",
                              editingUser.is_admin ? "bg-blue-600" : "bg-gray-300",
                              editingUser.is_super_admin && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <span
                              className={clsx(
                                "block w-6 h-6 mt-1 ml-1 bg-white rounded-full transition-transform",
                                editingUser.is_admin && "transform translate-x-6"
                              )}
                            ></span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Calculator className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h5 className="font-medium">مدقق مالي</h5>
                            <p className="text-sm text-gray-500">إدارة التدقيق المالي وصافي المبيعات</p>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={editingUser.is_financial_auditor}
                            disabled={(editingUser.is_admin || editingUser.is_data_entry) && !editingUser.is_super_admin}
                            onChange={(e) => setEditingUser({
                              ...editingUser,
                              is_financial_auditor: e.target.checked,
                              is_admin: e.target.checked && !editingUser.is_super_admin ? false : editingUser.is_admin,
                              is_data_entry: e.target.checked && !editingUser.is_super_admin ? false : editingUser.is_data_entry
                            })}
                            className="sr-only"
                            id="financial-toggle"
                          />
                          <label
                            htmlFor="financial-toggle"
                            className={clsx(
                              "block w-14 h-8 rounded-full transition-colors cursor-pointer",
                              editingUser.is_financial_auditor ? "bg-green-600" : "bg-gray-300",
                              (editingUser.is_admin || editingUser.is_data_entry) && !editingUser.is_super_admin && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <span
                              className={clsx(
                                "block w-6 h-6 mt-1 ml-1 bg-white rounded-full transition-transform",
                                editingUser.is_financial_auditor && "transform translate-x-6"
                              )}
                            ></span>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <FileInput className="w-6 h-6 text-orange-600" />
                          </div>
                          <div>
                            <h5 className="font-medium">إدخال بيانات</h5>
                            <p className="text-sm text-gray-500">إدخال بيانات المبيعات والتحصيل</p>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={editingUser.is_data_entry}
                            disabled={(editingUser.is_admin || editingUser.is_financial_auditor) && !editingUser.is_super_admin}
                            onChange={(e) => setEditingUser({
                              ...editingUser,
                              is_data_entry: e.target.checked,
                              is_admin: e.target.checked && !editingUser.is_super_admin ? false : editingUser.is_admin,
                              is_financial_auditor: e.target.checked && !editingUser.is_super_admin ? false : editingUser.is_financial_auditor
                            })}
                            className="sr-only"
                            id="data-entry-toggle"
                          />
                          <label
                            htmlFor="data-entry-toggle"
                            className={clsx(
                              "block w-14 h-8 rounded-full transition-colors cursor-pointer",
                              editingUser.is_data_entry ? "bg-orange-600" : "bg-gray-300",
                              (editingUser.is_admin || editingUser.is_financial_auditor) && !editingUser.is_super_admin && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <span
                              className={clsx(
                                "block w-6 h-6 mt-1 ml-1 bg-white rounded-full transition-transform",
                                editingUser.is_data_entry && "transform translate-x-6"
                              )}
                            ></span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200">
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={handleCloseDrawer}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveUserRoles}
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={() => {
          if (userToDelete) {
            handleDeleteUser(userToDelete);
          }
        }}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف صلاحيات المستخدم ${userToDelete?.email}؟`}
      />
    </div>
  );
}