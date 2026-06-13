'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { productApi } from '../api';
import { toast } from 'sonner';
import type { Product } from '@/common/types';
import { getErrorMessage } from '@/common/utils/error';

export function useProducts(search?: string, category?: string) {
  return useQuery({
    queryKey: ['products', search, category],
    queryFn: () => productApi.getAll(search, category),
    placeholderData: keepPreviousData,
  });
}

export function useProductsAvailability(
  rentalStartDate?: string,
  rentalEndDate?: string
) {
  return useQuery({
    queryKey: ['products', 'availability', rentalStartDate, rentalEndDate],
    queryFn: () =>
      productApi.getAll(undefined, undefined, rentalStartDate, rentalEndDate),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getById(id),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Thêm sản phẩm thành công');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Lỗi khi thêm sản phẩm'));
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Product> }) =>
      productApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Cập nhật sản phẩm thành công');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Lỗi khi cập nhật'));
    },
  });
}

export function useUploadProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      productApi.uploadImage(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Tải ảnh sản phẩm thành công');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Lỗi khi tải ảnh sản phẩm'));
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Xóa sản phẩm thành công');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Lỗi khi xóa'));
    },
  });
}

export function useRestoreDamagedProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      productApi.restoreDamagedStock(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Khôi phục hàng hư thành công');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Lỗi khi khôi phục hàng hư'));
    },
  });
}
