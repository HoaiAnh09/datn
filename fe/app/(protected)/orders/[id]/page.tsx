'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Download, ReceiptText } from 'lucide-react';
import { API_BASE_URL } from '@/common/api';
import { OrderStatus } from '@/common/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderDetailContent } from '@/features/order/components/order-detail-dialog';
import { useOrder } from '@/features/order/hooks/use-orders';

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);
  const { data, isLoading } = useOrder(orderId, Number.isFinite(orderId));
  const order = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-[480px] rounded-3xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-3xl border border-dashed border-[var(--page-divider)] bg-[var(--page-panel)] p-10 text-center text-muted-foreground">
        Không tìm thấy đơn hàng.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Button asChild variant="ghost" className="px-0 text-muted-foreground">
              <Link href="/orders">← Quay lại danh sách đơn</Link>
            </Button>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">Đơn #{order.id}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{order.renterFullName}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(order.status === OrderStatus.RENTING || order.status === OrderStatus.RETURNED) && (
              <Button
                variant="outline"
                onClick={() => window.open(`${API_BASE_URL}/orders/${order.id}/invoice`)}
              >
                <Download className="mr-2 size-4" />
                Tải hóa đơn
              </Button>
            )}
            {order.status === OrderStatus.RETURNED && (
              <Button
                variant="outline"
                onClick={() => window.open(`${API_BASE_URL}/orders/${order.id}/receipt`)}
              >
                <ReceiptText className="mr-2 size-4" />
                Tải biên nhận
              </Button>
            )}
          </div>
        </div>
      </section>

      <OrderDetailContent order={order} />
    </div>
  );
}
