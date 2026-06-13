import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';

@Entity('shop_settings')
export class ShopSettings extends BaseEntity {
  @Column({ name: 'shop_name', default: 'UniCo Rental' })
  shopName: string;

  @Column({ name: 'legal_name', nullable: true })
  legalName: string;

  @Column({ default: '0900 000 000' })
  hotline: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column({ name: 'tax_code', nullable: true })
  taxCode: string;

  @Column({ name: 'bank_name', nullable: true })
  bankName: string;

  @Column({ name: 'bank_account_number', nullable: true })
  bankAccountNumber: string;

  @Column({ name: 'bank_account_name', nullable: true })
  bankAccountName: string;

  @Column({ name: 'invoice_footer', nullable: true })
  invoiceFooter: string;

  @Column({ name: 'hero_title', type: 'text', nullable: true })
  heroTitle: string;

  @Column({ name: 'hero_subtitle', type: 'text', nullable: true })
  heroSubtitle: string;
}

export class ShopSettingsResponseDto {
  id: number;
  shopName: string;
  legalName: string;
  hotline: string;
  email: string;
  address: string;
  taxCode: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  invoiceFooter: string;
  heroTitle: string;
  heroSubtitle: string;

  constructor(settings: ShopSettings) {
    this.id = settings.id;
    this.shopName = settings.shopName;
    this.legalName = settings.legalName;
    this.hotline = settings.hotline;
    this.email = settings.email;
    this.address = settings.address;
    this.taxCode = settings.taxCode;
    this.bankName = settings.bankName;
    this.bankAccountNumber = settings.bankAccountNumber;
    this.bankAccountName = settings.bankAccountName;
    this.invoiceFooter = settings.invoiceFooter;
    this.heroTitle = settings.heroTitle;
    this.heroSubtitle = settings.heroSubtitle;
  }
}
