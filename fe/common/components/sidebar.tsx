'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  Settings2,
  ShoppingCart,
  Tag,
} from 'lucide-react';
import { useAuthStore } from '@/common/stores/auth.store';
import type { Role } from '@/common/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLogout } from '@/features/auth/hooks/use-auth';
import { useShopSettings } from '@/features/shop/hooks/use-shop';
import { BrandMark } from './brand-mark';

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
};

const navigation: NavItem[] = [
  {
    name: 'Tổng quan',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['OWNER', 'CUSTOMER'],
  },
  {
    name: 'Yêu cầu đặt thuê',
    href: '/requests',
    icon: ReceiptText,
    roles: ['OWNER', 'CUSTOMER'],
  },
  {
    name: 'Đơn thuê',
    href: '/orders',
    icon: ShoppingCart,
    roles: ['OWNER', 'CUSTOMER'],
  },
  {
    name: 'Sản phẩm',
    href: '/products',
    icon: Package,
    roles: ['OWNER'],
  },
  {
    name: 'Danh mục',
    href: '/categories',
    icon: Tag,
    roles: ['OWNER'],
  },
  {
    name: 'Cửa hàng',
    href: '/shop',
    icon: Settings2,
    roles: ['OWNER'],
  },
];

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const logoutMutation = useLogout();
  const user = useAuthStore((state) => state.user);
  const { data: shopSettingsResponse } = useShopSettings();

  const shopName = shopSettingsResponse?.data?.shopName?.trim() || 'UniCo';
  const items = user
    ? navigation.filter((item) => item.roles.includes(user.role))
    : [];

  return (
    <aside
      className={cn(
        'flex w-full flex-col border-r border-[var(--page-divider)] bg-[var(--sidebar)] text-sidebar-foreground md:sticky md:top-0 md:h-screen md:min-h-screen md:w-[260px] md:shrink-0 md:self-start',
        className,
      )}
    >
      <div className="flex items-center gap-3 px-5 py-5 md:px-6">
        <BrandMark className="size-10" />
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold tracking-tight">{shopName}</p>
          <p className="text-sm text-muted-foreground">
            {user?.role === 'OWNER' ? 'Bảng điều khiển quản lý' : 'Khu vực khách hàng'}
          </p>
        </div>
      </div>

      <nav className="grid gap-2 px-4 pb-4 md:block md:space-y-1 md:px-5">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] shadow-[inset_0_0_0_1px_rgba(20,27,35,0.04)]'
                  : 'text-[color-mix(in_oklab,var(--sidebar-foreground)_72%,white)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]',
              )}
            >
              <item.icon className="size-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-4 pb-5 md:px-5 md:pb-6">
        <Button
          variant="outline"
          size="sm"
          className="w-full border-[var(--sidebar-border)] bg-transparent text-sidebar-foreground hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="mr-2 size-4" />
          Đăng xuất
        </Button>
      </div>
    </aside>
  );
}
