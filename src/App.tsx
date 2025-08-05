import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './i18n';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import { DataEntryPage } from './pages/DataEntryPage';
import { BasicDataPage } from './pages/BasicDataPage';
import { CommissionSettingsPage } from './pages/CommissionSettingsPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { FinancialAuditPage } from './pages/FinancialAuditPage';
import { NetSalesSummaryPage } from './pages/NetSalesSummaryPage';
import { UserPermissionsPage } from './pages/UserPermissionsPage';
import { TransactionsDetailsPage } from './pages/TransactionsDetailsPage';
import TestDashboard from './pages/TestDashboard';
import FairPerformancePage from './pages/FairPerformancePage';
import { AuthProvider, useAuth } from './lib/auth';
import { AdminRoute } from './components/AdminRoute';
import { FinancialRoute } from './components/FinancialRoute';
import { SuperAdminRoute } from './components/SuperAdminRoute';
import { Toaster } from 'react-hot-toast';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard\" replace />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="test-dashboard" element={
              <ProtectedRoute>
                <TestDashboard />
              </ProtectedRoute>
            } />
            <Route path="data-entry" element={
              <ProtectedRoute>
                <DataEntryPage />
              </ProtectedRoute>
            } />
            <Route path="basic-data" element={
              <ProtectedRoute>
                <AdminRoute>
                  <BasicDataPage />
                </AdminRoute>
              </ProtectedRoute>
            } />
            <Route path="commission-settings" element={
              <ProtectedRoute>
                <AdminRoute>
                  <CommissionSettingsPage />
                </AdminRoute>
              </ProtectedRoute>
            } />
            <Route path="analysis" element={
              <ProtectedRoute>
                <AnalysisPage />
              </ProtectedRoute>
            } />
            <Route path="financial-audit" element={
              <ProtectedRoute>
                <FinancialRoute>
                  <FinancialAuditPage />
                </FinancialRoute>
              </ProtectedRoute>
            } />
            <Route path="net-sales-summary" element={
              <ProtectedRoute>
                <FinancialRoute>
                  <NetSalesSummaryPage />
                </FinancialRoute>
              </ProtectedRoute>
            } />
            <Route path="permissions" element={
              <ProtectedRoute>
                <SuperAdminRoute>
                  <UserPermissionsPage />
                </SuperAdminRoute>
              </ProtectedRoute>
            } />
            <Route path="transactions" element={
              <ProtectedRoute>
                <TransactionsDetailsPage />
              </ProtectedRoute>
            } />
            <Route path="fair-performance" element={
              <ProtectedRoute>
                <FairPerformancePage />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;