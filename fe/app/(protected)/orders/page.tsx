'use client';

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Search, ShoppingBag, Wallet } from 'lucide-react';
import { useAuthStore } from '@/common/stores/auth.store';
import { Order, OrderStatus } from '@/common/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  OrderDetailDialog,
  formatCurrency,
  paymentLabels,
  statusLabels,
} from '@/features/order/components/order-detail-dialog';
import { OrderForm } from '@/features/order/components/order-form';
import {
  useCancelOrder,
  useConfirmPayment,
  useMyOrders,
  useOrders,
  useReturnOrder,
} from '@/features/order/hooks/use-orders';
import { returnOrderSchema, type ReturnOrderFormData } from '@/features/order/schema';
import { cn } from '@/lib/utils';

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

function Stats({ orders }: { orders: Order[] }) {
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
      icon: ShoppingBag,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {stats.map((item, index) => (
        <Card
          key={item.label}
          className={cn(
            'rounded-[1.6rem] border-0 bg-white shadow-[0_12px_32px_rgba(120,134,164,0.12)]',
            index === stats.length - 1 && stats.length % 2 !== 0 && 'col-span-2 lg:col-span-1',
          )}
        >
          <CardContent className="flex min-h-[112px] items-center justify-between gap-4 p-5">
            <div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold">{item.value}</p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/70">
              <item.icon className="size-5 text-foreground" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CustomerOrdersView() {
  const [selectedViewOrderId, setSelectedViewOrderId] = useState<number | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const { data, isLoading } = useMyOrders();
  const orders = data?.data ?? [];

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="space-y-6">
      <Stats orders={orders} />

      <section className="space-y-4 rounded-3xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-bold">Đơn của tôi</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi các đơn đã được duyệt hoặc được tạo cho tài khoản của bạn.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--page-divider)] p-6 text-center text-sm text-muted-foreground">
            Bạn chưa có đơn thuê nào.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/30">
                <TableHead>Mã đơn</TableHead>
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
                <TableRow key={order.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>{order.rentalStartDate}</TableCell>
                  <TableCell>{order.rentalEndDate}</TableCell>
                  <TableCell>{formatCurrency(order.rentalPrice)}</TableCell>
                  <TableCell>{formatCurrency(order.depositAmount)}</TableCell>
                  <TableCell>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                      {statusLabels[order.status]}
                    </span>
                  </TableCell>
                  <TableCell>{paymentLabels[order.paymentStatus]}</TableCell>
                  <TableCell className="text-right">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

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

function OwnerOrdersView() {
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedReturnOrderId, setSelectedReturnOrderId] = useState<number>(0);
  const [selectedViewOrderId, setSelectedViewOrderId] = useState<number | null>(null);

  const { data, isLoading } = useOrders({
    status: status || undefined,
    search: search || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  const confirmPaymentMutation = useConfirmPayment();
  const cancelMutation = useCancelOrder();
  const returnMutation = useReturnOrder();

  const orders = data?.data ?? [];
  const selectedOrder =
    orders.find((order) => order.id === selectedReturnOrderId) ?? null;

  const renderActions = (order: Order) => (
    <>
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

      {order.status === OrderStatus.PENDING && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => confirmPaymentMutation.mutate(order.id)}
          >
            Xác nhận thanh toán
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => cancelMutation.mutate(order.id)}
          >
            Hủy đơn
          </Button>
        </>
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
    </>
  );

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Quản lý đơn thuê</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tạo đơn tại quầy, xác nhận thanh toán và xử lý trả đồ trong cùng một luồng.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="rounded-full px-5">
          Tạo đơn mới
        </Button>
      </section>

      <Stats orders={orders} />

      <section className="space-y-4 rounded-3xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-6 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo mã đơn, tên người thuê, số điện thoại..."
              className="h-11 rounded-full pl-10"
            />
          </div>
          <Input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="h-11 rounded-full"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="h-11 rounded-full"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant={status === '' ? 'default' : 'outline'} size="sm" onClick={() => setStatus('')}>
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

        <div>
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--page-divider)] p-6 text-center text-sm text-muted-foreground">
              Không có đơn nào phù hợp.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/30">
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Người thuê</TableHead>
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
                  <TableRow key={order.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.renterFullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.renterPhoneNumber || 'Chưa có số điện thoại'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{order.rentalStartDate}</TableCell>
                    <TableCell>{order.rentalEndDate}</TableCell>
                    <TableCell>{formatCurrency(order.rentalPrice)}</TableCell>
                    <TableCell>{formatCurrency(order.depositAmount)}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                        {statusLabels[order.status]}
                      </span>
                    </TableCell>
                    <TableCell>{paymentLabels[order.paymentStatus]}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {renderActions(order)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      <OrderForm open={formOpen} onOpenChange={setFormOpen} />

      <ReturnOrderDialog
        open={returnDialogOpen}
        onOpenChange={(nextOpen) => {
          setReturnDialogOpen(nextOpen);
          if (!nextOpen) {
            setSelectedReturnOrderId(0);
          }
        }}
        onSubmit={(formData) => {
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
            },
          );
        }}
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

export default function OrdersPage() {
  const user = useAuthStore((state) => state.user);

  if (user?.role === 'CUSTOMER') {
    return <CustomerOrdersView />;
  }

  return <OwnerOrdersView />;
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
  }, [form, order]);

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
  const refundAmount = Math.max(0, Number(order?.depositAmount ?? 0) - totalPenaltyAmount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Xác nhận trả đồ</DialogTitle>
        </DialogHeader>

        {!order ? (
          <p className="text-sm text-muted-foreground">Không tìm thấy thông tin đơn thuê.</p>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Đơn thuê</p>
                  <p className="mt-1 text-sm font-medium">#{order.id}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Tiền cọc</p>
                  <p className="mt-1 text-sm font-medium">{formatCurrency(order.depositAmount)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Người thuê</p>
                  <p className="mt-1 text-sm font-medium">{order.renterFullName}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {order.items.map((item, index) => {
                const damageFee = Number(item.product?.damageFee ?? 0);
                const damagedQuantity = Number(watchedItems[index]?.damagedQuantity ?? 0);
                const linePenalty = damageFee * damagedQuantity;

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
                          Đã thuê: {item.quantity} · Phí hư hỏng chuẩn: {formatCurrency(damageFee)}
                        </p>
                      </div>
                      <div className="w-full md:w-40">
                        <Label htmlFor={`damaged-${item.id}`}>Số lượng hư hỏng</Label>
                        <Input
                          id={`damaged-${item.id}`}
                          type="number"
                          min="0"
                          max={item.quantity}
                          {...form.register(`itemPenalties.${index}.damagedQuantity`, {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tiền phạt dòng này</span>
                      <span className="font-medium">{formatCurrency(linePenalty)}</span>
                    </div>
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="extraPenaltyReason">Lý do phụ phí</Label>
                <Input id="extraPenaltyReason" {...form.register('extraPenaltyReason')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Ghi chú trả đồ</Label>
              <Textarea id="note" rows={3} {...form.register('note')} />
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tiền cọc</span>
                  <span>{formatCurrency(order.depositAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tổng tiền phạt</span>
                  <span>{formatCurrency(totalPenaltyAmount)}</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span>Số tiền hoàn</span>
                  <span>{formatCurrency(refundAmount)}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Đóng
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
