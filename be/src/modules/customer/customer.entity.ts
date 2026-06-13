import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';

@Entity('customers')
export class Customer extends BaseEntity {
  @Index()
  @Column({ name: 'full_name' })
  fullName: string;

  @Index()
  @Column({ name: 'phone_number' })
  phoneNumber: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  note: string;
}

export class CustomerResponseDto {
  id: number;
  fullName: string;
  phoneNumber: string;
  address: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(customer: Customer) {
    this.id = customer.id;
    this.fullName = customer.fullName;
    this.phoneNumber = customer.phoneNumber;
    this.address = customer.address;
    this.note = customer.note;
    this.createdAt = customer.createdAt;
    this.updatedAt = customer.updatedAt;
  }
}
