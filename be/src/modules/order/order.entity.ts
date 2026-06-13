import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { Customer } from '../customer/customer.entity';
import { Product } from '../product/product.entity';

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

@Entity('orders')
@Index(['status'])
@Index(['customerId'])
@Index(['rentalStartDate'])
export class Order extends BaseEntity {
  @Column({ name: 'customer_id' })
  customerId: number;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];

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

  @Column({ nullable: true })
  note: string;

  @Column({ name: 'qr_code_url', nullable: true })
  qrCodeUrl: string;
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
  customerId: number;
  customer: any;
  items: OrderItemResponseDto[];
  rentalStartDate: string;
  rentalEndDate: string;
  rentalPrice: number;
  depositAmount: number;
  penaltyAmount: number;
  refundAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  note: string;
  qrCodeUrl: string;
  createdAt: Date;

  constructor(order: Order) {
    this.id = order.id;
    this.customerId = order.customerId;
    this.customer = order.customer
      ? {
          id: order.customer.id,
          fullName: order.customer.fullName,
          phoneNumber: order.customer.phoneNumber,
        }
      : null;
    this.items = order.items
      ? order.items.map((item) => new OrderItemResponseDto(item))
      : [];
    this.rentalStartDate = order.rentalStartDate;
    this.rentalEndDate = order.rentalEndDate;
    this.rentalPrice = Number(order.rentalPrice);
    this.depositAmount = Number(order.depositAmount);
    this.penaltyAmount = Number(order.penaltyAmount);
    this.refundAmount = Number(order.refundAmount);
    this.status = order.status;
    this.paymentStatus = order.paymentStatus;
    this.note = order.note;
    this.qrCodeUrl = order.qrCodeUrl;
    this.createdAt = order.createdAt;
  }
}
