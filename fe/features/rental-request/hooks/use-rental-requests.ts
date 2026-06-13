'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/common/utils/error';
import { rentalRequestApi, type CreateRentalRequestData } from '../api';

export function useRentalRequests(filters?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ['rental-requests', filters?.status, filters?.search],
    queryFn: () => rentalRequestApi.getAll(filters),
    placeholderData: keepPreviousData,
  });
}

export function useMyRentalRequests() {
  return useQuery({
    queryKey: ['rental-requests', 'mine'],
    queryFn: rentalRequestApi.getMine,
  });
}

export function useCreateRentalRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRentalRequestData) => rentalRequestApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rental-requests'] });
      if (data.message) {
        toast.success(data.message);
      }
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Lỗi khi gửi yêu cầu'));
    },
  });
}

export function useApproveRentalRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data?: { pickupDeadlineAt?: string; reviewNote?: string };
    }) => rentalRequestApi.approve(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rental-requests'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (data.message) {
        toast.success(data.message);
      }
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Lỗi khi duyệt yêu cầu'));
    },
  });
}

export function useRejectRentalRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reviewNote }: { id: number; reviewNote: string }) =>
      rentalRequestApi.reject(id, reviewNote),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rental-requests'] });
      if (data.message) {
        toast.success(data.message);
      }
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Lỗi khi từ chối yêu cầu'));
    },
  });
}

export function useCancelRentalRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rentalRequestApi.cancel,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rental-requests'] });
      if (data.message) {
        toast.success(data.message);
      }
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Lỗi khi hủy yêu cầu'));
    },
  });
}
