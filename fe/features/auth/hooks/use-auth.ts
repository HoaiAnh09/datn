'use client';

import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api';
import { useAuthStore } from '@/common/stores/auth.store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getErrorMessage } from '@/common/utils/error';

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      authApi.login(username, password),
    onSuccess: (data) => {
      if (data.data) {
        setUser(data.data);
      }
      toast.success(data.message);
      router.push('/dashboard');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Đăng nhập thất bại'));
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAuth();
      router.push('/login');
    },
  });
}
