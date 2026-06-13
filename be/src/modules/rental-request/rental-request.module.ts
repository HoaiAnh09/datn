import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../product/product.entity';
import { ProductModule } from '../product/product.module';
import { User } from '../user/user.entity';
import { OrderModule } from '../order/order.module';
import { RentalRequestController } from './rental-request.controller';
import { RentalRequest, RentalRequestItem } from './rental-request.entity';
import { RentalRequestService } from './rental-request.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RentalRequest, RentalRequestItem, User, Product]),
    ProductModule,
    OrderModule,
  ],
  controllers: [RentalRequestController],
  providers: [RentalRequestService],
  exports: [RentalRequestService],
})
export class RentalRequestModule {}
