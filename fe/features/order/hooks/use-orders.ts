'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/common/utils/error';
import {
  orderApi,
  type CreateOrderData,
  type OrderFilters,
  type ReturnOrderData,
} from '../api';

export function useOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: [
      'orders',
      filters?.status,
      filters?.search,
      filters?.dateFrom,
      filters?.dateTo,
      filters?.source,
    ],
    queryFn: () => orderApi.getAll(filters),
    placeholderData: keepPreviousData,
  });
}

export function useMyOrders() {
  return useQuery({
    queryKey: ['orders', 'mine'],
    queryFn: orderApi.getMine,
  });
}

export function useOrder(id: number, enabled = true) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.getById(id),
    enabled,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderData) => orderApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (data.message) {
        toast.success(data.message);
      }
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Lỗi khi tạo đơn'));
    },
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: orderApi.confirmPayment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
      if (data.message) {
        toast.success(data.message);
      }
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Lỗi khi xác nhận thanh toán'));
    },
  });
}

export function useReturnOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReturnOrderData }) =>
      orderApi.returnOrder(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
      if (data.message) {
        toast.success(data.message);
      }
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Lỗi khi trả đơn'));
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: orderApi.cancel,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
      if (data.message) {
        toast.success(data.message);
      }
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Lỗi khi hủy đơn'));
    },
  });
}
