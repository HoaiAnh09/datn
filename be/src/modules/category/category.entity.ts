import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';

@Entity('categories')
export class Category extends BaseEntity {
  @Index()
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany('Product', 'categoryRel')
  products: any[];
}

export class CategoryResponseDto {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(category: Category) {
    this.id = category.id;
    this.name = category.name;
    this.description = category.description;
    this.createdAt = category.createdAt;
    this.updatedAt = category.updatedAt;
  }
}
