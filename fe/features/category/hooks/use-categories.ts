'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { categoryApi } from '../api';
import type { ApiResponse } from '@/common/types';
import type { Category } from '@/common/types/category';
import { toast } from 'sonner';
import { getErrorMessage } from '@/common/utils/error';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Tạo danh mục thành công');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Cập nhật danh mục thành công');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Xóa danh mục thành công');
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Lỗi không xác định'));
    },
  });
}
