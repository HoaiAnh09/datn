import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Role } from '../../common/constants/roles.constant';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApproveRentalRequestDto,
  CreateRentalRequestDto,
  RejectRentalRequestDto,
  RentalRequestQueryDto,
} from './rental-request.dto';
import { RentalRequestService } from './rental-request.service';

@Controller('rental-requests')
@UseGuards(JwtAuthGuard)
export class RentalRequestController {
  constructor(private readonly rentalRequestService: RentalRequestService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  async create(@Req() req: Request, @Body() dto: CreateRentalRequestDto) {
    const user = req.user as { id: number };
    const request = await this.rentalRequestService.create(user.id, dto);

    return {
      success: true,
      message: 'Gửi yêu cầu đặt thuê thành công',
      data: request,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  findAll(@Query() query: RentalRequestQueryDto) {
    return this.rentalRequestService.findAll(query);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  findMine(@Req() req: Request) {
    const user = req.user as { id: number };
    return this.rentalRequestService.findMine(user.id);
  }

  @Get(':id')
  async findById(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const user = req.user as { id: number; role: Role };

    if (user.role === Role.OWNER) {
      return this.rentalRequestService.findByIdForOwner(id);
    }

    return this.rentalRequestService.findByIdForUser(id, user.id);
  }

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  async cancel(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const user = req.user as { id: number };
    const request = await this.rentalRequestService.cancel(id, user.id);

    return {
      success: true,
      message: 'Hủy yêu cầu thành công',
      data: request,
    };
  }

  @Put(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveRentalRequestDto,
  ) {
    const request = await this.rentalRequestService.approve(id, dto);

    return {
      success: true,
      message: 'Duyệt yêu cầu thành công',
      data: request,
    };
  }

  @Put(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectRentalRequestDto,
  ) {
    const request = await this.rentalRequestService.reject(id, dto.reviewNote);

    return {
      success: true,
      message: 'Từ chối yêu cầu thành công',
      data: request,
    };
  }
}
