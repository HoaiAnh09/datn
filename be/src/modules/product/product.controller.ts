import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '../../common/constants/roles.constant';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ProductService } from './product.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  RestoreDamagedProductDto,
} from './product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from '../../common/utils/upload.service';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async create(@Body() dto: CreateProductDto) {
    const product = await this.productService.create(dto);

    return {
      success: true,
      message: 'Thêm sản phẩm thành công',
      data: product,
    };
  }

  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    const product = await this.productService.update(id, dto);

    return {
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: product,
    };
  }

  @Put(':id/restore-damaged')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async restoreDamagedStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RestoreDamagedProductDto,
  ) {
    const product = await this.productService.restoreDamagedStock(
      id,
      dto.quantity,
    );

    return {
      success: true,
      message: 'Khôi phục hàng hư thành công',
      data: product,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async delete(@Param('id', ParseIntPipe) id: number) {
    const result = await this.productService.delete(id);

    return {
      success: true,
      message: 'Xóa sản phẩm thành công',
      data: result,
    };
  }

  @Post(':id/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const imageUrl = await this.uploadService.uploadImage(file);
    const product = await this.productService.updateImage(id, imageUrl);

    return {
      success: true,
      message: 'Tải ảnh sản phẩm thành công',
      data: product,
    };
  }
}
