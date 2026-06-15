'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/common/utils/error';
import type { ApiResponse } from '@/common/types';
import type { Category } from '@/common/types/category';
import { categoryApi } from '../api';

export function useCategories(search?: string) {
  return useQuery<ApiResponse<Category[]>, Error>({
    queryKey: ['categories', search],
    queryFn: () => categoryApi.getAll(search),
    placeholderData: keepPreviousData,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoryApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (data.message) {
        toast.success(data.message);
      }
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Lỗi không xác định'));
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; description?: string } }) =>
      categoryApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (data.message) {
        toast.success(data.message);
      }
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Lỗi không xác định'));
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoryApi.delete,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (data.message) {
        toast.success(data.message);
      }
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Lỗi không xác định'));
    },
  });
}
