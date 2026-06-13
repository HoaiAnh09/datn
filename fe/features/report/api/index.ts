import api from '@/common/api';
import type { ApiResponse, Dashboard } from '@/common/types';

export const reportApi = {
  getDashboard: async () => {
    const response = await api.get<ApiResponse<Dashboard>>('/reports/dashboard');
    return response.data;
  },
};
