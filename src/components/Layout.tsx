import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  FileInput, 
  Users, 
  LogOut,
  Menu,
  X,
  Settings,
  BarChart,
  Calculator,
  DollarSign,
  ShieldAlert,
  FileText,
  Award
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import clsx from 'clsx';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  adminOnly?: boolean;
  financialOnly?: boolean;
  superAdminOnly?: boolean;
}

function NavItem({ to, icon, label, isActive, adminOnly = false, financialOnly = false, superAdminOnly = false }: NavItemProps) {
  const { isAdmin, isFinancialAuditor, isSuperAdmin } = useAuth();
  
  if ((adminOnly && !isAdmin) || (financialOnly && !isAdmin && !isFinancialAuditor) || (superAdminOnly && !isSuperAdmin)) {
    return null;
  }

  return (
    <Link
      to={to}
      className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 hover:bg-gray-100'
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!user) return <Outlet />;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white shadow-lg"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col items-center gap-4">
              <div className="w-28 h-28 sm:w-40 sm:h-40 flex items-center justify-center bg-white rounded-lg p-2">
                <img
                  src="/almudayfer-logo.png"
                  alt="شركة أبناء صالح المديفر القابضة"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-center">نظام إدارة العمولة</h1>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <NavItem to="/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" isActive={location.pathname === '/dashboard'} />
            <NavItem to="/test-dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard 2" isActive={location.pathname === '/test-dashboard'} />
            <NavItem to="/data-entry" icon={<FileInput className="w-5 h-5" />} label="إدخال البيانات" isActive={location.pathname === '/data-entry'} />
            <NavItem to="/analysis" icon={<BarChart className="w-5 h-5" />} label="المقارنة والتحليل" isActive={location.pathname === '/analysis'} />
            <NavItem to="/transactions" icon={<FileText className="w-5 h-5" />} label="تفاصيل العمليات" isActive={location.pathname === '/transactions'} />
            <NavItem to="/fair-performance" icon={<Award className="w-5 h-5" />} label="الأداء المتوازن" isActive={location.pathname === '/fair-performance'} />
            <NavItem to="/financial-audit" icon={<Calculator className="w-5 h-5" />} label="التدقيق المالي" isActive={location.pathname === '/financial-audit'} financialOnly />
            <NavItem to="/net-sales-summary" icon={<DollarSign className="w-5 h-5" />} label="ملخص صافي المبيعات" isActive={location.pathname === '/net-sales-summary'} financialOnly />
            <NavItem to="/basic-data" icon={<Users className="w-5 h-5" />} label="البيانات الأساسية" isActive={location.pathname === '/basic-data'} adminOnly />
            <NavItem to="/commission-settings" icon={<Settings className="w-5 h-5" />} label="إعدادات العمولات" isActive={location.pathname === '/commission-settings'} adminOnly />
            <NavItem to="/permissions" icon={<ShieldAlert className="w-5 h-5" />} label="إدارة الصلاحيات" isActive={location.pathname === '/permissions'} superAdminOnly />
          </nav>

          <div className="p-4 border-t border-gray-200 space-y-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      <main className={clsx('min-h-screen transition-all duration-200', 'lg:ml-64')}>
        <div className="max-w-[2000px] mx-auto p-3 sm:p-4 lg:p-8">
          <Outlet />
        </div>
        <footer className="py-4 px-6 border-t border-gray-200 mt-8">
          <div className="text-center text-xs sm:text-sm text-gray-600">
            <p>Prepared by: Mohamed Farag | Developed by: Fared Yousef</p>
          </div>
        </footer>
      </main>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
}