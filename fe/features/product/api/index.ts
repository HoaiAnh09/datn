import api from '@/common/api';
import type { ApiResponse, Product } from '@/common/types';

type QueryParams = Record<string, string | number | undefined>;

export const productApi = {
  getAll: async (
    search?: string,
    category?: string,
    rentalStartDate?: string,
    rentalEndDate?: string
  ) => {
    const params: QueryParams = {};
    if (search) params.search = search;
    if (category) params.category = category;
    if (rentalStartDate) params.rentalStartDate = rentalStartDate;
    if (rentalEndDate) params.rentalEndDate = rentalEndDate;
    const response = await api.get<ApiResponse<Product[]>>('/products', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  },

  create: async (data: Partial<Product>) => {
    const response = await api.post<ApiResponse<Product>>('/products', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Product>) => {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
    return response.data;
  },

  restoreDamagedStock: async (id: number, quantity: number) => {
    const response = await api.put<ApiResponse<Product>>(
      `/products/${id}/restore-damaged`,
      { quantity }
    );
    return response.data;
  },

  uploadImage: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post<ApiResponse<Product>>(
      `/products/${id}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<ApiResponse>(`/products/${id}`);
    return response.data;
  },
};
