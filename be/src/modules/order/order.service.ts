import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Product } from '../product/product.entity';
import { CreateOrderDto, OrderQueryDto, ReturnOrderDto } from './order.dto';
import {
  Order,
  OrderItem,
  OrderResponseDto,
  OrderStatus,
  PaymentStatus,
} from './order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateOrderDto): Promise<OrderResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const rentalDays = this.getChargeableRentalDays(
        dto.rentalStartDate,
        dto.rentalEndDate,
      );
      let totalRentalPrice = 0;
      let totalDepositAmount = 0;
      const orderItems: Partial<OrderItem>[] = [];

      for (const item of dto.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        const availableQuantity = await this.getAvailableQuantity(
          queryRunner.manager,
          product,
          dto.rentalStartDate,
          dto.rentalEndDate,
        );

        if (availableQuantity < item.quantity) {
          throw new BadRequestException(
            `Sản phẩm "${product.name}" không đủ số lượng khả dụng trong khoảng thời gian thuê`,
          );
        }

        totalRentalPrice +=
          Number(product.rentalPrice) * item.quantity * rentalDays;
        totalDepositAmount += Number(product.depositAmount) * item.quantity;

        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.rentalPrice,
        });
      }

      const order = queryRunner.manager.create(Order, {
        customerId: dto.customerId,
        rentalStartDate: dto.rentalStartDate,
        rentalEndDate: dto.rentalEndDate,
        rentalPrice: totalRentalPrice,
        depositAmount: totalDepositAmount,
        note: dto.note,
      });

      const savedOrder = await queryRunner.manager.save(order);

      const items = orderItems.map((item) =>
        queryRunner.manager.create(OrderItem, {
          ...item,
          orderId: savedOrder.id,
        }),
      );

      await queryRunner.manager.save(items);
      await queryRunner.commitTransaction();

      return this.findById(savedOrder.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: OrderQueryDto): Promise<OrderResponseDto[]> {
    if (query.dateFrom && query.dateTo && query.dateFrom > query.dateTo) {
      throw new BadRequestException('Khoảng thời gian lọc không hợp lệ');
    }

    const queryBuilder = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.product', 'product')
      .orderBy('order.createdAt', 'DESC');

    if (query.status) {
      queryBuilder.andWhere('order.status = :status', { status: query.status });
    }

    if (query.customerId) {
      queryBuilder.andWhere('order.customerId = :customerId', {
        customerId: query.customerId,
      });
    }

    if (query.search?.trim()) {
      const normalizedSearch = query.search.trim();
      const orderId = Number(normalizedSearch);

      queryBuilder.andWhere(
        '(customer.full_name ILIKE :search OR customer.phone_number ILIKE :search OR CAST(order.id AS TEXT) ILIKE :search' +
          (Number.isInteger(orderId) ? ' OR order.id = :orderId' : '') +
          ')',
        {
          search: `%${normalizedSearch}%`,
          ...(Number.isInteger(orderId) ? { orderId } : {}),
        },
      );
    }

    if (query.dateFrom) {
      queryBuilder.andWhere('order.rental_end_date >= :dateFrom', {
        dateFrom: query.dateFrom,
      });
    }

    if (query.dateTo) {
      queryBuilder.andWhere('order.rental_start_date <= :dateTo', {
        dateTo: query.dateTo,
      });
    }

    const orders = await queryBuilder.getMany();

    return orders.map((order) => new OrderResponseDto(order));
  }

  async findById(id: number): Promise<OrderResponseDto> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: {
        customer: true,
        items: { product: true },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return new OrderResponseDto(order);
  }

  async confirmPayment(id: number): Promise<OrderResponseDto> {
    const order = await this.orderRepo.findOne({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Only pending orders can be confirmed for payment',
      );
    }

    order.paymentStatus = PaymentStatus.DEPOSIT_PAID;
    order.status = OrderStatus.RENTING;

    await this.orderRepo.save(order);
    return this.findById(id);
  }

  async returnOrder(
    id: number,
    dto: ReturnOrderDto,
  ): Promise<OrderResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id },
        relations: { items: { product: true } },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.status !== OrderStatus.RENTING) {
        throw new BadRequestException('Only renting orders can be returned');
      }

      if (dto.extraPenaltyAmount > 0 && !dto.extraPenaltyReason?.trim()) {
        throw new BadRequestException(
          'Extra penalty reason is required when extra penalty is greater than 0',
        );
      }

      const uniqueProductIds = new Set<number>();
      let totalPenaltyAmount = 0;
      const returnSummaryLines: string[] = [];

      for (const itemPenalty of dto.itemPenalties) {
        if (uniqueProductIds.has(itemPenalty.productId)) {
          throw new BadRequestException('Duplicate product found in return payload');
        }

        uniqueProductIds.add(itemPenalty.productId);

        const orderItem = order.items.find(
          (item) => item.productId === itemPenalty.productId,
        );

        if (!orderItem) {
          throw new BadRequestException(
            `Product ${itemPenalty.productId} does not belong to this order`,
          );
        }

        if (itemPenalty.damagedQuantity > orderItem.quantity) {
          throw new BadRequestException(
            `Damaged quantity for "${orderItem.product?.name ?? orderItem.productId}" exceeds rented quantity`,
          );
        }

        if (itemPenalty.damagedQuantity === 0) {
          continue;
        }

        const penaltyPerUnit = Number(orderItem.product?.damageFee ?? 0);
        const itemPenaltyAmount = penaltyPerUnit * itemPenalty.damagedQuantity;

        totalPenaltyAmount += itemPenaltyAmount;
        returnSummaryLines.push(
          `${orderItem.product?.name ?? `Product ${orderItem.productId}`}: ${itemPenalty.damagedQuantity} x ${penaltyPerUnit} = ${itemPenaltyAmount}`,
        );
      }

      if (dto.extraPenaltyAmount > 0) {
        totalPenaltyAmount += dto.extraPenaltyAmount;
        returnSummaryLines.push(
          `Extra penalty: ${dto.extraPenaltyAmount} (${dto.extraPenaltyReason?.trim()})`,
        );
      }

      for (const itemPenalty of dto.itemPenalties) {
        if (itemPenalty.damagedQuantity === 0) {
          continue;
        }

        const product = await queryRunner.manager.findOne(Product, {
          where: { id: itemPenalty.productId },
        });

        if (!product) {
          throw new NotFoundException(
            `Không tìm thấy sản phẩm ${itemPenalty.productId}`,
          );
        }

        product.damagedQuantity += itemPenalty.damagedQuantity;
        if (product.damagedQuantity > product.stockQuantity) {
          throw new BadRequestException(
            `Số lượng hư của "${product.name}" vượt quá tổng tồn kho`,
          );
        }

        await queryRunner.manager.save(product);
      }

      const refundAmount = Math.max(
        0,
        Number(order.depositAmount) - totalPenaltyAmount,
      );

      const noteParts = [order.note?.trim(), dto.note?.trim()].filter(Boolean);
      if (returnSummaryLines.length > 0) {
        noteParts.push(`Return summary: ${returnSummaryLines.join('; ')}`);
      }

      order.penaltyAmount = totalPenaltyAmount;
      order.refundAmount = refundAmount;
      order.status = OrderStatus.RETURNED;
      order.paymentStatus = PaymentStatus.REFUNDED;
      order.note = noteParts.join('\n');

      await queryRunner.manager.save(order);
      await queryRunner.commitTransaction();

      return this.findById(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async cancel(id: number): Promise<OrderResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id },
        relations: { items: true },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.status === OrderStatus.RETURNED) {
        throw new BadRequestException('Returned orders cannot be cancelled');
      }

      order.status = OrderStatus.CANCELLED;
      await queryRunner.manager.save(order);
      await queryRunner.commitTransaction();

      return this.findById(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async getAvailableQuantity(
    manager: EntityManager,
    product: Product,
    rentalStartDate: string,
    rentalEndDate: string,
  ) {
    const reservedRow = await manager
      .createQueryBuilder(OrderItem, 'item')
      .innerJoin(Order, 'order', 'order.id = item.order_id')
      .select('COALESCE(SUM(item.quantity), 0)', 'reservedQuantity')
      .where('item.product_id = :productId', { productId: product.id })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [OrderStatus.PENDING, OrderStatus.RENTING],
      })
      .andWhere('order.rental_start_date <= :rentalEndDate', { rentalEndDate })
      .andWhere('order.rental_end_date >= :rentalStartDate', {
        rentalStartDate,
      })
      .getRawOne<{ reservedQuantity: string }>();

    const reservedQuantity = Number(reservedRow?.reservedQuantity ?? 0);

    return Math.max(
      0,
      product.stockQuantity - product.damagedQuantity - reservedQuantity,
    );
  }

  private getChargeableRentalDays(
    rentalStartDate: string,
    rentalEndDate: string,
  ) {
    const startDate = new Date(`${rentalStartDate}T00:00:00Z`);
    const endDate = new Date(`${rentalEndDate}T00:00:00Z`);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Ngày thuê hoặc ngày trả không hợp lệ');
    }

    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays <= 0) {
      throw new BadRequestException('Ngày trả phải bằng hoặc sau ngày thuê');
    }

    return diffDays;
  }
}
