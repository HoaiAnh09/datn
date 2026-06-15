'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingScreen } from '@/common/components/loading-screen';
import { useAuthStore } from '@/common/stores/auth.store';

function getDefaultRouteForRole() {
  return '/dashboard';
}

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(getDefaultRouteForRole());
    }
  }, [isLoading, router, user]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
}
