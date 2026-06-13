import api from '@/common/api';
import type { ApiResponse, Customer } from '@/common/types';

export const customerApi = {
  getAll: async (search?: string) => {
    const params = search ? { search } : {};
    const response = await api.get<ApiResponse<Customer[]>>('/customers', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data;
  },

  create: async (data: Partial<Customer>) => {
    const response = await api.post<ApiResponse<Customer>>('/customers', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Customer>) => {
    const response = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<ApiResponse>(`/customers/${id}`);
    return response.data;
  },
};
