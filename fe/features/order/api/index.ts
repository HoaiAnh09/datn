import api from '@/common/api';
import type { ApiResponse, Order, OrderSource } from '@/common/types';

type QueryParams = Record<string, string | number | undefined>;

export interface CreateOrderItem {
  productId: number;
  quantity: number;
}

export interface CreateOrderData {
  renterUserId?: number;
  renterFullName: string;
  renterPhoneNumber?: string;
  renterAddress?: string;
  rentalStartDate: string;
  rentalEndDate: string;
  items: CreateOrderItem[];
  note?: string;
  source?: OrderSource;
  pickupDeadlineAt?: string;
}

export interface ReturnOrderData {
  itemPenalties: {
    productId: number;
    damagedQuantity: number;
  }[];
  extraPenaltyAmount: number;
  extraPenaltyReason?: string;
  note?: string;
}

export interface OrderFilters {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  source?: OrderSource;
}

export const orderApi = {
  getAll: async (filters?: OrderFilters) => {
    const params: QueryParams = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.search) params.search = filters.search;
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters?.dateTo) params.dateTo = filters.dateTo;
    if (filters?.source) params.source = filters.source;

    const response = await api.get<ApiResponse<Order[]>>('/orders', { params });
    return response.data;
  },

  getMine: async () => {
    const response = await api.get<ApiResponse<Order[]>>('/orders/mine');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data;
  },

  create: async (data: CreateOrderData) => {
    const response = await api.post<ApiResponse<Order>>('/orders', data);
    return response.data;
  },

  confirmPayment: async (id: number) => {
    const response = await api.put<ApiResponse<Order>>(
      `/orders/${id}/confirm-payment`,
    );
    return response.data;
  },

  returnOrder: async (id: number, data: ReturnOrderData) => {
    const response = await api.put<ApiResponse<Order>>(
      `/orders/${id}/return`,
      data,
    );
    return response.data;
  },

  cancel: async (id: number) => {
    const response = await api.put<ApiResponse<Order>>(`/orders/${id}/cancel`);
    return response.data;
  },
};
