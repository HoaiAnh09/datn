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
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Role } from '../../common/constants/roles.constant';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PdfService } from '../../common/utils/pdf.service';
import { QrService } from '../../common/utils/qr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOrderDto, OrderQueryDto, ReturnOrderDto } from './order.dto';
import { OrderService } from './order.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly qrService: QrService,
    private readonly pdfService: PdfService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async create(@Body() dto: CreateOrderDto) {
    const order = await this.orderService.create(dto);
    const qrCode = await this.qrService.generatePaymentQr(
      order.id,
      Number(order.rentalPrice) + Number(order.depositAmount),
    );

    return {
      success: true,
      message: 'Tạo đơn thuê thành công',
      data: { ...order, qrCode },
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  findAll(@Query() query: OrderQueryDto) {
    return this.orderService.findAll(query);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  findMine(@Req() req: Request) {
    const user = req.user as { id: number };
    return this.orderService.findMine(user.id);
  }

  @Get(':id')
  async findById(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const user = req.user as { id: number; role: Role };

    if (user.role === Role.OWNER) {
      return this.orderService.findById(id);
    }

    return this.orderService.findByIdForUser(id, user.id);
  }

  @Put(':id/confirm-payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async confirmPayment(@Param('id', ParseIntPipe) id: number) {
    const order = await this.orderService.confirmPayment(id);

    return {
      success: true,
      message: 'Xác nhận thanh toán thành công',
      data: order,
    };
  }

  @Put(':id/return')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async returnOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReturnOrderDto,
  ) {
    const order = await this.orderService.returnOrder(id, dto);

    return {
      success: true,
      message: 'Trả đơn thành công',
      data: order,
    };
  }

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async cancel(@Param('id', ParseIntPipe) id: number) {
    const order = await this.orderService.cancel(id);

    return {
      success: true,
      message: 'Hủy đơn thành công',
      data: order,
    };
  }

  @Get(':id/invoice')
  async downloadInvoice(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const user = req.user as { id: number; role: Role };
    const order =
      user.role === Role.OWNER
        ? await this.orderService.findById(id)
        : await this.orderService.findByIdForUser(id, user.id);
    const pdfBuffer = await this.pdfService.generateInvoice(order);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
    });

    res.send(pdfBuffer);
  }

  @Get(':id/receipt')
  async downloadReceipt(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const user = req.user as { id: number; role: Role };
    const order =
      user.role === Role.OWNER
        ? await this.orderService.findById(id)
        : await this.orderService.findByIdForUser(id, user.id);

    const pdfBuffer = await this.pdfService.generateReceipt(
      order,
      Number(order.refundAmount),
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="receipt-${id}.pdf"`,
    });

    res.send(pdfBuffer);
  }
}
