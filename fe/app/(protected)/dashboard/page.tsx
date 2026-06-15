'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Package,
  ReceiptText,
  Store,
} from 'lucide-react';
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';
import { useAuthStore } from '@/common/stores/auth.store';
import { OrderStatus, RentalRequestStatus } from '@/common/types';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderDetailDialog } from '@/features/order/components/order-detail-dialog';
import { useMyOrders } from '@/features/order/hooks/use-orders';
import { useDashboard } from '@/features/report/hooks/use-reports';
import { useMyRentalRequests } from '@/features/rental-request/hooks/use-rental-requests';

function formatCurrency(value: number) {
  return `${Number(value).toLocaleString('vi-VN')} đ`;
}

function getOrderStatusLabel(status: OrderStatus) {
  switch (status) {
    case OrderStatus.PENDING:
      return 'Chờ thanh toán';
    case OrderStatus.RENTING:
      return 'Đang cho thuê';
    case OrderStatus.RETURNED:
      return 'Đã trả';
    case OrderStatus.CANCELLED:
      return 'Đã hủy';
    default:
      return status;
  }
}

function getRequestStatusLabel(status: RentalRequestStatus) {
  switch (status) {
    case RentalRequestStatus.SUBMITTED:
      return 'Mới gửi';
    case RentalRequestStatus.APPROVED:
      return 'Đã duyệt';
    case RentalRequestStatus.REJECTED:
      return 'Từ chối';
    case RentalRequestStatus.CANCELLED:
      return 'Đã hủy';
    default:
      return status;
  }
}

function GradientStatCard({
  title,
  value,
  note,
  gradient,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  note: string;
  gradient: string;
  icon: typeof Package;
}) {
  return (
    <article
      className="relative flex min-h-[196px] flex-col overflow-hidden rounded-[1.8rem] p-4 text-white shadow-lg sm:min-h-[220px] sm:p-6"
      style={{ background: gradient }}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-[72%] text-xs font-medium opacity-90 sm:text-sm">{title}</p>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm sm:size-9">
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-auto pt-6 sm:pt-8">
        <p className="max-w-full break-words text-[clamp(1.8rem,4vw,3.2rem)] font-bold leading-[1.05] tracking-tight">
          {value}
        </p>
        <p className="mt-3 max-w-[18rem] text-xs leading-5 opacity-80 sm:text-sm">{note}</p>
      </div>
    </article>
  );
}

const chartConfig = {
  revenue: {
    label: 'Doanh thu',
    color: '#ff6b6b',
  },
  orderCount: {
    label: 'Số đơn',
    color: '#4f80ff',
  },
} satisfies ChartConfig;

