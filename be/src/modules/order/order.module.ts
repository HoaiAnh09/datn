import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilsModule } from '../../common/utils/utils.module';
import { Product } from '../product/product.entity';
import { ProductModule } from '../product/product.module';
import { User } from '../user/user.entity';
import { OrderController } from './order.controller';
import { Order, OrderItem } from './order.entity';
import { OrderService } from './order.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product, User]),
    ProductModule,
    UtilsModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
