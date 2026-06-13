import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({}, { message: 'Giá thuê phải là số' })
  @Min(0, { message: 'Giá thuê không được âm' })
  @Type(() => Number)
  rentalPrice: number;

  @IsNumber({}, { message: 'Tiền đặt cọc phải là số' })
  @Min(0, { message: 'Tiền đặt cọc không được âm' })
  @Type(() => Number)
  depositAmount: number;

  @IsNumber({}, { message: 'Phí phạt hư hỏng phải là số' })
  @Min(0, { message: 'Phí phạt không được âm' })
  @Type(() => Number)
  damageFee: number;

  @IsNumber({}, { message: 'Số lượng tồn kho phải là số' })
  @Min(0, { message: 'Số lượng tồn kho không được âm' })
  @Type(() => Number)
  stockQuantity: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  rentalPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  depositAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  damageFee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  stockQuantity?: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;
}

export class ProductQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  rentalStartDate?: string;

  @IsString()
  @IsOptional()
  rentalEndDate?: string;
}

export class RestoreDamagedProductDto {
  @IsNumber({}, { message: 'Số lượng khôi phục phải là số' })
  @Min(1, { message: 'Số lượng khôi phục phải lớn hơn 0' })
  @Type(() => Number)
  quantity: number;
}
