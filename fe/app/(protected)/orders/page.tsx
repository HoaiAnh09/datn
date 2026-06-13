'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CalendarRange,
  Download,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { API_BASE_URL } from '@/common/api';
import { Order, OrderStatus, PaymentStatus } from '@/common/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { OrderDetailDialog } from '@/features/order/components/order-detail-dialog';
import { OrderForm } from '@/features/order/components/order-form';
import {
  useCancelOrder,
  useConfirmPayment,
  useOrders,
  useReturnOrder,
} from '@/features/order/hooks/use-orders';
import {
  returnOrderSchema,
  type ReturnOrderFormData,
} from '@/features/order/schema';
import { useDebounce } from '@/common/hooks/use-debounce';
import { cn } from '@/lib/utils';

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Chờ thanh toán',
  [OrderStatus.RENTING]: 'Đang cho thuê',
  [OrderStatus.RETURNED]: 'Đã trả',
  [OrderStatus.CANCELLED]: 'Đã hủy',
};

const paymentLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.UNPAID]: 'Chưa thanh toán',
  [PaymentStatus.DEPOSIT_PAID]: 'Đã đặt cọc',
  [PaymentStatus.REFUNDED]: 'Đã hoàn cọc',
};

function formatCurrency(value: number) {
  return `${Number(value).toLocaleString('vi-VN')}đ`;
}

function getReturnDefaultValues(order?: Order | null): ReturnOrderFormData {
  return {
    itemPenalties:
      order?.items.map((item) => ({
        productId: item.productId,
        damagedQuantity: 0,
      })) ?? [],
    extraPenaltyAmount: 0,
    extraPenaltyReason: '',
    note: '',
  };
}

