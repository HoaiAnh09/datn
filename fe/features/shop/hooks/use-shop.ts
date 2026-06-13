'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/common/utils/error';
import { shopApi } from '../api';

export function useShopSettings() {
  return useQuery({
    queryKey: ['shop-settings'],
    queryFn: shopApi.getSettings,
  });
}

export function useUpdateShopSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: shopApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-settings'] });
      toast.success('Cập nhật thông tin shop thành công');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Lỗi khi cập nhật thông tin shop'));
    },
  });
}
