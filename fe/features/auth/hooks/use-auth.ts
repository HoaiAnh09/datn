'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getErrorMessage } from '@/common/utils/error';
import { useAuthStore } from '@/common/stores/auth.store';
import { authApi } from '../api';

function getDefaultRouteForRole() {
  return '/dashboard';
}

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
      router.push(getDefaultRouteForRole());
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Đăng nhập thất bại'));
    },
  });
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      toast.success(data.message);
      router.push('/login');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Đăng ký thất bại'));
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
      router.push('/');
    },
  });
}