export default function OrdersPage() {
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedReturnOrderId, setSelectedReturnOrderId] = useState<number>(0);
  const [selectedViewOrderId, setSelectedViewOrderId] = useState<number | null>(null);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isFetching } = useOrders({
    status,
    search: debouncedSearch || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  const confirmPaymentMutation = useConfirmPayment();
  const cancelMutation = useCancelOrder();
  const returnMutation = useReturnOrder();

  const orders = data?.data ?? [];
  const selectedOrder =
    orders.find((order) => order.id === selectedReturnOrderId) ?? null;

  const stats = [
    { label: 'Tổng đơn thuê', value: orders.length, icon: ShoppingBag },
    {
      label: 'Chờ thanh toán',
      value: orders.filter((item) => item.status === OrderStatus.PENDING).length,
      icon: Wallet,
    },
    {
      label: 'Đang cho thuê',
      value: orders.filter((item) => item.status === OrderStatus.RENTING).length,
      icon: RotateCcw,
    },
  ];

  const renderOrderActions = (order: Order, align: 'start' | 'end' = 'end') => (
    <div
      className={cn(
        'flex flex-wrap gap-2',
        align === 'end' ? 'justify-end' : 'justify-start'
      )}
    >
      {order.status === OrderStatus.PENDING && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => confirmPaymentMutation.mutate(order.id)}
          disabled={confirmPaymentMutation.isPending}
        >
          Xác nhận TT
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setSelectedViewOrderId(order.id);
          setDetailDialogOpen(true);
        }}
      >
        Xem
      </Button>

      {order.status === OrderStatus.RENTING && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`${API_BASE_URL}/orders/${order.id}/invoice`)}
        >
          <Download className="mr-1 size-4" />
          Hóa đơn
        </Button>
      )}

      {order.status === OrderStatus.RENTING && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedReturnOrderId(order.id);
            setReturnDialogOpen(true);
          }}
        >
          Trả đồ
        </Button>
      )}

      {order.status === OrderStatus.RETURNED && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`${API_BASE_URL}/orders/${order.id}/invoice`)}
        >
          <Download className="mr-1 size-4" />
          Hóa đơn
        </Button>
      )}

      {order.status === OrderStatus.RETURNED && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`${API_BASE_URL}/orders/${order.id}/receipt`)}
        >
          <Download className="mr-1 size-4" />
          Biên nhận
        </Button>
      )}

      {order.status === OrderStatus.PENDING && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => cancelMutation.mutate(order.id)}
          disabled={cancelMutation.isPending}
        >
          Hủy
        </Button>
      )}
    </div>
  );

  const onReturnSubmit = (formData: ReturnOrderFormData) => {
    if (!selectedOrder) {
      return;
    }

    returnMutation.mutate(
      { id: selectedOrder.id, data: formData },
      {
        onSuccess: () => {
          setReturnDialogOpen(false);
          setSelectedReturnOrderId(0);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <Skeleton className="h-28 rounded-[1.9rem]" />
          <Skeleton className="h-28 rounded-[1.9rem]" />
          <Skeleton className="h-28 rounded-[1.9rem]" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-5 shadow-[var(--page-shadow-soft)] sm:p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Quản lý vòng đời đơn thuê</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Đơn thuê</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi đơn mới, thanh toán và quy trình trả đồ theo từng sản phẩm.
          </p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="w-full rounded-full px-5 sm:w-auto"
        >
          <Plus className="mr-2 size-4" />
          Tạo đơn mới
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((item, index) => (
          <Card
            key={item.label}
            className={cn(
              'rounded-[1.6rem] border-0 bg-white shadow-[0_12px_32px_rgba(120,134,164,0.12)] sm:rounded-[1.9rem]',
              index === stats.length - 1 && stats.length % 2 !== 0 && 'col-span-2 lg:col-span-1'
            )}
          >
            <CardContent className="flex min-h-[96px] items-center justify-between gap-3 p-4 sm:min-h-[112px] sm:gap-4 sm:p-5">
              <div>
                <p className="text-xs text-muted-foreground sm:text-sm">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold sm:text-3xl">{item.value}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted/70 sm:size-12 sm:rounded-2xl">
                <item.icon className="size-4 text-foreground sm:size-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-5 shadow-[var(--page-shadow-soft)]">
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm mã đơn, tên khách, số điện thoại..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 rounded-full bg-card pl-10 pr-4"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
            <div className="space-y-1">
              <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">
                Từ ngày
              </Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="h-11 rounded-full bg-card px-4"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="dateTo" className="text-xs text-muted-foreground">
                Đến ngày
              </Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="h-11 rounded-full bg-card px-4"
              />
            </div>

            <div className="w-fit rounded-full bg-muted/70 px-4 py-2 text-sm text-muted-foreground lg:justify-self-end">
              {isFetching && !isLoading ? 'Đang lọc...' : `${orders.length} đơn`}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={status === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatus('')}
          >
            Tất cả
          </Button>
          {Object.entries(statusLabels).map(([value, label]) => (
            <Button
              key={value}
              variant={status === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatus(value)}
            >
              {label}
            </Button>
          ))}
        </div>

        {(search || dateFrom || dateTo || status) && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <CalendarRange className="size-4" />
            <span>
              {dateFrom || dateTo
                ? `Khoảng ngày: ${dateFrom || '...'} - ${dateTo || '...'}`
                : 'Đang lọc theo trạng thái hoặc từ khóa'}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setDateFrom('');
                setDateTo('');
                setStatus('');
              }}
            >
              Xóa bộ lọc
            </Button>
          </div>
        )}

        <div className="space-y-3 lg:hidden">
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--page-divider)] p-6 text-center text-sm text-muted-foreground">
              Không có đơn thuê phù hợp.
            </div>
          ) : (
            orders.map((order) => (
              <Card
                key={order.id}
                className="rounded-[1.6rem] border border-[var(--page-divider)] bg-white shadow-[0_12px_32px_rgba(120,134,164,0.08)]"
              >
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">#{order.id}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {order.customer?.fullName || 'Không rõ khách hàng'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                        {statusLabels[order.status]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {paymentLabels[order.paymentStatus]}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-muted/40 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Ngày thuê</p>
                      <p className="mt-1 font-medium">{order.rentalStartDate}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/40 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Ngày trả</p>
                      <p className="mt-1 font-medium">{order.rentalEndDate}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/40 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Tiền thuê</p>
                      <p className="mt-1 font-medium">{formatCurrency(order.rentalPrice)}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/40 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Tiền cọc</p>
                      <p className="mt-1 font-medium">{formatCurrency(order.depositAmount)}</p>
                    </div>
                  </div>

                  {renderOrderActions(order, 'start')}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/50">
                <TableHead>Mã đơn</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Ngày thuê</TableHead>
                <TableHead>Ngày trả</TableHead>
                <TableHead>Tiền thuê</TableHead>
                <TableHead>Tiền cọc</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thanh toán</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>{order.customer?.fullName}</TableCell>
                  <TableCell>{order.rentalStartDate}</TableCell>
                  <TableCell>{order.rentalEndDate}</TableCell>
                  <TableCell>{formatCurrency(order.rentalPrice)}</TableCell>
                  <TableCell>{formatCurrency(order.depositAmount)}</TableCell>
                  <TableCell>{statusLabels[order.status]}</TableCell>
                  <TableCell>{paymentLabels[order.paymentStatus]}</TableCell>
                  <TableCell className="text-right">
                    {renderOrderActions(order)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <OrderForm
        key={`order-form-${formOpen ? 'open' : 'closed'}`}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <ReturnOrderDialog
        open={returnDialogOpen}
        onOpenChange={(nextOpen) => {
          setReturnDialogOpen(nextOpen);
          if (!nextOpen) {
            setSelectedReturnOrderId(0);
          }
        }}
        onSubmit={onReturnSubmit}
        order={selectedOrder}
        isSubmitting={returnMutation.isPending}
      />

      <OrderDetailDialog
        open={detailDialogOpen}
        orderId={selectedViewOrderId}
        onOpenChange={(nextOpen) => {
          setDetailDialogOpen(nextOpen);
          if (!nextOpen) {
            setSelectedViewOrderId(null);
          }
        }}
      />
    </div>
  );
}

function ReturnOrderDialog({
  open,
  onOpenChange,
  onSubmit,
  order,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ReturnOrderFormData) => void;
  order: Order | null;
  isSubmitting: boolean;
}) {
  const form = useForm<ReturnOrderFormData>({
    resolver: zodResolver(returnOrderSchema),
    defaultValues: getReturnDefaultValues(order),
  });

  useEffect(() => {
    form.reset(getReturnDefaultValues(order));
  }, [form, order, open]);

  const watchedItems =
    useWatch({
      control: form.control,
      name: 'itemPenalties',
    }) ?? [];
  const extraPenaltyAmount =
    useWatch({
      control: form.control,
      name: 'extraPenaltyAmount',
    }) ?? 0;

  const standardPenaltyAmount =
    order?.items.reduce((total, item, index) => {
      const damagedQuantity = Number(watchedItems[index]?.damagedQuantity ?? 0);
      return total + damagedQuantity * Number(item.product?.damageFee ?? 0);
    }, 0) ?? 0;

  const totalPenaltyAmount = standardPenaltyAmount + Number(extraPenaltyAmount || 0);
  const refundAmount = Math.max(
    0,
    Number(order?.depositAmount ?? 0) - totalPenaltyAmount
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Xác nhận trả đồ</DialogTitle>
        </DialogHeader>

        {!order ? (
            <p className="text-sm text-muted-foreground">
            Không tìm thấy thông tin đơn thuê.
          </p>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Đơn thuê
                  </p>
                  <p className="mt-1 text-sm font-medium">#{order.id}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Tiền cọc
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {formatCurrency(order.depositAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Khách hàng
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {order.customer?.fullName ?? 'Không rõ'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Kiểm tra hư hỏng theo sản phẩm</h3>
                <p className="text-sm text-muted-foreground">
                  Hệ thống sẽ tự tính tiền phạt từ mức phạt chuẩn của từng sản phẩm.
                </p>
              </div>

              {order.items.map((item, index) => {
                const damagedQuantity =
                  Number(watchedItems[index]?.damagedQuantity ?? 0);
                const damageFee = Number(item.product?.damageFee ?? 0);
                const linePenalty = damagedQuantity * damageFee;
                const quantityError =
                  form.formState.errors.itemPenalties?.[index]?.damagedQuantity
                    ?.message;

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border bg-background p-4"
                  >
                    <input
                      type="hidden"
                      {...form.register(`itemPenalties.${index}.productId`, {
                        valueAsNumber: true,
                      })}
                    />
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Đã thuê: {item.quantity} | Mức phạt chuẩn:{' '}
                          {formatCurrency(damageFee)} / món
                        </p>
                      </div>

                      <div className="w-full md:w-40">
                        <Label htmlFor={`damagedQuantity-${item.id}`}>
                          Số lượng hư hỏng
                        </Label>
                        <Input
                          id={`damagedQuantity-${item.id}`}
                          type="number"
                          min="0"
                          max={item.quantity}
                          {...form.register(
                            `itemPenalties.${index}.damagedQuantity`,
                            {
                              valueAsNumber: true,
                              min: 0,
                              max: item.quantity,
                            }
                          )}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tiền phạt dòng này</span>
                      <span className="font-medium">{formatCurrency(linePenalty)}</span>
                    </div>

                    {quantityError && (
                      <p className="mt-2 text-xs text-destructive">{quantityError}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="extraPenaltyAmount">Phụ phí khác</Label>
                <Input
                  id="extraPenaltyAmount"
                  type="number"
                  min="0"
                  {...form.register('extraPenaltyAmount', { valueAsNumber: true })}
                />
                {form.formState.errors.extraPenaltyAmount && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.extraPenaltyAmount.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="extraPenaltyReason">Lý do phụ phí khác</Label>
                <Input
                  id="extraPenaltyReason"
                  placeholder="Ví dụ: trễ hạn, mất phụ kiện"
                  {...form.register('extraPenaltyReason')}
                />
                {form.formState.errors.extraPenaltyReason && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.extraPenaltyReason.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Ghi chú trả đồ</Label>
              <Textarea
                id="note"
                rows={3}
                placeholder="Mô tả tình trạng sản phẩm, cách xử lý hoặc ghi chú thêm"
                {...form.register('note')}
              />
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <h3 className="text-sm font-semibold">Tổng kết hoàn cọc</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tiền cọc</span>
                  <span>{formatCurrency(order.depositAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tiền phạt theo sản phẩm</span>
                  <span>{formatCurrency(standardPenaltyAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phụ phí khác</span>
                  <span>{formatCurrency(Number(extraPenaltyAmount || 0))}</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span>Tổng tiền phạt</span>
                  <span>{formatCurrency(totalPenaltyAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Số tiền hoàn cọc</span>
                  <span>{formatCurrency(refundAmount)}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Xác nhận trả đồ
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
