import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { ShopService } from '../../modules/shop/shop.service';

@Injectable()
export class QrService {
  constructor(private readonly shopService: ShopService) {}

  async generatePaymentQr(
    orderId: number,
    amount: number,
  ): Promise<string> {
    const shop = await this.shopService.getSettingsEntity();

    const paymentData = {
      orderId,
      amount,
      bank: shop.bankName || 'VietcomBank',
      accountNumber: shop.bankAccountNumber || '1234567890',
      accountName: shop.bankAccountName || shop.shopName,
      content: `Thanh toan don #${orderId}`,
    };

    const qrString = JSON.stringify(paymentData);
    const qrDataUrl = await QRCode.toDataURL(qrString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    return qrDataUrl;
  }
}
