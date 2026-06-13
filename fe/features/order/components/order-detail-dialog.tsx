'use client';

import { Download, ReceiptText } from 'lucide-react';
import { API_BASE_URL } from '@/common/api';
import { Order, OrderSource, OrderStatus, PaymentStatus } from '@/common/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrder } from '@/features/order/hooks/use-orders';

export function formatCurrency(value: number) {
  return `${Number(value).toLocaleString('vi-VN')} đ`;
}

export const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Chờ thanh toán',
  RENTING: 'Đang cho thuê',
  RETURNED: 'Đã trả',
  CANCELLED: 'Đã hủy',
};

export const paymentLabels: Record<PaymentStatus, string> = {
  UNPAID: 'Chưa thanh toán',
  DEPOSIT_PAID: 'Đã đặt cọc',
  REFUNDED: 'Đã hoàn cọc',
};

const sourceLabels: Record<OrderSource, string> = {
  OWNER_DIRECT: 'Tạo trực tiếp tại quầy',
  CUSTOMER_REQUEST: 'Duyệt từ yêu cầu online',
};

export function OrderDetailContent({ order }: { order: Order }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-[1.6rem] border-0 bg-white shadow-[0_12px_32px_rgba(120,134,164,0.12)]">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Người thuê</p>
            <p className="mt-2 text-lg font-semibold">{order.renterFullName}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {order.renterPhoneNumber || 'Chưa có số điện thoại'}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[1.6rem] border-0 bg-white shadow-[0_12px_32px_rgba(120,134,164,0.12)]">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Trạng thái đơn</p>
            <p className="mt-2 text-lg font-semibold">{statusLabels[order.status]}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {paymentLabels[order.paymentStatus]}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[1.6rem] border-0 bg-white shadow-[0_12px_32px_rgba(120,134,164,0.12)]">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Tiền thuê</p>
            <p className="mt-2 text-lg font-semibold">{formatCurrency(order.rentalPrice)}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Tiền cọc: {formatCurrency(order.depositAmount)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[1.6rem] border-0 bg-white shadow-[0_12px_32px_rgba(120,134,164,0.12)]">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Hoàn cọc</p>
            <p className="mt-2 text-lg font-semibold">{formatCurrency(order.refundAmount || 0)}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Phí phạt: {formatCurrency(order.penaltyAmount || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-3xl border border-[var(--page-divider)] bg-[var(--page-panel)] shadow-sm">
          <CardContent className="p-6">
            <div>
              <h3 className="text-lg font-bold">Sản phẩm trong đơn</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Danh sách đồ thuê được chụp lại đúng thời điểm tạo đơn.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[var(--page-divider)] bg-white p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{item.product?.name || `Sản phẩm #${item.productId}`}</p>
                    <p className="text-sm text-muted-foreground">
                      Số lượng: {item.quantity} · Giá/ngày: {formatCurrency(item.unitPrice)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Phí hư hỏng chuẩn: {formatCurrency(Number(item.product?.damageFee ?? 0))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-[var(--page-divider)] bg-[var(--page-panel)] shadow-sm">
          <CardContent className="space-y-5 p-6">
            <div>
              <h3 className="text-lg font-bold">Thông tin đơn</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Lịch thuê, nguồn tạo đơn và thông tin người thuê được lưu cố định.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Ngày thuê</p>
                <p className="mt-1 font-medium">{order.rentalStartDate}</p>
              </div>
              <div className="rounded-2xl bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Ngày trả</p>
                <p className="mt-1 font-medium">{order.rentalEndDate}</p>
              </div>
              <div className="rounded-2xl bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Nguồn tạo đơn</p>
                <p className="mt-1 font-medium">{sourceLabels[order.source]}</p>
              </div>
              <div className="rounded-2xl bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Tạo lúc</p>
                <p className="mt-1 font-medium">
                  {new Date(order.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>

            {order.pickupDeadlineAt && (
              <div className="rounded-2xl bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Hạn đến lấy đồ</p>
                <p className="mt-1 font-medium">
                  {new Date(order.pickupDeadlineAt).toLocaleString('vi-VN')}
                </p>
              </div>
            )}

            {order.renterAddress && (
              <div className="rounded-2xl border border-[var(--page-divider)] bg-white p-4">
                <p className="text-sm font-semibold">Địa chỉ người thuê</p>
                <p className="mt-2 text-sm text-muted-foreground">{order.renterAddress}</p>
              </div>
            )}

            <div className="rounded-2xl border border-[var(--page-divider)] bg-white p-4">
              <p className="text-sm font-semibold">Ghi chú</p>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                {order.note?.trim() || 'Chưa có ghi chú cho đơn hàng này.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function OrderDetailDialog({
  orderId,
  open,
  onOpenChange,
}: {
  orderId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const shouldFetch = open && typeof orderId === 'number' && orderId > 0;
  const { data, isLoading } = useOrder(orderId ?? 0, shouldFetch);
  const order = data?.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100%-1.5rem)] overflow-y-auto p-0 sm:max-w-5xl">
        <div className="space-y-6 p-5 sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-semibold">
              {orderId ? `Chi tiết đơn #${orderId}` : 'Chi tiết đơn thuê'}
            </DialogTitle>
            <DialogDescription>
              Xem thông tin người thuê, sản phẩm, thanh toán và chứng từ của đơn thuê.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-80 rounded-2xl" />
            </div>
          ) : !order ? (
            <div className="rounded-2xl border border-dashed border-[var(--page-divider)] p-8 text-center text-sm text-muted-foreground">
              Không tìm thấy thông tin đơn hàng.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {(order.status === OrderStatus.RENTING || order.status === OrderStatus.RETURNED) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open(`${API_BASE_URL}/orders/${order.id}/invoice`)}
                  >
                    <Download className="mr-2 size-4" />
                    Tải hóa đơn
                  </Button>
                )}
                {order.status === OrderStatus.RETURNED && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open(`${API_BASE_URL}/orders/${order.id}/receipt`)}
                  >
                    <ReceiptText className="mr-2 size-4" />
                    Tải biên nhận
                  </Button>
                )}
              </div>

              <OrderDetailContent order={order} />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
