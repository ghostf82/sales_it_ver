// src/context/TenantContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TenantContextType {
  tenantId: string | null;
  isSuperAdmin: boolean;
  companyId: string | null;
  setTenantId: (id: string | null) => void;
  setIsSuperAdmin: (value: boolean) => void;
  setCompanyId: (id: string | null) => void;
}

const TenantContext = createContext<TenantContextType>({
  tenantId: null,
  isSuperAdmin: false,
  companyId: null,
  setTenantId: () => {},
  setIsSuperAdmin: () => {},
  setCompanyId: () => {},
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const storedTenantId = localStorage.getItem('tenant_id');
    const storedCompanyId = localStorage.getItem('company_id');
    const storedIsSuperAdmin = localStorage.getItem('is_super_admin') === '1';

    if (storedTenantId) setTenantId(storedTenantId);
    if (storedCompanyId) setCompanyId(storedCompanyId);
    setIsSuperAdmin(storedIsSuperAdmin);
  }, []);

  return (
    <TenantContext.Provider
      value={{ tenantId, isSuperAdmin, companyId, setTenantId, setIsSuperAdmin, setCompanyId }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
