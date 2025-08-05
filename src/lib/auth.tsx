// lib/auth.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isFinancialAuditor: boolean;
  isSuperAdmin: boolean;
  isDataEntry: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isFinancialAuditor: false,
  isSuperAdmin: false,
  isDataEntry: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState({
    isAdmin: false,
    isFinancialAuditor: false,
    isSuperAdmin: false,
    isDataEntry: false,
  });

  const navigate = useNavigate();

  const extractRoles = (metadata: any) => ({
    isAdmin: metadata?.is_admin ?? false,
    isFinancialAuditor: metadata?.is_financial_auditor ?? false,
    isSuperAdmin: metadata?.is_super_admin ?? false,
    isDataEntry: metadata?.is_data_entry ?? false,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        navigate('/login');
        return;
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setRoles(extractRoles(currentUser?.user_metadata));
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event);

      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null);
        setRoles(extractRoles(null));
        navigate('/login');
        return;
      }

      if (event === 'TOKEN_REFRESHED' && !session) {
        console.log('❌ Token refresh failed');
        setUser(null);
        setRoles(extractRoles(null));
        navigate('/login');
        toast.error('جلستك انتهت. الرجاء تسجيل الدخول مرة أخرى.');
        return;
      }

      const updatedUser = session?.user ?? null;
      setUser(updatedUser);
      setRoles(extractRoles(updatedUser?.user_metadata));
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: roles.isAdmin,
        isFinancialAuditor: roles.isFinancialAuditor,
        isSuperAdmin: roles.isSuperAdmin,
        isDataEntry: roles.isDataEntry,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}