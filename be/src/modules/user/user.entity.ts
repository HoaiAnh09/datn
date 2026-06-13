import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { Role } from '../../common/constants/roles.constant';

@Entity('users')
@Index(['username'], { unique: true })
export class User extends BaseEntity {
  @Column()
  username: string;

  @Column()
  password: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ type: 'enum', enum: Role, default: Role.OWNER })
  role: Role;
}

export class UserResponseDto {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  createdAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.username = user.username;
    this.fullName = user.fullName;
    this.role = user.role;
    this.createdAt = user.createdAt;
  }
}
