import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { Category } from '../category/category.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Index()
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'rental_price', type: 'decimal', precision: 10, scale: 2 })
  rentalPrice: number;

  @Column({ name: 'deposit_amount', type: 'decimal', precision: 10, scale: 2 })
  depositAmount: number;

  @Column({
    name: 'damage_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  damageFee: number;

  @Index()
  @Column({ name: 'stock_quantity', default: 0 })
  stockQuantity: number;

  @Column({ name: 'damaged_quantity', default: 0 })
  damagedQuantity: number;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  category: string;

  @Column({ name: 'category_id', nullable: true })
  categoryId: number;

  @ManyToOne(() => Category, { nullable: true, eager: false })
  @JoinColumn({ name: 'category_id' })
  categoryRel: Category;
}

export class ProductResponseDto {
  id: number;
  name: string;
  description: string;
  rentalPrice: number;
  depositAmount: number;
  damageFee: number;
  stockQuantity: number;
  damagedQuantity: number;
  availableQuantity: number;
  imageUrl: string;
  category: string;
  categoryId: number;
  categoryName: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(product: Product, availableQuantity?: number) {
    this.id = product.id;
    this.name = product.name;
    this.description = product.description;
    this.rentalPrice = Number(product.rentalPrice);
    this.depositAmount = Number(product.depositAmount);
    this.damageFee = Number(product.damageFee);
    this.stockQuantity = product.stockQuantity;
    this.damagedQuantity = product.damagedQuantity;
    this.availableQuantity =
      availableQuantity ?? Math.max(0, product.stockQuantity - product.damagedQuantity);
    this.imageUrl = product.imageUrl;
    this.category = product.category;
    this.categoryId = product.categoryId;
    this.categoryName = product.categoryRel?.name ?? '';
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;
  }
}
