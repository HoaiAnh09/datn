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

export enum RentalRequestStatus {
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Entity('rental_requests')
@Index(['userId'])
@Index(['status'])
export class RentalRequest extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => RentalRequestItem, (item) => item.request)
  items: RentalRequestItem[];

  @Column({ name: 'rental_start_date', type: 'date' })
  rentalStartDate: string;

  @Column({ name: 'rental_end_date', type: 'date' })
  rentalEndDate: string;

  @Column({
    type: 'enum',
    enum: RentalRequestStatus,
    default: RentalRequestStatus.SUBMITTED,
  })
  status: RentalRequestStatus;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ name: 'review_note', type: 'text', nullable: true })
  reviewNote: string | null;

  @Column({ name: 'approved_order_id', type: 'integer', nullable: true })
  approvedOrderId: number | null;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date | null;
}

@Entity('rental_request_items')
@Index(['requestId'])
@Index(['productId'])
export class RentalRequestItem extends BaseEntity {
  @Column({ name: 'request_id' })
  requestId: number;

  @ManyToOne(() => RentalRequest, (request) => request.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'request_id' })
  request: RentalRequest;

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

  @Column({
    name: 'deposit_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  depositAmount: number;
}

export class RentalRequestItemResponseDto {
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

  constructor(item: RentalRequestItem) {
    this.id = item.id;
    this.productId = item.productId;
    this.quantity = item.quantity;
    this.unitPrice = Number(item.unitPrice);
    this.depositAmount = Number(item.depositAmount);
    this.product = item.product
      ? {
          id: item.product.id,
          name: item.product.name,
          imageUrl: item.product.imageUrl,
        }
      : null;
  }
}

export class RentalRequestResponseDto {
  id: number;
  userId: number;
  user: {
    id: number;
    username: string;
    fullName: string;
    phoneNumber: string | null;
    address: string | null;
  } | null;
  items: RentalRequestItemResponseDto[];
  rentalStartDate: string;
  rentalEndDate: string;
  status: RentalRequestStatus;
  note: string | null;
  reviewNote: string | null;
  approvedOrderId: number | null;
  reviewedAt: Date | null;
  createdAt: Date;

  constructor(request: RentalRequest) {
    this.id = request.id;
    this.userId = request.userId;
    this.user = request.user
      ? {
          id: request.user.id,
          username: request.user.username,
          fullName: request.user.fullName,
          phoneNumber: request.user.phoneNumber ?? null,
          address: request.user.address ?? null,
        }
      : null;
    this.items =
      request.items?.map((item) => new RentalRequestItemResponseDto(item)) ?? [];
    this.rentalStartDate = request.rentalStartDate;
    this.rentalEndDate = request.rentalEndDate;
    this.status = request.status;
    this.note = request.note ?? null;
    this.reviewNote = request.reviewNote ?? null;
    this.approvedOrderId = request.approvedOrderId ?? null;
    this.reviewedAt = request.reviewedAt ?? null;
    this.createdAt = request.createdAt;
  }
}
