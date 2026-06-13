'use client';

import { useState } from 'react';
import { RentalRequest, RentalRequestStatus } from '@/common/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OrderDetailDialog } from '@/features/order/components/order-detail-dialog';

function formatCurrency(value: number) {
  return `${Number(value).toLocaleString('vi-VN')} đ`;
}

function getChargeableRentalDays(startDate?: string, endDate?: string) {
  if (!startDate || !endDate || endDate < startDate) return 0;
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

const statusLabels: Record<RentalRequestStatus, string> = {
  SUBMITTED: 'Mới gửi',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
};

export function RentalRequestDetailDialog({
  open,
  onOpenChange,
  request,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: RentalRequest | null;
}) {
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);

  if (!request) return null;

  const rentalDays = getChargeableRentalDays(request.rentalStartDate, request.rentalEndDate);

  const pricing = request.items.reduce(
    (acc, item) => {
      acc.rental += item.unitPrice * item.quantity * rentalDays;
      acc.deposit += item.depositAmount * item.quantity;
      return acc;
    },
    { rental: 0, deposit: 0 },
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Yêu cầu #{request.id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Trạng thái</span>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                    {statusLabels[request.status]}
                  </span>
                </div>
                {request.user && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Khách hàng</span>
                      <span className="font-medium">{request.user.fullName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Số điện thoại</span>
                      <span>{request.user.phoneNumber || '—'}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ngày thuê</span>
                  <span className="font-medium">{request.rentalStartDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ngày trả</span>
                  <span className="font-medium">{request.rentalEndDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Số ngày tính tiền</span>
                  <span className="font-medium">{rentalDays} ngày</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Sản phẩm ({request.items.length})
              </p>
              {request.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-border bg-background p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.product?.name || `Sản phẩm #${item.productId}`}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.unitPrice)}/ngày
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.unitPrice * item.quantity * rentalDays)}</p>
                    <p className="text-xs text-muted-foreground">Cọc: {formatCurrency(item.depositAmount * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tiền thuê</span>
                  <span>{formatCurrency(pricing.rental)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tiền cọc</span>
                  <span>{formatCurrency(pricing.deposit)}</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span>Tổng dự kiến</span>
                  <span>{formatCurrency(pricing.rental + pricing.deposit)}</span>
                </div>
              </div>
            </div>

            {request.note && (
              <div className="rounded-2xl bg-muted/30 p-3 text-sm">
                <p className="text-xs text-muted-foreground">Ghi chú khách hàng</p>
                <p className="mt-1">{request.note}</p>
              </div>
            )}

            {request.reviewNote && (
              <div className="rounded-2xl bg-muted/30 p-3 text-sm">
                <p className="text-xs text-muted-foreground">Phản hồi của cửa hàng</p>
                <p className="mt-1">{request.reviewNote}</p>
              </div>
            )}

            {request.approvedOrderId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOrderDetailOpen(true)}
              >
                Xem đơn đã tạo (#{request.approvedOrderId})
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <OrderDetailDialog
        open={orderDetailOpen}
        orderId={request.approvedOrderId ?? null}
        onOpenChange={(nextOpen) => {
          setOrderDetailOpen(nextOpen);
        }}
      />
    </>
  );
}
