import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Category, CategoryResponseDto } from './category.entity';
import { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto } from './category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const category = this.categoryRepo.create(dto);
    const saved = await this.categoryRepo.save(category);
    return new CategoryResponseDto(saved);
  }

  async findAll(query: CategoryQueryDto): Promise<CategoryResponseDto[]> {
    const where: any = {};

    if (query.search) {
      where.name = Like(`%${query.search}%`);
    }

    const categories = await this.categoryRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return categories.map((c) => new CategoryResponseDto(c));
  }

  async findById(id: number): Promise<CategoryResponseDto> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    return new CategoryResponseDto(category);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    Object.assign(category, dto);
    const saved = await this.categoryRepo.save(category);
    return new CategoryResponseDto(saved);
  }

  async delete(id: number): Promise<void> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    await this.categoryRepo.softDelete(id);
  }
}
