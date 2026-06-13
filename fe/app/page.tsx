'use client';

import { useAuthStore } from '@/common/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingScreen } from '@/common/components/loading-screen';

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      router.replace(user ? '/dashboard' : '/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return null;
}
