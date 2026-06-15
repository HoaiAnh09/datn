import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderItem, OrderStatus } from '../order/order.entity';
import { Product } from '../product/product.entity';

function toIsoDateString(value: Date) {
  return value.toISOString().slice(0, 10);
}

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async getDashboard() {
    const totalOrders = await this.orderRepo.count();

    const totalRevenue = await this.orderRepo
      .createQueryBuilder('order')
      .select('SUM(order.rental_price + order.penalty_amount)', 'total')
      .where('order.status = :status', { status: OrderStatus.RETURNED })
      .getRawOne<{ total: string | null }>();

    const pendingOrders = await this.orderRepo.count({
      where: { status: OrderStatus.PENDING },
    });

    const rentingOrders = await this.orderRepo.count({
      where: { status: OrderStatus.RENTING },
    });

    const monthlyRevenue = await this.orderRepo
      .createQueryBuilder('order')
      .select("TO_CHAR(order.updated_at, 'YYYY-MM')", 'month')
      .addSelect('SUM(order.rental_price + order.penalty_amount)', 'revenue')
      .addSelect('COUNT(*)', 'orderCount')
      .where('order.status = :status', { status: OrderStatus.RETURNED })
      .groupBy("TO_CHAR(order.updated_at, 'YYYY-MM')")
      .orderBy("TO_CHAR(order.updated_at, 'YYYY-MM')", 'DESC')
      .limit(12)
      .getRawMany<{ month: string; revenue: string; orderCount: string }>();

    const topProducts = await this.orderRepo
      .createQueryBuilder('order')
      .innerJoin('order.items', 'item')
      .innerJoin('item.product', 'product')
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('SUM(item.quantity)', 'totalRented')
      .where('order.status IN (:...statuses)', {
        statuses: [OrderStatus.RENTING, OrderStatus.RETURNED],
      })
      .groupBy('product.id')
      .addGroupBy('product.name')
      .orderBy('SUM(item.quantity)', 'DESC')
      .limit(10)
      .getRawMany<{
        productId: string;
        productName: string;
        totalRented: string;
      }>();

    const products = await this.productRepo
      .createQueryBuilder('product')
      .orderBy('product.stock_quantity', 'ASC')
      .getMany();

    const availabilityMap = await this.getAvailabilityMap(
      products.map((product) => product.id),
    );

    const lowStockProducts = products
      .filter((product) => (availabilityMap.get(product.id) ?? 0) <= 5)
      .slice(0, 10);

    const recentOrders = await this.orderRepo
      .createQueryBuilder('order')
      .orderBy('order.created_at', 'DESC')
      .limit(5)
      .getMany();

    return {
      totalOrders,
      totalRevenue: Number(totalRevenue?.total ?? 0),
      pendingOrders,
      rentingOrders,
      monthlyRevenue: monthlyRevenue.reverse().map((row) => ({
        month: row.month,
        revenue: Number(row.revenue),
        orderCount: Number(row.orderCount),
      })),
      topProducts: topProducts.map((row) => ({
        productId: Number(row.productId),
        productName: row.productName,
        totalRented: Number(row.totalRented),
      })),
      lowStockProducts: lowStockProducts.map((product) => ({
        id: product.id,
        name: product.name,
        stockQuantity: product.stockQuantity,
        damagedQuantity: product.damagedQuantity,
        availableQuantity: availabilityMap.get(product.id) ?? 0,
      })),
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        renterName: order.renterFullName || `Don #${order.id}`,
        rentalStartDate: order.rentalStartDate,
        status: order.status,
      })),
    };
  }

  private async getAvailabilityMap(productIds: number[]) {
    const availabilityMap = new Map<number, number>();

    if (productIds.length === 0) {
      return availabilityMap;
    }

    const products = await this.productRepo.find({
      where: productIds.map((id) => ({ id })),
    });

    const today = toIsoDateString(new Date());
    const reservedRows = await this.orderItemRepo
      .createQueryBuilder('item')
      .innerJoin(Order, 'order', 'order.id = item.order_id')
      .select('item.product_id', 'productId')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'reservedQuantity')
      .where('item.product_id IN (:...productIds)', { productIds })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [OrderStatus.PENDING, OrderStatus.RENTING],
      })
      .andWhere('order.rental_start_date <= :today', { today })
      .andWhere('order.rental_end_date >= :today', { today })
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
}
