import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { CreateOrderDto, CreateOrderItemDto, OrderQueryDto, ReturnOrderDto } from './order.dto';
import {
  Order,
  OrderItem,
  OrderResponseDto,
  OrderSource,
  OrderStatus,
  PaymentStatus,
} from './order.entity';
import { Product } from '../product/product.entity';

type InternalCreateOrderInput = {
  renterUserId?: number;
  renterFullName: string;
  renterPhoneNumber?: string;
  renterAddress?: string;
  rentalStartDate: string;
  rentalEndDate: string;
  items: CreateOrderItemDto[];
  note?: string;
  source?: OrderSource;
  requestId?: number;
  pickupDeadlineAt?: string;
};

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateOrderDto): Promise<OrderResponseDto> {
    return this.createOrder(dto);
  }

  async createFromApprovedRequest(
    dto: InternalCreateOrderInput,
  ): Promise<OrderResponseDto> {
    return this.createOrder({
      ...dto,
      source: OrderSource.CUSTOMER_REQUEST,
    });
  }

  async findAll(query: OrderQueryDto): Promise<OrderResponseDto[]> {
    if (query.dateFrom && query.dateTo && query.dateFrom > query.dateTo) {
      throw new BadRequestException('Khoang thoi gian loc khong hop le');
    }

    const queryBuilder = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.renterUser', 'renterUser')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.product', 'product')
      .orderBy('order.created_at', 'DESC');

    if (query.status) {
      queryBuilder.andWhere('order.status = :status', { status: query.status });
    }

    if (query.source) {
      queryBuilder.andWhere('order.source = :source', { source: query.source });
    }

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      const orderId = Number(query.search.trim());
      queryBuilder.andWhere(
        '(order.renter_full_name ILIKE :search OR order.renter_phone_number ILIKE :search OR CAST(order.id AS TEXT) ILIKE :search' +
          (Number.isInteger(orderId) ? ' OR order.id = :orderId' : '') +
          ')',
        {
          search,
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

  async findMine(userId: number): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepo.find({
      where: { renterUserId: userId },
      relations: {
        renterUser: true,
        items: { product: true },
      },
      order: { createdAt: 'DESC' },
    });

    return orders.map((order) => new OrderResponseDto(order));
  }

  async findById(id: number): Promise<OrderResponseDto> {
    const order = await this.findEntityById(id);
    return new OrderResponseDto(order);
  }

  async findByIdForUser(id: number, userId: number): Promise<OrderResponseDto> {
    const order = await this.findEntityById(id);
    if (order.renterUserId !== userId) {
      throw new NotFoundException('Khong tim thay don hang');
    }

    return new OrderResponseDto(order);
  }

  async confirmPayment(id: number): Promise<OrderResponseDto> {
    const order = await this.orderRepo.findOne({ where: { id } });

    if (!order) {
      throw new NotFoundException('Khong tim thay don hang');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Chi don cho thanh toan moi duoc xac nhan');
    }

    order.paymentStatus = PaymentStatus.DEPOSIT_PAID;
    order.status = OrderStatus.RENTING;
    await this.orderRepo.save(order);

    return this.findById(id);
  }

  async returnOrder(id: number, dto: ReturnOrderDto): Promise<OrderResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id },
        relations: { items: { product: true } },
      });

      if (!order) {
        throw new NotFoundException('Khong tim thay don hang');
      }

      if (order.status !== OrderStatus.RENTING) {
        throw new BadRequestException('Chi don dang cho thue moi duoc tra');
      }

      if (dto.extraPenaltyAmount > 0 && !dto.extraPenaltyReason?.trim()) {
        throw new BadRequestException(
          'Can nhap ly do khi co phu phi khac',
        );
      }

      const uniqueProductIds = new Set<number>();
      let totalPenaltyAmount = 0;
      const summaryLines: string[] = [];

      for (const itemPenalty of dto.itemPenalties) {
        if (uniqueProductIds.has(itemPenalty.productId)) {
          throw new BadRequestException('San pham bi lap trong du lieu tra hang');
        }

        uniqueProductIds.add(itemPenalty.productId);
        const orderItem = order.items.find(
          (item) => item.productId === itemPenalty.productId,
        );

        if (!orderItem) {
          throw new BadRequestException(
            `San pham ${itemPenalty.productId} khong thuoc don hang nay`,
          );
        }

        if (itemPenalty.damagedQuantity > orderItem.quantity) {
          throw new BadRequestException(
            `So luong hu hong cua "${orderItem.product?.name ?? orderItem.productId}" vuot qua so luong da thue`,
          );
        }

        if (itemPenalty.damagedQuantity === 0) {
          continue;
        }

        const penaltyPerUnit = Number(orderItem.product?.damageFee ?? 0);
        const linePenalty = penaltyPerUnit * itemPenalty.damagedQuantity;
        totalPenaltyAmount += linePenalty;
        summaryLines.push(
          `${orderItem.product?.name ?? `Product ${orderItem.productId}`}: ${itemPenalty.damagedQuantity} x ${penaltyPerUnit} = ${linePenalty}`,
        );
      }

      if (dto.extraPenaltyAmount > 0) {
        totalPenaltyAmount += dto.extraPenaltyAmount;
        summaryLines.push(
          `Phu phi khac: ${dto.extraPenaltyAmount} (${dto.extraPenaltyReason?.trim()})`,
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
            `Khong tim thay san pham ${itemPenalty.productId}`,
          );
        }

        product.damagedQuantity += itemPenalty.damagedQuantity;
        if (product.damagedQuantity > product.stockQuantity) {
          throw new BadRequestException(
            `So luong hu cua "${product.name}" vuot qua tong ton kho`,
          );
        }

        await queryRunner.manager.save(product);
      }

      const refundAmount = Math.max(
        0,
        Number(order.depositAmount) - totalPenaltyAmount,
      );

      const noteParts = [order.note?.trim(), dto.note?.trim()].filter(Boolean);
      if (summaryLines.length > 0) {
        noteParts.push(`Return summary: ${summaryLines.join('; ')}`);
      }

      order.penaltyAmount = totalPenaltyAmount;
      order.refundAmount = refundAmount;
      order.status = OrderStatus.RETURNED;
      order.paymentStatus = PaymentStatus.REFUNDED;
      order.note = noteParts.join('\n') || null;

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
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Khong tim thay don hang');
    }

    if (order.status === OrderStatus.RETURNED) {
      throw new BadRequestException('Don da tra khong the huy');
    }

    order.status = OrderStatus.CANCELLED;
    await this.orderRepo.save(order);
    return this.findById(id);
  }

  async getAvailabilityMap(
    productIds: number[],
    rentalStartDate: string,
    rentalEndDate: string,
  ): Promise<Map<number, number>> {
    return this.buildAvailabilityMap(
      this.orderRepo.manager,
      productIds,
      rentalStartDate,
      rentalEndDate,
    );
  }

  private async createOrder(dto: InternalCreateOrderInput): Promise<OrderResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedOrder = await this.createOrderWithManager(queryRunner.manager, dto);
      await queryRunner.commitTransaction();
      return this.findById(savedOrder.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createOrderWithManager(
    manager: EntityManager,
    dto: InternalCreateOrderInput,
  ): Promise<Order> {
    const rentalDays = this.getChargeableRentalDays(
      dto.rentalStartDate,
      dto.rentalEndDate,
    );

    let totalRentalPrice = 0;
    let totalDepositAmount = 0;
    const orderItems: Partial<OrderItem>[] = [];

    if (dto.renterUserId) {
      const renter = await manager.findOne(User, {
        where: { id: dto.renterUserId },
      });

      if (!renter) {
        throw new NotFoundException('Khong tim thay nguoi thue duoc lien ket');
      }
    }

    for (const item of dto.items) {
      const product = await manager.findOne(Product, {
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(`Khong tim thay san pham ${item.productId}`);
      }

      const availableQuantity = await this.getAvailableQuantity(
        manager,
        product,
        dto.rentalStartDate,
        dto.rentalEndDate,
      );

      if (availableQuantity < item.quantity) {
        throw new BadRequestException(
          `San pham "${product.name}" khong du so luong kha dung trong khoang thoi gian thue`,
        );
      }

      totalRentalPrice += Number(product.rentalPrice) * item.quantity * rentalDays;
      totalDepositAmount += Number(product.depositAmount) * item.quantity;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(product.rentalPrice),
      });
    }

    const order = manager.create(Order, {
      renterUserId: dto.renterUserId ?? null,
      renterFullName: dto.renterFullName.trim(),
      renterPhoneNumber: dto.renterPhoneNumber?.trim() || null,
      renterAddress: dto.renterAddress?.trim() || null,
      requestId: dto.requestId ?? null,
      source: dto.source ?? OrderSource.OWNER_DIRECT,
      rentalStartDate: dto.rentalStartDate,
      rentalEndDate: dto.rentalEndDate,
      rentalPrice: totalRentalPrice,
      depositAmount: totalDepositAmount,
      note: dto.note?.trim() || null,
      pickupDeadlineAt: dto.pickupDeadlineAt
        ? new Date(dto.pickupDeadlineAt)
        : null,
    });

    const savedOrder = await manager.save(order);

    const items = orderItems.map((item) =>
      manager.create(OrderItem, {
        ...item,
        orderId: savedOrder.id,
      }),
    );
    await manager.save(items);

    return savedOrder;
  }

  private async findEntityById(id: number): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: {
        renterUser: true,
        items: { product: true },
      },
    });

    if (!order) {
      throw new NotFoundException('Khong tim thay don hang');
    }

    return order;
  }

  private async getAvailableQuantity(
    manager: EntityManager,
    product: Product,
    rentalStartDate: string,
    rentalEndDate: string,
  ): Promise<number> {
    const availabilityMap = await this.buildAvailabilityMap(
      manager,
      [product.id],
      rentalStartDate,
      rentalEndDate,
    );

    return availabilityMap.get(product.id) ?? 0;
  }

  private async buildAvailabilityMap(
    manager: EntityManager,
    productIds: number[],
    rentalStartDate: string,
    rentalEndDate: string,
  ): Promise<Map<number, number>> {
    const availabilityMap = new Map<number, number>();

    if (productIds.length === 0) {
      return availabilityMap;
    }

    const products = await manager.find(Product, {
      where: productIds.map((id) => ({ id })),
    });

    const reservedRows = await manager
      .createQueryBuilder(OrderItem, 'item')
      .innerJoin(Order, 'order', 'order.id = item.order_id')
      .select('item.product_id', 'productId')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'reservedQuantity')
      .where('item.product_id IN (:...productIds)', { productIds })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [OrderStatus.PENDING, OrderStatus.RENTING],
      })
      .andWhere('order.rental_start_date <= :rentalEndDate', {
        rentalEndDate,
      })
      .andWhere('order.rental_end_date >= :rentalStartDate', {
        rentalStartDate,
      })
      .groupBy('item.product_id')
      .getRawMany<{ productId: string; reservedQuantity: string }>();

    const reservedMap = new Map<number, number>(
      reservedRows.map((row) => [
        Number(row.productId),
        Number(row.reservedQuantity),
      ]),
    );

    for (const product of products) {
      availabilityMap.set(
        product.id,
        Math.max(
          0,
          product.stockQuantity -
            product.damagedQuantity -
            (reservedMap.get(product.id) ?? 0),
        ),
      );
    }

    return availabilityMap;
  }

  private getChargeableRentalDays(
    rentalStartDate: string,
    rentalEndDate: string,
  ): number {
    const startDate = new Date(`${rentalStartDate}T00:00:00Z`);
    const endDate = new Date(`${rentalEndDate}T00:00:00Z`);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Ngay thue hoac ngay tra khong hop le');
    }

    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays <= 0) {
      throw new BadRequestException('Ngay tra phai bang hoac sau ngay thue');
    }

    return diffDays;
  }
}
