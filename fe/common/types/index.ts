export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export type Role = 'OWNER' | 'CUSTOMER';

export interface User {
  id: number;
  username: string;
  fullName: string;
  phoneNumber?: string | null;
  address?: string | null;
  role: Role;
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

export enum OrderSource {
  OWNER_DIRECT = 'OWNER_DIRECT',
  CUSTOMER_REQUEST = 'CUSTOMER_REQUEST',
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
  renterUserId?: number | null;
  renter?: User | null;
  renterFullName: string;
  renterPhoneNumber?: string | null;
  renterAddress?: string | null;
  requestId?: number | null;
  source: OrderSource;
  items: OrderItem[];
  rentalStartDate: string;
  rentalEndDate: string;
  rentalPrice: number;
  depositAmount: number;
  penaltyAmount: number;
  refundAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  note?: string | null;
  qrCodeUrl?: string | null;
  pickupDeadlineAt?: string | null;
  createdAt: string;
}

export enum RentalRequestStatus {
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface RentalRequestItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  depositAmount: number;
  product: {
    id: number;
    name: string;
    imageUrl?: string;
  } | null;
}

export interface RentalRequest {
  id: number;
  userId: number;
  user: User | null;
  items: RentalRequestItem[];
  rentalStartDate: string;
  rentalEndDate: string;
  status: RentalRequestStatus;
  note?: string | null;
  reviewNote?: string | null;
  approvedOrderId?: number | null;
  reviewedAt?: string | null;
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
  heroTitle?: string;
  heroSubtitle?: string;
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
  renterName: string;
  rentalStartDate: string;
  status: OrderStatus;
}
