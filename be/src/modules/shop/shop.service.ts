import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateShopSettingsDto } from './shop.dto';
import { ShopSettings, ShopSettingsResponseDto } from './shop.entity';

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(ShopSettings)
    private readonly shopRepo: Repository<ShopSettings>,
  ) {}

  async getSettings(): Promise<ShopSettingsResponseDto> {
    const settings = await this.getOrCreateSettingsEntity();
    return new ShopSettingsResponseDto(settings);
  }

  async updateSettings(
    dto: UpdateShopSettingsDto,
  ): Promise<ShopSettingsResponseDto> {
    const settings = await this.getOrCreateSettingsEntity();
    Object.assign(settings, dto);
    const saved = await this.shopRepo.save(settings);
    return new ShopSettingsResponseDto(saved);
  }

  async getSettingsEntity(): Promise<ShopSettings> {
    return this.getOrCreateSettingsEntity();
  }

  private async getOrCreateSettingsEntity() {
    const existing = await this.shopRepo.find({
      order: { id: 'ASC' },
      take: 1,
    });

    if (existing[0]) {
      return existing[0];
    }

    const created = this.shopRepo.create({
      shopName: 'UniCo Rental',
      hotline: '0900 000 000',
      address: 'Cua hang cho thue trang phuc',
      invoiceFooter: 'Cam on quy khach va hen gap lai',
    });

    return this.shopRepo.save(created);
  }
}
