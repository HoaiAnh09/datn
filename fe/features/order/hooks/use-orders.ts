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
      filters?.customerId,
      filters?.search,
      filters?.dateFrom,
      filters?.dateTo,
    ],
    queryFn: () => orderApi.getAll(filters),
    placeholderData: keepPreviousData,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Tạo đơn thuê thành công');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
      toast.success('Xác nhận thanh toán thành công');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
      toast.success('Trả đơn thành công');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
      toast.success('Hủy đơn thành công');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Lỗi khi hủy đơn'));
    },
  });
}
