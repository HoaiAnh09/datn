import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopController } from './shop.controller';
import { ShopSettings } from './shop.entity';
import { ShopService } from './shop.service';

@Module({
  imports: [TypeOrmModule.forFeature([ShopSettings])],
  controllers: [ShopController],
  providers: [ShopService],
  exports: [ShopService],
})
export class ShopModule {}
