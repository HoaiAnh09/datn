import api from '@/common/api';
import type { ApiResponse, User } from '@/common/types';

export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post<ApiResponse<User>>('/auth/login', {
      username,
      password,
    });
    return response.data;
  },

  register: async (data: {
    username: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    address?: string;
  }) => {
    const response = await api.post<ApiResponse<User>>('/auth/register', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post<ApiResponse>('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data;
  },
};
