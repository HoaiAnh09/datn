'use client';

import { useMemo, useState } from 'react';
import { useAuthStore } from '@/common/stores/auth.store';
import { OrderStatus } from '@/common/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { OrderDetailDialog } from '@/features/order/components/order-detail-dialog';
import { useDashboard } from '@/features/report/hooks/use-reports';
import { CalendarDays, CircleDollarSign, Clock3, Package } from 'lucide-react';

function formatCurrency(value: number) {
  return `${value.toLocaleString('vi-VN')}đ`;
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
      className="relative flex min-h-[196px] flex-col overflow-hidden rounded-[1.8rem] p-4 text-white shadow-lg sm:min-h-[220px] sm:rounded-3xl sm:p-6"
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

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
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
      value: dashboard?.totalRevenue ? formatCurrency(dashboard.totalRevenue) : '0đ',
      note: 'Từ các đơn đã trả.',
      gradient:
        'radial-gradient(circle at top left, rgba(255,255,255,0.35), transparent 36%), linear-gradient(135deg, #725bff 0%, #ff9276 100%)',
      icon: CircleDollarSign,
    },
    {
      title: 'Đơn ưu tiên',
      value: dashboard?.pendingOrders ?? 0,
      note: 'Đơn cần xác nhận thanh toán.',
      gradient:
        'radial-gradient(circle at top left, rgba(255,255,255,0.32), transparent 32%), linear-gradient(135deg, #00b7c2 0%, #6ea8ff 100%)',
      icon: Clock3,
    },
    {
      title: 'Đang cho thuê',
      value: dashboard?.rentingOrders ?? 0,
      note: 'Đơn đang hoạt động cần theo dõi.',
      gradient:
        'radial-gradient(circle at top left, rgba(255,255,255,0.34), transparent 34%), linear-gradient(135deg, #ff8a7a 0%, #ffc36b 100%)',
      icon: Package,
    },
  ];

  const hasRevenueData = revenue.length > 0;

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
          Chào mừng, {user?.fullName || 'Quản lý'}
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
                  Doanh thu và số đơn dựa trên dữ liệu thực tế.
                </p>
              </div>
            </div>

            {hasRevenueData ? (
              <div className="mt-6">
                <div className="mb-4 flex items-baseline gap-3">
                  <p className="text-sm text-muted-foreground">Tháng gần nhất</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(revenue[revenue.length - 1].revenue)}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/30 p-4">
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
                          `${Number(value).toLocaleString('vi-VN')}đ`
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
                        activeDot={{
                          r: 5,
                        }}
                      />
                    </ComposedChart>
                  </ChartContainer>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {revenue.slice(-4).map((item) => (
                    <div
                      key={item.month}
                      className="rounded-2xl bg-muted/30 px-3 py-2.5"
                    >
                      <p className="text-xs font-medium text-foreground">{item.month}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.orderCount} đơn
                      </p>
                    </div>
                  ))}
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
                Doanh thu chỉ tính từ đơn đã hoàn tất và gồm cả tiền phạt.
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
                  Dữ liệu từ hệ thống hiện tại
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
                      {order.customerName}
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
              <p className="mt-1 text-sm text-muted-foreground">Sản phẩm cần chú ý</p>
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
                  Sản phẩm được thuê nhiều nhất
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
