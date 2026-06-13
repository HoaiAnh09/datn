import api from '@/common/api';
import type { ApiResponse, ShopSettings } from '@/common/types';

export const shopApi = {
  getSettings: async () => {
    const response = await api.get<ApiResponse<ShopSettings>>('/shop-settings');
    return response.data;
  },

  updateSettings: async (data: Partial<ShopSettings>) => {
    const response = await api.put<ApiResponse<ShopSettings>>('/shop-settings', data);
    return response.data;
  },
};
