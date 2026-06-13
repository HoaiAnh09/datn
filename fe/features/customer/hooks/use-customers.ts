'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { customerApi } from '../api';
import { toast } from 'sonner';
import type { Customer } from '@/common/types';
import { getErrorMessage } from '@/common/utils/error';

export function useCustomers(search?: string) {
  return useQuery({
    queryKey: ['customers', search],
    queryFn: () => customerApi.getAll(search),
    placeholderData: keepPreviousData,
  });
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerApi.getById(id),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customerApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Thêm khách hàng thành công');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Lỗi khi thêm khách hàng'));
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Customer> }) =>
      customerApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cập nhật khách hàng thành công');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Lỗi khi cập nhật'));
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customerApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Xóa khách hàng thành công');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Lỗi khi xóa'));
    },
  });
}
