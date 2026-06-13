'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Download, ReceiptText } from 'lucide-react';
import { API_BASE_URL } from '@/common/api';
import { OrderStatus } from '@/common/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderDetailContent } from '@/features/order/components/order-detail-dialog';
import { useOrder } from '@/features/order/hooks/use-orders';

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);
  const { data, isLoading } = useOrder(orderId);
  const order = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--page-divider)] bg-[var(--page-panel)] p-10 text-center text-muted-foreground">
        Không tìm thấy đơn hàng.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-5 shadow-[var(--page-shadow-soft)] sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Quay lại danh sách đơn thuê
          </Link>
          <div>
            <p className="text-sm text-muted-foreground">Chi tiết đơn thuê</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Đơn #{order.id}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Theo dõi khách hàng, sản phẩm, thanh toán và trạng thái xử lý của đơn.
            </p>
          </div>
        </div>

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
      </div>

      <OrderDetailContent order={order} />
    </div>
  );
}
