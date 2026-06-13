import api from '@/common/api';
import type { ApiResponse } from '@/common/types';
import type { Category } from '@/common/types/category';

export const categoryApi = {
  getAll: async (search?: string) => {
    const params = search ? { search } : {};
    const response = await api.get<ApiResponse<Category[]>>('/categories', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data;
  },

  create: async (data: { name: string; description?: string }) => {
    const response = await api.post<ApiResponse<Category>>('/categories', data);
    return response.data;
  },

  update: async (id: number, data: { name?: string; description?: string }) => {
    const response = await api.put<ApiResponse<Category>>(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<ApiResponse>(`/categories/${id}`);
    return response.data;
  },
};
