'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingScreen } from '@/common/components/loading-screen';
import { useAuthStore } from '@/common/stores/auth.store';
import type { Role } from '@/common/types';

function getDefaultRouteForRole() {
  return '/dashboard';
}

export function AuthGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Role[];
}) {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
      return;
    }

    if (!isLoading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(getDefaultRouteForRole());
    }
  }, [allowedRoles, isLoading, router, user]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}
