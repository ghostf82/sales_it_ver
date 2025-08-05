'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantName, setTenantName] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !tenantName) {
      toast.error('يرجى تعبئة جميع الحقول');
      return;
    }

    // 1. تسجيل المستخدم في Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      toast.error(signUpError.message);
      return;
    }

    const user = signUpData.user;
    if (!user) {
      toast.error('لم يتم إنشاء المستخدم بنجاح');
      return;
    }

    const userId = user.id;

    // 2. إنشاء Tenant جديد
    const { data: tenantInsert, error: tenantError } = await supabase
      .from('tenants')
      .insert({ name: tenantName })
      .select()
      .single();

    if (tenantError) {
      toast.error('فشل إنشاء العميل');
      return;
    }

    const tenantId = tenantInsert.id;

    // 3. حفظ المستخدم كـ أدمن مرتبط بالعميل
    const { error: adminError } = await supabase.from('admin_users').insert({
      id: userId,
      email,
      is_admin: true,
      is_super_admin: false,
      is_financial_auditor: false,
      is_data_entry: false,
      tenant_id: tenantId,
    });

    if (adminError) {
      toast.error('فشل حفظ المستخدم في قاعدة البيانات');
      return;
    }

    toast.success('تم إنشاء الحساب بنجاح. تحقق من بريدك لتفعيل الحساب.');
    router.push('/login');
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="text-xl font-bold mb-6 text-center">تسجيل عميل جديد</h1>
      <Input placeholder="اسم العميل / الشركة الكبرى" value={tenantName} onChange={(e) => setTenantName(e.target.value)} className="mb-4" />
      <Input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-4" />
      <Input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} className="mb-4" />
      <Button onClick={handleRegister} className="w-full">تسجيل</Button>
    </div>
  );
}
