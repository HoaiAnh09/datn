import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';

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

@Entity('orders')
@Index(['status'])
@Index(['renterUserId'])
@Index(['rentalStartDate'])
export class Order extends BaseEntity {
  @Column({ name: 'renter_user_id', type: 'integer', nullable: true })
  renterUserId: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'renter_user_id' })
  renterUser: User | null;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];

  @Column({ name: 'renter_full_name' })
  renterFullName: string;

  @Column({ name: 'renter_phone_number', type: 'varchar', nullable: true })
  renterPhoneNumber: string | null;

  @Column({ name: 'renter_address', type: 'text', nullable: true })
  renterAddress: string | null;

  @Column({ name: 'request_id', type: 'integer', nullable: true })
  requestId: number | null;

  @Column({
    type: 'enum',
    enum: OrderSource,
    default: OrderSource.OWNER_DIRECT,
  })
  source: OrderSource;

  @Column({ name: 'rental_start_date', type: 'date' })
  rentalStartDate: string;

  @Column({ name: 'rental_end_date', type: 'date' })
  rentalEndDate: string;

  @Column({
    name: 'rental_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  rentalPrice: number;

  @Column({
    name: 'deposit_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  depositAmount: number;

  @Column({
    name: 'penalty_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  penaltyAmount: number;

  @Column({
    name: 'refund_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  refundAmount: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ name: 'qr_code_url', type: 'varchar', nullable: true })
  qrCodeUrl: string | null;

  @Column({ name: 'pickup_deadline_at', type: 'timestamp', nullable: true })
  pickupDeadlineAt: Date | null;
}

@Entity('order_items')
@Index(['orderId'])
@Index(['productId'])
export class OrderItem extends BaseEntity {
  @Column({ name: 'order_id' })
  orderId: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'quantity' })
  quantity: number;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  unitPrice: number;
}

export class OrderItemResponseDto {
  id: number;
  productId: number;
  product: {
    id: number;
    name: string;
    imageUrl?: string;
    rentalPrice: number;
    depositAmount: number;
    damageFee: number;
  } | null;
  quantity: number;
  unitPrice: number;

  constructor(item: OrderItem) {
    this.id = item.id;
    this.productId = item.productId;
    this.product = item.product
      ? {
          id: item.product.id,
          name: item.product.name,
          imageUrl: item.product.imageUrl,
          rentalPrice: Number(item.product.rentalPrice),
          depositAmount: Number(item.product.depositAmount),
          damageFee: Number(item.product.damageFee),
        }
      : null;
    this.quantity = item.quantity;
    this.unitPrice = Number(item.unitPrice);
  }
}

export class OrderResponseDto {
  id: number;
  renterUserId: number | null;
  renter: {
    id: number;
    username: string;
    fullName: string;
    phoneNumber: string | null;
    address: string | null;
    role: string;
  } | null;
  renterFullName: string;
  renterPhoneNumber: string | null;
  renterAddress: string | null;
  requestId: number | null;
  source: OrderSource;
  items: OrderItemResponseDto[];
  rentalStartDate: string;
  rentalEndDate: string;
  rentalPrice: number;
  depositAmount: number;
  penaltyAmount: number;
  refundAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  note: string | null;
  qrCodeUrl: string | null;
  pickupDeadlineAt: Date | null;
  createdAt: Date;

  constructor(order: Order) {
    this.id = order.id;
    this.renterUserId = order.renterUserId ?? null;
    this.renter = order.renterUser
      ? {
          id: order.renterUser.id,
          username: order.renterUser.username,
          fullName: order.renterUser.fullName,
          phoneNumber: order.renterUser.phoneNumber ?? null,
          address: order.renterUser.address ?? null,
          role: order.renterUser.role,
        }
      : null;
    this.renterFullName = order.renterFullName;
    this.renterPhoneNumber = order.renterPhoneNumber ?? null;
    this.renterAddress = order.renterAddress ?? null;
    this.requestId = order.requestId ?? null;
    this.source = order.source;
    this.items = order.items?.map((item) => new OrderItemResponseDto(item)) ?? [];
    this.rentalStartDate = order.rentalStartDate;
    this.rentalEndDate = order.rentalEndDate;
    this.rentalPrice = Number(order.rentalPrice);
    this.depositAmount = Number(order.depositAmount);
    this.penaltyAmount = Number(order.penaltyAmount);
    this.refundAmount = Number(order.refundAmount);
    this.status = order.status;
    this.paymentStatus = order.paymentStatus;
    this.note = order.note ?? null;
    this.qrCodeUrl = order.qrCodeUrl ?? null;
    this.pickupDeadlineAt = order.pickupDeadlineAt ?? null;
    this.createdAt = order.createdAt;
  }
}
