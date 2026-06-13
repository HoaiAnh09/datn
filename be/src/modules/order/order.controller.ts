import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { OrderService } from './order.service';
import { CreateOrderDto, ReturnOrderDto, OrderQueryDto } from './order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QrService } from '../../common/utils/qr.service';
import { PdfService } from '../../common/utils/pdf.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly qrService: QrService,
    private readonly pdfService: PdfService,
  ) {}

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    const order = await this.orderService.create(dto);
    const qrCode = await this.qrService.generatePaymentQr(
      order.id,
      Number(order.rentalPrice) + Number(order.depositAmount),
    );
    return { ...order, qrCode };
  }

  @Get()
  findAll(@Query() query: OrderQueryDto) {
    return this.orderService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.findById(id);
  }

  @Put(':id/confirm-payment')
  confirmPayment(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.confirmPayment(id);
  }

  @Put(':id/return')
  returnOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReturnOrderDto,
  ) {
    return this.orderService.returnOrder(id, dto);
  }

  @Put(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.cancel(id);
  }

  @Get(':id/invoice')
  async downloadInvoice(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const order = await this.orderService.findById(id);
    const pdfBuffer = await this.pdfService.generateInvoice(order);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
    });

    res.send(pdfBuffer);
  }

  @Get(':id/receipt')
  async downloadReceipt(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const order = await this.orderService.findById(id);
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
