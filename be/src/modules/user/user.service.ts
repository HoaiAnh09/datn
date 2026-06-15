import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role } from '../../common/constants/roles.constant';
import { CreateUserDto, UpdateUserDto } from './user.dto';
import { User, UserResponseDto } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { username } });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepo.find({
      order: { createdAt: 'DESC' },
    });

    return users.map((user) => new UserResponseDto(user));
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    return this.createUser(dto);
  }

  async registerCustomer(dto: CreateUserDto): Promise<UserResponseDto> {
    return this.createUser({
      ...dto,
      role: Role.CUSTOMER,
    });
  }

  async update(id: number, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    Object.assign(user, {
      ...dto,
      phoneNumber: dto.phoneNumber?.trim() || null,
      address: dto.address?.trim() || null,
    });

    const saved = await this.userRepo.save(user);
    return new UserResponseDto(saved);
  }

  async changePassword(
    id: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new ConflictException('Mật khẩu cũ không chính xác');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
  }

  async delete(id: number): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    await this.userRepo.softDelete(id);
  }

  private async createUser(dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.findByUsername(dto.username);
    if (existing) {
      throw new ConflictException('Tên đăng nhập đã tồn tại');
    }

    const role = dto.role ?? Role.OWNER;
    if (role === Role.CUSTOMER && !dto.phoneNumber?.trim()) {
      throw new BadRequestException('Khách hàng phải có số điện thoại');
    }

    const user = this.userRepo.create({
      username: dto.username.trim(),
      password: await bcrypt.hash(dto.password, 10),
      fullName: dto.fullName.trim(),
      phoneNumber: dto.phoneNumber?.trim() || null,
      address: dto.address?.trim() || null,
      role,
    });

    const saved = await this.userRepo.save(user);
    return new UserResponseDto(saved);
  }
}
