import { IsNotEmpty, IsString } from 'class-validator';
import { CreateUserDto } from '../user/user.dto';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Ten dang nhap khong duoc de trong' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Mat khau khong duoc de trong' })
  password: string;
}

export class RegisterDto extends CreateUserDto {}
