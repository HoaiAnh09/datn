import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Customer, CustomerResponseDto } from './customer.entity';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerQueryDto,
} from './customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  async create(dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    const customer = this.customerRepo.create(dto);
    const saved = await this.customerRepo.save(customer);
    return new CustomerResponseDto(saved);
  }

  async findAll(query: CustomerQueryDto): Promise<CustomerResponseDto[]> {
    const where: any = {};

    if (query.search) {
      where.fullName = Like(`%${query.search}%`);
    }

    const customers = await this.customerRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return customers.map((c) => new CustomerResponseDto(c));
  }

  async findById(id: number): Promise<CustomerResponseDto> {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }
    return new CustomerResponseDto(customer);
  }

  async update(
    id: number,
    dto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }
    Object.assign(customer, dto);
    const saved = await this.customerRepo.save(customer);
    return new CustomerResponseDto(saved);
  }

  async delete(id: number): Promise<void> {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }
    await this.customerRepo.softDelete(id);
  }

  async getRentalHistory(customerId: number): Promise<any[]> {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    const orders = await this.customerRepo.manager
      .createQueryBuilder('order', 'o')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('o.customer_id = :customerId', { customerId })
      .orderBy('o.created_at', 'DESC')
      .getMany();

    return orders;
  }
}
