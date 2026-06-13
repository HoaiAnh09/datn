import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { RentalRequestStatus } from './rental-request.entity';

export class CreateRentalRequestItemDto {
  @IsNumber({}, { message: 'Product id must be a number' })
  @Type(() => Number)
  productId: number;

  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be greater than 0' })
  @Type(() => Number)
  quantity: number;
}

export class CreateRentalRequestDto {
  @IsDateString({}, { message: 'Rental start date is invalid' })
  rentalStartDate: string;

  @IsDateString({}, { message: 'Rental end date is invalid' })
  rentalEndDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRentalRequestItemDto)
  items: CreateRentalRequestItemDto[];

  @IsString()
  @IsOptional()
  note?: string;
}

export class RentalRequestQueryDto {
  @IsEnum(RentalRequestStatus)
  @IsOptional()
  status?: RentalRequestStatus;

  @IsString()
  @IsOptional()
  search?: string;
}

export class ApproveRentalRequestDto {
  @IsDateString({}, { message: 'Pickup deadline is invalid' })
  @IsOptional()
  pickupDeadlineAt?: string;

  @IsString()
  @IsOptional()
  reviewNote?: string;
}

export class RejectRentalRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Review note is required' })
  reviewNote: string;
}
