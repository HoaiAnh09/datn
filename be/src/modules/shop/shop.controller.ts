import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { Role } from '../../common/constants/roles.constant';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateShopSettingsDto } from './shop.dto';
import { ShopService } from './shop.service';

@Controller('shop-settings')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get()
  getSettings() {
    return this.shopService.getSettings();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async updateSettings(@Body() dto: UpdateShopSettingsDto) {
    const settings = await this.shopService.updateSettings(dto);

    return {
      success: true,
      message: 'Cập nhật thông tin cửa hàng thành công',
      data: settings,
    };
  }
}
