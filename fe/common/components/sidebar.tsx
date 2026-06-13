'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  LogOut,
  Package,
  Settings2,
  ShoppingCart,
  Tag,
  Users,
} from 'lucide-react';
import { useLogout } from '@/features/auth/hooks/use-auth';
import { useShopSettings } from '@/features/shop/hooks/use-shop';
import { Button } from '@/components/ui/button';
import { BrandMark } from './brand-mark';

const navigation = [
  { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Khách hàng', href: '/customers', icon: Users },
  { name: 'Sản phẩm', href: '/products', icon: Package },
  { name: 'Danh mục', href: '/categories', icon: Tag },
  { name: 'Đơn thuê', href: '/orders', icon: ShoppingCart },
  { name: 'Shop', href: '/shop', icon: Settings2 },
];

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const logoutMutation = useLogout();
  const { data: shopSettingsResponse } = useShopSettings();
  const shopName = shopSettingsResponse?.data?.shopName?.trim() || 'UniCo';

  return (
    <aside
      className={cn(
        'flex w-full flex-col border-r border-[var(--page-divider)] bg-[var(--sidebar)] text-sidebar-foreground md:min-h-screen md:w-[248px] md:shrink-0 md:sticky md:top-0 md:h-screen md:self-start',
        className
      )}
    >
      <div className="flex items-center gap-3 px-5 py-5 md:px-7">
        <BrandMark className="size-10" />
        <div>
          <p className="text-xl font-semibold tracking-tight">{shopName}</p>
        </div>
      </div>

      <nav className="grid gap-2 px-4 pb-4 md:block md:space-y-1 md:px-5">
        {navigation.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)]'
                  : 'text-[color-mix(in_oklab,var(--sidebar-foreground)_72%,white)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]'
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
          className="w-full bg-transparent text-sidebar-foreground border-[var(--sidebar-border)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
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
