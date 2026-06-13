import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { QrService } from './qr.service';
import { PdfService } from './pdf.service';
import { ShopModule } from '../../modules/shop/shop.module';

@Module({
  imports: [ShopModule],
  providers: [UploadService, QrService, PdfService],
  exports: [UploadService, QrService, PdfService],
})
export class UtilsModule {}
