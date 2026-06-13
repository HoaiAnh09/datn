import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsNumber({}, { message: 'Product id must be a number' })
  @Type(() => Number)
  productId: number;

  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be greater than 0' })
  @Type(() => Number)
  quantity: number;
}

export class CreateOrderDto {
  @IsNumber({}, { message: 'Customer id must be a number' })
  @Type(() => Number)
  customerId: number;

  @IsDateString({}, { message: 'Rental start date is invalid' })
  rentalStartDate: string;

  @IsDateString({}, { message: 'Rental end date is invalid' })
  rentalEndDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsString()
  @IsOptional()
  note?: string;
}

export class ReturnOrderItemDto {
  @IsNumber({}, { message: 'Product id must be a number' })
  @Type(() => Number)
  productId: number;

  @IsNumber({}, { message: 'Damaged quantity must be a number' })
  @Min(0, { message: 'Damaged quantity cannot be negative' })
  @Type(() => Number)
  damagedQuantity: number;
}

export class ReturnOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnOrderItemDto)
  itemPenalties: ReturnOrderItemDto[];

  @IsNumber({}, { message: 'Extra penalty must be a number' })
  @Min(0, { message: 'Extra penalty cannot be negative' })
  @Type(() => Number)
  extraPenaltyAmount: number;

  @IsString()
  @IsOptional()
  extraPenaltyReason?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class PaymentDto {
  @IsString()
  @IsOptional()
  note?: string;
}

export class OrderQueryDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  customerId?: number;

  @IsDateString({}, { message: 'Date from is invalid' })
  @IsOptional()
  dateFrom?: string;

  @IsDateString({}, { message: 'Date to is invalid' })
  @IsOptional()
  dateTo?: string;
}
