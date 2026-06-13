import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from '../../common/constants/roles.constant';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Ten dang nhap khong duoc de trong' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Mat khau khong duoc de trong' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Ho ten khong duoc de trong' })
  fullName: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Mat khau cu khong duoc de trong' })
  oldPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Mat khau moi khong duoc de trong' })
  newPassword: string;
}
