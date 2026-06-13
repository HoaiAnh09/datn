import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateShopSettingsDto } from './shop.dto';
import { ShopService } from './shop.service';

@Controller('shop-settings')
@UseGuards(JwtAuthGuard)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get()
  getSettings() {
    return this.shopService.getSettings();
  }

  @Put()
  updateSettings(@Body() dto: UpdateShopSettingsDto) {
    return this.shopService.updateSettings(dto);
  }
}
