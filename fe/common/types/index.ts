export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: 'OWNER' | 'STAFF';
}

export interface Customer {
  id: number;
  fullName: string;
  phoneNumber: string;
  address?: string;
  note?: string;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  rentalPrice: number;
  depositAmount: number;
  damageFee: number;
  stockQuantity: number;
  damagedQuantity: number;
  availableQuantity: number;
  imageUrl?: string;
  category?: string;
  categoryId?: number;
  categoryName?: string;
  createdAt: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  RENTING = 'RENTING',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  DEPOSIT_PAID = 'DEPOSIT_PAID',
  REFUNDED = 'REFUNDED',
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  product: Product;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: number;
  customerId: number;
  customer: Customer;
  items: OrderItem[];
  rentalStartDate: string;
  rentalEndDate: string;
  rentalPrice: number;
  depositAmount: number;
  penaltyAmount: number;
  refundAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  note?: string;
  createdAt: string;
}

export interface ShopSettings {
  id: number;
  shopName: string;
  legalName?: string;
  hotline?: string;
  email?: string;
  address?: string;
  taxCode?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  invoiceFooter?: string;
}

export interface Dashboard {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  rentingOrders: number;
  monthlyRevenue: MonthlyRevenue[];
  topProducts: TopProduct[];
  lowStockProducts: LowStockProduct[];
  recentOrders: RecentOrder[];
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  orderCount: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  totalRented: number;
}

export interface LowStockProduct {
  id: number;
  name: string;
  stockQuantity: number;
  damagedQuantity: number;
  availableQuantity: number;
}

export interface RecentOrder {
  id: number;
  customerName: string;
  rentalStartDate: string;
  status: OrderStatus;
}
