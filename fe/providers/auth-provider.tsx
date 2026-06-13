'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/common/stores/auth.store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const getMe = useAuthStore((s) => s.getMe);

  useEffect(() => {
    getMe();
  }, [getMe]);

  return <>{children}</>;
}
