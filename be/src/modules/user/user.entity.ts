import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { Role } from '../../common/constants/roles.constant';

@Entity('users')
@Index(['username'], { unique: true })
@Index(['phoneNumber'])
export class User extends BaseEntity {
  @Column()
  username: string;

  @Column()
  password: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'phone_number', type: 'varchar', nullable: true })
  phoneNumber: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'enum', enum: Role, default: Role.OWNER })
  role: Role;
}

export class UserResponseDto {
  id: number;
  username: string;
  fullName: string;
  phoneNumber: string | null;
  address: string | null;
  role: Role;
  createdAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.username = user.username;
    this.fullName = user.fullName;
    this.phoneNumber = user.phoneNumber ?? null;
    this.address = user.address ?? null;
    this.role = user.role;
    this.createdAt = user.createdAt;
  }
}
