import api from '@/common/api';
import type { ApiResponse, RentalRequest } from '@/common/types';

type QueryParams = Record<string, string | undefined>;

export interface CreateRentalRequestData {
  rentalStartDate: string;
  rentalEndDate: string;
  items: Array<{
    productId: number;
    quantity: number;
  }>;
  note?: string;
}

export const rentalRequestApi = {
  getAll: async (filters?: { status?: string; search?: string }) => {
    const params: QueryParams = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.search) params.search = filters.search;
    const response = await api.get<ApiResponse<RentalRequest[]>>(
      '/rental-requests',
      { params },
    );
    return response.data;
  },

  getMine: async () => {
    const response = await api.get<ApiResponse<RentalRequest[]>>(
      '/rental-requests/mine',
    );
    return response.data;
  },

  create: async (data: CreateRentalRequestData) => {
    const response = await api.post<ApiResponse<RentalRequest>>(
      '/rental-requests',
      data,
    );
    return response.data;
  },

  approve: async (
    id: number,
    data?: { pickupDeadlineAt?: string; reviewNote?: string },
  ) => {
    const response = await api.put<ApiResponse<RentalRequest>>(
      `/rental-requests/${id}/approve`,
      data,
    );
    return response.data;
  },

  reject: async (id: number, reviewNote: string) => {
    const response = await api.put<ApiResponse<RentalRequest>>(
      `/rental-requests/${id}/reject`,
      { reviewNote },
    );
    return response.data;
  },

  cancel: async (id: number) => {
    const response = await api.put<ApiResponse<RentalRequest>>(
      `/rental-requests/${id}/cancel`,
    );
    return response.data;
  },
};
