import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { Order, OrderStatus } from '../order/order.entity';
import { OrderItem } from '../order/order.entity';
import { Product, ProductResponseDto } from './product.entity';
import {
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from './product.dto';

function toIsoDateString(value: Date) {
  return value.toISOString().slice(0, 10);
}

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
  ) {}

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const product = this.productRepo.create(dto);
    const saved = await this.productRepo.save(product);
    return new ProductResponseDto(saved);
  }

  async findAll(query: ProductQueryDto): Promise<ProductResponseDto[]> {
    const where: Record<string, string> = {};

    if (query.search) {
      where.name = Like(`%${query.search}%`) as unknown as string;
    }
    if (query.category) {
      where.category = query.category;
    }

    const products = await this.productRepo.find({
      where: where as never,
      relations: { categoryRel: true },
      order: { createdAt: 'DESC' },
    });

    const availabilityMap = await this.getAvailabilityMap(
      products.map((product) => product.id),
      query.rentalStartDate,
      query.rentalEndDate,
    );

    return products.map(
      (product) => new ProductResponseDto(product, availabilityMap.get(product.id)),
    );
  }

  async findById(id: number): Promise<ProductResponseDto> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: { categoryRel: true },
    });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    const availabilityMap = await this.getAvailabilityMap([id]);
    return new ProductResponseDto(product, availabilityMap.get(product.id));
  }

  async update(
    id: number,
    dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    if (
      dto.stockQuantity !== undefined &&
      dto.stockQuantity < product.damagedQuantity
    ) {
      throw new BadRequestException(
        'Tổng số lượng không được nhỏ hơn số lượng đang hư',
      );
    }

    Object.assign(product, dto);
    const saved = await this.productRepo.save(product);
    return new ProductResponseDto(saved);
  }

  async delete(id: number): Promise<void> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    await this.productRepo.softDelete(id);
  }

  async updateImage(
    id: number,
    imageUrl: string,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    product.imageUrl = imageUrl;
    const saved = await this.productRepo.save(product);
    return new ProductResponseDto(saved);
  }

  async restoreDamagedStock(
    id: number,
    quantity: number,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    if (quantity > product.damagedQuantity) {
      throw new BadRequestException(
        'Số lượng khôi phục vượt quá số lượng đang hư',
      );
    }

    product.damagedQuantity -= quantity;
    const saved = await this.productRepo.save(product);
    const availabilityMap = await this.getAvailabilityMap([id]);
    return new ProductResponseDto(saved, availabilityMap.get(saved.id));
  }

  async getLowStockProducts(
    threshold: number = 5,
  ): Promise<ProductResponseDto[]> {
    const products = await this.productRepo.find({
      order: { stockQuantity: 'ASC' },
    });
    const availabilityMap = await this.getAvailabilityMap(
      products.map((product) => product.id),
    );

    return products
      .filter((product) => (availabilityMap.get(product.id) ?? 0) <= threshold)
      .map(
        (product) =>
          new ProductResponseDto(product, availabilityMap.get(product.id)),
      );
  }

  async getAvailabilityMap(
    productIds: number[],
    rentalStartDate?: string,
    rentalEndDate?: string,
  ): Promise<Map<number, number>> {
    const availabilityMap = new Map<number, number>();

    if (productIds.length === 0) {
      return availabilityMap;
    }

    const products = await this.productRepo.find({
      where: { id: In(productIds) },
    });

    const startDate = rentalStartDate ?? toIsoDateString(new Date());
    const endDate = rentalEndDate ?? startDate;

    const reservedRows = await this.orderItemRepo
      .createQueryBuilder('item')
      .innerJoin(Order, 'order', 'order.id = item.order_id')
      .select('item.product_id', 'productId')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'reservedQuantity')
      .where('item.product_id IN (:...productIds)', { productIds })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [OrderStatus.PENDING, OrderStatus.RENTING],
      })
      .andWhere('order.rental_start_date <= :endDate', { endDate })
      .andWhere('order.rental_end_date >= :startDate', { startDate })
      .groupBy('item.product_id')
      .getRawMany<{ productId: string; reservedQuantity: string }>();

    const reservedMap = new Map<number, number>(
      reservedRows.map((row) => [
        Number(row.productId),
        Number(row.reservedQuantity),
      ]),
    );

    for (const product of products) {
      const reservedQuantity = reservedMap.get(product.id) ?? 0;
      const availableQuantity = Math.max(
        0,
        product.stockQuantity - product.damagedQuantity - reservedQuantity,
      );
      availabilityMap.set(product.id, availableQuantity);
    }

    return availabilityMap;
  }
}