function OwnerDashboard() {
  const { data: dashboardResponse, isLoading } = useDashboard();
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const dashboard = dashboardResponse?.data;
  const revenue = useMemo(() => dashboard?.monthlyRevenue ?? [], [dashboard?.monthlyRevenue]);
  const recentOrders = dashboard?.recentOrders ?? [];
  const lowStockProducts = dashboard?.lowStockProducts ?? [];
  const topProducts = dashboard?.topProducts ?? [];

  const dashboardStats = [
    {
      title: 'Tổng doanh thu',
      value: dashboard?.totalRevenue ? formatCurrency(dashboard.totalRevenue) : '0 đ',
      note: 'Tính từ các đơn đã trả và hoàn tất vận hành.',
      gradient:
        'radial-gradient(circle at top left, rgba(255,255,255,0.35), transparent 36%), linear-gradient(135deg, #725bff 0%, #ff9276 100%)',
      icon: CircleDollarSign,
    },
    {
      title: 'Đơn chờ thanh toán',
      value: dashboard?.pendingOrders ?? 0,
      note: 'Những đơn đã duyệt hoặc tạo tại quầy nhưng chưa thu tiền.',
      gradient:
        'radial-gradient(circle at top left, rgba(255,255,255,0.32), transparent 32%), linear-gradient(135deg, #00b7c2 0%, #6ea8ff 100%)',
      icon: Clock3,
    },
    {
      title: 'Đang cho thuê',
      value: dashboard?.rentingOrders ?? 0,
      note: 'Các đơn đang vận hành và cần theo dõi lịch trả đồ.',
      gradient:
        'radial-gradient(circle at top left, rgba(255,255,255,0.34), transparent 34%), linear-gradient(135deg, #ff8a7a 0%, #ffc36b 100%)',
      icon: Package,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl sm:col-span-2 xl:col-span-1" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Skeleton className="h-96 rounded-3xl" />
          <div className="space-y-6">
            <Skeleton className="h-80 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          Chào mừng quay lại
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tổng quan nhanh về doanh thu, đơn thuê và tồn kho hiện tại.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardStats.map((item, index) => (
          <div
            key={item.title}
            className={index === dashboardStats.length - 1 ? 'sm:col-span-2 xl:col-span-1' : undefined}
          >
            <GradientStatCard
              title={item.title}
              value={item.value}
              note={item.note}
              gradient={item.gradient}
              icon={item.icon}
            />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Doanh thu theo tháng</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Theo dõi doanh thu và số đơn hoàn tất qua từng tháng.
                </p>
              </div>
            </div>

            {revenue.length > 0 ? (
              <div className="mt-6">
                <div className="mb-4 flex items-baseline gap-3">
                  <p className="text-sm text-muted-foreground">Tháng gần nhất</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(revenue[revenue.length - 1].revenue)}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/30 p-4 pl-6">
                  <ChartContainer config={chartConfig} className="h-[240px] w-full">
                    <ComposedChart data={revenue}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        yAxisId="left"
                        tickLine={false}
                        axisLine={false}
                        width={72}
                        tickFormatter={(value) =>
                          `${Number(value).toLocaleString('vi-VN')} đ`
                        }
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tickLine={false}
                        axisLine={false}
                        width={36}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) =>
                              name === 'Doanh thu'
                                ? formatCurrency(Number(value))
                                : `${value} đơn`
                            }
                          />
                        }
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar
                        yAxisId="right"
                        dataKey="orderCount"
                        fill="var(--color-orderCount)"
                        radius={[8, 8, 0, 0]}
                        barSize={24}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--color-revenue)"
                        strokeWidth={3}
                        dot={{
                          fill: 'var(--color-revenue)',
                          strokeWidth: 0,
                          r: 4,
                        }}
                        activeDot={{ r: 5 }}
                      />
                    </ComposedChart>
                  </ChartContainer>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-[var(--page-divider)] text-sm text-muted-foreground">
                Chưa có dữ liệu doanh thu để hiển thị biểu đồ.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-foreground">Tổng quan</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Các chỉ số vận hành cốt lõi của cửa hàng.
              </p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-muted/30 px-4 py-3">
                <p className="text-xs text-muted-foreground">Tổng đơn</p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {dashboard?.totalOrders ?? 0}
                </p>
              </div>
              <div className="rounded-2xl bg-muted/30 px-4 py-3">
                <p className="text-xs text-muted-foreground">Tồn kho thấp</p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {lowStockProducts.length}
                </p>
              </div>
              <div className="rounded-2xl bg-muted/30 px-4 py-3">
                <p className="text-xs text-muted-foreground">Đơn chờ xử lý</p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {dashboard?.pendingOrders ?? 0}
                </p>
              </div>
              <div className="rounded-2xl bg-muted/30 px-4 py-3">
                <p className="text-xs text-muted-foreground">Đang cho thuê</p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {dashboard?.rentingOrders ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Đơn gần đây</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Theo dõi nhanh các đơn mới phát sinh.
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <CalendarDays className="size-4" />
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {recentOrders.slice(0, 5).map((order) => (
                <article
                  key={order.id}
                  className="flex flex-col gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-semibold text-muted-foreground">
                    #{order.id}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {order.renterName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {order.rentalStartDate} · {getOrderStatusLabel(order.status)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setDetailDialogOpen(true);
                    }}
                  >
                    Xem
                  </Button>
                </article>
              ))}

              {recentOrders.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[var(--page-divider)] p-6 text-center text-sm text-muted-foreground">
                  Chưa có đơn thuê nào.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-foreground">Tồn kho thấp</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sản phẩm cần chú ý trong kho.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="min-w-0 truncate text-sm font-medium text-foreground">
                      {product.name}
                    </p>
                    <p className="ml-2 shrink-0 text-xs font-semibold text-muted-foreground">
                      {product.availableQuantity}
                    </p>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#2d6cf4] to-[#4a87ff]"
                      style={{
                        width: `${Math.min(100, Math.max(8, product.availableQuantity * 10))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}

              {lowStockProducts.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Không có sản phẩm tồn kho thấp.
                </p>
              )}
            </div>
          </div>

          {topProducts.length > 0 && (
            <div className="rounded-3xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-foreground">Top sản phẩm</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sản phẩm được thuê nhiều nhất.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {topProducts.slice(0, 5).map((item, index) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.productName}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      {item.totalRented} lượt
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      <OrderDetailDialog
        open={detailDialogOpen}
        orderId={selectedOrderId}
        onOpenChange={(nextOpen) => {
          setDetailDialogOpen(nextOpen);
          if (!nextOpen) {
            setSelectedOrderId(null);
          }
        }}
      />
    </div>
  );
}

function CustomerDashboard() {
  const { data: ordersResponse, isLoading: ordersLoading } = useMyOrders();
  const { data: requestsResponse, isLoading: requestsLoading } = useMyRentalRequests();
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const orders = ordersResponse?.data ?? [];
  const requests = requestsResponse?.data ?? [];

  const approvedRequests = requests.filter(
    (request) => request.status === RentalRequestStatus.APPROVED,
  ).length;
  const pendingPickupOrders = orders.filter(
    (order) => order.status === OrderStatus.PENDING,
  );
  const activeOrders = orders.filter((order) => order.status === OrderStatus.RENTING);

  const stats = [
    {
      title: 'Yêu cầu đã gửi',
      value: requests.length,
      note: 'Tổng số yêu cầu đặt thuê bạn đã gửi lên hệ thống.',
      gradient:
        'radial-gradient(circle at top left, rgba(255,255,255,0.35), transparent 36%), linear-gradient(135deg, #5f7cff 0%, #6fd7ff 100%)',
      icon: ReceiptText,
    },
    {
      title: 'Đã được duyệt',
      value: approvedRequests,
      note: 'Những yêu cầu đã được cửa hàng xác nhận và chuyển thành đơn.',
      gradient:
        'radial-gradient(circle at top left, rgba(255,255,255,0.32), transparent 32%), linear-gradient(135deg, #ff8c6b 0%, #ffbc6d 100%)',
      icon: Clock3,
    },
    {
      title: 'Đơn đang thuê',
      value: activeOrders.length,
      note: 'Các đơn đang vận hành và cần theo dõi ngày trả đồ.',
      gradient:
        'radial-gradient(circle at top left, rgba(255,255,255,0.34), transparent 34%), linear-gradient(135deg, #00b7c2 0%, #6ea8ff 100%)',
      icon: Package,
    },
  ];

  if (ordersLoading || requestsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl sm:col-span-2 xl:col-span-1" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Skeleton className="h-[360px] rounded-3xl" />
          <Skeleton className="h-[360px] rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            Theo dõi đơn thuê của bạn
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Xem nhanh yêu cầu đã gửi, đơn đang chờ nhận và đơn đang thuê.
          </p>
        </div>
        <Button asChild className="rounded-full px-5">
          <Link href="/">
            <Store className="mr-2 size-4" />
            Chọn thêm đồ
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((item, index) => (
          <div
            key={item.title}
            className={index === stats.length - 1 ? 'sm:col-span-2 xl:col-span-1' : undefined}
          >
            <GradientStatCard
              title={item.title}
              value={item.value}
              note={item.note}
              gradient={item.gradient}
              icon={item.icon}
            />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-foreground">Việc cần làm tiếp theo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Những đầu việc quan trọng để bạn không lỡ lịch nhận hoặc trả đồ.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {pendingPickupOrders.length === 0 && activeOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--page-divider)] p-6 text-center text-sm text-muted-foreground">
                Hiện chưa có đơn nào cần xử lý ngay.
              </div>
            ) : (
              <>
                {pendingPickupOrders.slice(0, 3).map((order) => (
                  <article
                    key={order.id}
                    className="rounded-2xl border border-[var(--page-divider)] bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">Đơn #{order.id}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Chờ bạn đến quầy thanh toán và nhận đồ.
                        </p>
                      </div>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </div>
                    {order.pickupDeadlineAt && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Hạn nhận: {new Date(order.pickupDeadlineAt).toLocaleString('vi-VN')}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        setDetailDialogOpen(true);
                      }}
                    >
                      Xem chi tiết đơn
                    </Button>
                  </article>
                ))}

                {activeOrders.slice(0, 3).map((order) => (
                  <article
                    key={order.id}
                    className="rounded-2xl border border-[var(--page-divider)] bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">Đơn #{order.id}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Bạn đang thuê đồ, nhớ theo dõi ngày trả.
                        </p>
                      </div>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Trả trước ngày: {order.rentalEndDate}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        setDetailDialogOpen(true);
                      }}
                    >
                      Xem chi tiết đơn
                    </Button>
                  </article>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-foreground">Đơn mới nhất</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Mở nhanh chi tiết đơn để xem thời gian thuê và tiền cọc.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {orders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--page-divider)] p-6 text-center text-sm text-muted-foreground">
                Bạn chưa có đơn thuê nào.
              </div>
            ) : (
              orders.slice(0, 5).map((order) => (
                <article
                  key={order.id}
                  className="rounded-2xl border border-[var(--page-divider)] bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Đơn #{order.id}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {order.rentalStartDate} · {order.rentalEndDate}
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Tiền thuê</p>
                      <p className="mt-1 font-medium">{formatCurrency(order.rentalPrice)}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Tiền cọc</p>
                      <p className="mt-1 font-medium">{formatCurrency(order.depositAmount)}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setDetailDialogOpen(true);
                    }}
                  >
                    Xem chi tiết
                  </Button>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-6 shadow-sm lg:col-span-2">
          <div>
            <h2 className="text-lg font-bold text-foreground">Yêu cầu gần đây</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Trạng thái xét duyệt mới nhất từ cửa hàng.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {requests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--page-divider)] p-6 text-center text-sm text-muted-foreground">
                Bạn chưa gửi yêu cầu đặt thuê nào.
              </div>
            ) : (
              requests.slice(0, 5).map((request) => (
                <article
                  key={request.id}
                  className="rounded-2xl border border-[var(--page-divider)] bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Yêu cầu #{request.id}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {request.rentalStartDate} · {request.rentalEndDate}
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                      {getRequestStatusLabel(request.status)}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      <OrderDetailDialog
        open={detailDialogOpen}
        orderId={selectedOrderId}
        onOpenChange={(nextOpen) => {
          setDetailDialogOpen(nextOpen);
          if (!nextOpen) {
            setSelectedOrderId(null);
          }
        }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  if (user?.role === 'CUSTOMER') {
    return <CustomerDashboard />;
  }

  return <OwnerDashboard />;
}
