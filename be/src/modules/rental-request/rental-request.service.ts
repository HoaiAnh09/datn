import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateOrderItemDto } from '../order/order.dto';
import { OrderSource } from '../order/order.entity';
import { OrderService } from '../order/order.service';
import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';
import {
  ApproveRentalRequestDto,
  CreateRentalRequestDto,
  RentalRequestQueryDto,
} from './rental-request.dto';
import {
  RentalRequest,
  RentalRequestItem,
  RentalRequestResponseDto,
  RentalRequestStatus,
} from './rental-request.entity';

@Injectable()
export class RentalRequestService {
  constructor(
    @InjectRepository(RentalRequest)
    private readonly rentalRequestRepo: Repository<RentalRequest>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly orderService: OrderService,
  ) {}

  async create(
    userId: number,
    dto: CreateRentalRequestDto,
  ): Promise<RentalRequestResponseDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Khong tim thay nguoi dung');
    }

    if (dto.rentalStartDate > dto.rentalEndDate) {
      throw new BadRequestException('Ngay tra phai bang hoac sau ngay thue');
    }

    const items = await this.buildRequestItems(
      dto.rentalStartDate,
      dto.rentalEndDate,
      dto.items,
    );

    const request = this.rentalRequestRepo.create({
      userId,
      rentalStartDate: dto.rentalStartDate,
      rentalEndDate: dto.rentalEndDate,
      note: dto.note?.trim() || null,
      status: RentalRequestStatus.SUBMITTED,
    });

    const saved = await this.rentalRequestRepo.save(request);
    const requestItems = items.map((item) =>
      this.rentalRequestRepo.manager.create(RentalRequestItem, {
        ...item,
        requestId: saved.id,
      }),
    );
    await this.rentalRequestRepo.manager.save(requestItems);

    return this.findByIdForUser(saved.id, userId);
  }

  async findAll(query: RentalRequestQueryDto): Promise<RentalRequestResponseDto[]> {
    const queryBuilder = this.rentalRequestRepo
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.user', 'user')
      .leftJoinAndSelect('request.items', 'item')
      .leftJoinAndSelect('item.product', 'product')
      .orderBy('request.createdAt', 'DESC');

    if (query.status) {
      queryBuilder.andWhere('request.status = :status', {
        status: query.status,
      });
    }

    if (query.search?.trim()) {
      queryBuilder.andWhere(
        '(user.full_name ILIKE :search OR user.phone_number ILIKE :search OR user.username ILIKE :search OR CAST(request.id AS TEXT) ILIKE :search)',
        {
          search: `%${query.search.trim()}%`,
        },
      );
    }

    const requests = await queryBuilder.getMany();
    return requests.map((request) => new RentalRequestResponseDto(request));
  }

  async findMine(userId: number): Promise<RentalRequestResponseDto[]> {
    const requests = await this.rentalRequestRepo.find({
      where: { userId },
      relations: {
        user: true,
        items: { product: true },
      },
      order: { createdAt: 'DESC' },
    });

    return requests.map((request) => new RentalRequestResponseDto(request));
  }

  async findByIdForOwner(id: number): Promise<RentalRequestResponseDto> {
    const request = await this.findEntityById(id);
    return new RentalRequestResponseDto(request);
  }

  async findByIdForUser(
    id: number,
    userId: number,
  ): Promise<RentalRequestResponseDto> {
    const request = await this.findEntityById(id);
    if (request.userId !== userId) {
      throw new NotFoundException('Khong tim thay yeu cau dat thue');
    }

    return new RentalRequestResponseDto(request);
  }

  async cancel(id: number, userId: number): Promise<RentalRequestResponseDto> {
    const request = await this.findEntityById(id);
    if (request.userId !== userId) {
      throw new NotFoundException('Khong tim thay yeu cau dat thue');
    }

    if (request.status !== RentalRequestStatus.SUBMITTED) {
      throw new BadRequestException('Chi yeu cau moi gui moi duoc huy');
    }

    request.status = RentalRequestStatus.CANCELLED;
    await this.rentalRequestRepo.save(request);
    return new RentalRequestResponseDto(request);
  }

  async approve(
    id: number,
    dto: ApproveRentalRequestDto,
  ): Promise<RentalRequestResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const request = await queryRunner.manager.findOne(RentalRequest, {
        where: { id },
        relations: {
          user: true,
          items: { product: true },
        },
      });

      if (!request) {
        throw new NotFoundException('Khong tim thay yeu cau dat thue');
      }

      if (request.status !== RentalRequestStatus.SUBMITTED) {
        throw new BadRequestException('Chi yeu cau moi gui moi duoc duyet');
      }

      const order = await this.orderService.createOrderWithManager(
        queryRunner.manager,
        {
          renterUserId: request.userId,
          renterFullName: request.user.fullName,
          renterPhoneNumber: request.user.phoneNumber ?? undefined,
          renterAddress: request.user.address ?? undefined,
          rentalStartDate: request.rentalStartDate,
          rentalEndDate: request.rentalEndDate,
          items: request.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          note: request.note ?? undefined,
          source: OrderSource.CUSTOMER_REQUEST,
          requestId: request.id,
          pickupDeadlineAt: dto.pickupDeadlineAt,
        },
      );

      request.status = RentalRequestStatus.APPROVED;
      request.reviewNote = dto.reviewNote?.trim() || null;
      request.approvedOrderId = order.id;
      request.reviewedAt = new Date();
      await queryRunner.manager.save(request);
      await queryRunner.commitTransaction();

      return new RentalRequestResponseDto(request);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async reject(id: number, reviewNote: string): Promise<RentalRequestResponseDto> {
    const request = await this.findEntityById(id);

    if (request.status !== RentalRequestStatus.SUBMITTED) {
      throw new BadRequestException('Chi yeu cau moi gui moi duoc tu choi');
    }

    request.status = RentalRequestStatus.REJECTED;
    request.reviewNote = reviewNote.trim();
    request.reviewedAt = new Date();
    await this.rentalRequestRepo.save(request);

    return new RentalRequestResponseDto(request);
  }

  private async findEntityById(id: number): Promise<RentalRequest> {
    const request = await this.rentalRequestRepo.findOne({
      where: { id },
      relations: {
        user: true,
        items: { product: true },
      },
    });

    if (!request) {
      throw new NotFoundException('Khong tim thay yeu cau dat thue');
    }

    return request;
  }

  private async buildRequestItems(
    rentalStartDate: string,
    rentalEndDate: string,
    items: CreateOrderItemDto[],
  ): Promise<RentalRequestItem[]> {
    const result: RentalRequestItem[] = [];

    for (const item of items) {
      const product = await this.productRepo.findOne({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(`Khong tim thay san pham ${item.productId}`);
      }

      const availabilityMap = await this.orderService.getAvailabilityMap(
        [product.id],
        rentalStartDate,
        rentalEndDate,
      );

      if ((availabilityMap.get(product.id) ?? 0) < item.quantity) {
        throw new BadRequestException(
          `San pham "${product.name}" khong du so luong kha dung`,
        );
      }

      result.push(
        this.rentalRequestRepo.manager.create(RentalRequestItem, {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: Number(product.rentalPrice),
          depositAmount: Number(product.depositAmount),
        }),
      );
    }

    return result;
  }
}
