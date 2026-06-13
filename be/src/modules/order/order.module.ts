import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order, OrderItem } from './order.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Product } from '../product/product.entity';
import { ProductModule } from '../product/product.module';
import { UtilsModule } from '../../common/utils/utils.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product]),
    ProductModule,
    UtilsModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
