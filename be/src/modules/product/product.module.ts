import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { UploadModule } from '../../common/utils/upload.module';
import { Order, OrderItem } from '../order/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Order, OrderItem]), UploadModule],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
