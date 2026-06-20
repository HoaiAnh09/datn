'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  LogOut,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Store,
} from 'lucide-react';
import { toast } from 'sonner';
import { BrandMark } from '@/common/components/brand-mark';
import { useCartStore } from '@/common/stores/cart.store';
import { useAuthStore } from '@/common/stores/auth.store';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLogout } from '@/features/auth/hooks/use-auth';
import { useCategories } from '@/features/category/hooks/use-categories';
import { useProductsAvailability } from '@/features/product/hooks/use-products';
import { useCreateRentalRequest } from '@/features/rental-request/hooks/use-rental-requests';
import { useShopSettings } from '@/features/shop/hooks/use-shop';

type GroupedRequest = {
  rentalStartDate: string;
  rentalEndDate: string;
  items: {
    productId: number;
    quantity: number;
  }[];
};

function formatCurrency(value: number) {
  return `${Number(value).toLocaleString('vi-VN')} đ`;
}

function getDashboardRoute() {
  return '/dashboard';
}

function getChargeableRentalDays(startDate?: string, endDate?: string) {
  if (!startDate || !endDate || endDate < startDate) {
    return 0;
  }

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const diffMs = end.getTime() - start.getTime();

  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

function getInitials(name?: string | null) {
  if (!name) {
    return 'U';
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function formatDateLabel(date?: string) {
  if (!date) {
    return '--/--/----';
  }

  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();
  const requestMutation = useCreateRentalRequest();
  const { data: shopSettingsResponse } = useShopSettings();
  const { data: categoriesResponse } = useCategories();

  const cartLines = useCartStore((state) => state.lines);
  const addCartLine = useCartStore((state) => state.addLine);
  const updateCartQuantity = useCartStore((state) => state.updateQuantity);
  const removeCartLine = useCartStore((state) => state.removeLine);
  const clearCart = useCartStore((state) => state.clearCart);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [activeProductId, setActiveProductId] = useState<number | null>(null);
  const [dialogQuantity, setDialogQuantity] = useState(1);
  const [dialogStartDate, setDialogStartDate] = useState('');
  const [dialogEndDate, setDialogEndDate] = useState('');

  const shopName = shopSettingsResponse?.data?.shopName?.trim() || 'UniCo';
  const heroTitle =
    shopSettingsResponse?.data?.heroTitle?.trim() ||
    'Chọn trang phục đẹp, đặt nhanh và đến nhận đúng lịch cho ngày quan trọng của bạn.';
  const heroSubtitle =
    shopSettingsResponse?.data?.heroSubtitle?.trim() ||
    'Chạm vào từng sản phẩm để chọn lịch thuê, số lượng và thêm vào giỏ. Cửa hàng sẽ duyệt yêu cầu trước khi giữ đồ.';
  const shopAddress =
    shopSettingsResponse?.data?.address?.trim() || 'Địa chỉ cửa hàng đang được cập nhật';
  const shopHotline =
    shopSettingsResponse?.data?.hotline?.trim() || 'Liên hệ cửa hàng để biết thêm chi tiết';

  const categories = categoriesResponse?.data ?? [];
  const { data: productsResponse } = useProductsAvailability(undefined, undefined);
  const allProducts = useMemo(
    () => productsResponse?.data ?? [],
    [productsResponse?.data],
  );

  const products = useMemo(
    () =>
      allProducts.filter((product) => {
        const matchesSearch = search
          ? product.name.toLowerCase().includes(search.toLowerCase())
          : true;
        const matchesCategory = category ? product.categoryId === Number(category) : true;

        return matchesSearch && matchesCategory;
      }),
    [allProducts, category, search],
  );

  const activeProduct =
    allProducts.find((product) => product.id === activeProductId) ?? null;

  const selectedItems = useMemo(() => {
    return Object.values(cartLines)
      .map((line) => {
        const product = allProducts.find((item) => item.id === line.productId);
        if (!product) {
          return null;
        }

        const rentalDays = getChargeableRentalDays(
          line.rentalStartDate,
          line.rentalEndDate,
        );

        return {
          lineId: line.id,
          productId: line.productId,
          quantity: line.quantity,
          rentalStartDate: line.rentalStartDate,
          rentalEndDate: line.rentalEndDate,
          rentalDays,
          product,
          rentalTotal: product.rentalPrice * line.quantity * rentalDays,
          depositTotal: product.depositAmount * line.quantity,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [allProducts, cartLines]);

  const dialogRentalDays = getChargeableRentalDays(dialogStartDate, dialogEndDate);

  const cartSummary = selectedItems.reduce(
    (result, item) => {
      result.rental += item.rentalTotal;
      result.deposit += item.depositTotal;
      result.quantity += item.quantity;
      return result;
    },
    { rental: 0, deposit: 0, quantity: 0 },
  );

  const openProductDialog = (productId: number) => {
    const existingLine = Object.values(cartLines).find((line) => line.productId === productId);

    setActiveProductId(productId);
    setDialogQuantity(existingLine?.quantity ?? 1);
    setDialogStartDate(existingLine?.rentalStartDate ?? '');
    setDialogEndDate(existingLine?.rentalEndDate ?? '');
    setProductDialogOpen(true);
  };

  const addProductToCart = () => {
    if (!activeProduct) {
      return;
    }

    if (!dialogStartDate || !dialogEndDate) {
      toast.error('Vui lòng chọn ngày thuê và ngày trả cho sản phẩm này');
      return;
    }

    if (dialogEndDate < dialogStartDate) {
      toast.error('Ngày trả phải bằng hoặc sau ngày thuê');
      return;
    }

    const quantity = Math.min(
      Math.max(dialogQuantity, 1),
      Math.max(activeProduct.availableQuantity, 1),
    );

    addCartLine({
      productId: activeProduct.id,
      quantity,
      rentalStartDate: dialogStartDate,
      rentalEndDate: dialogEndDate,
    });

    setProductDialogOpen(false);
    setCartOpen(true);
  };

  const submitRequest = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập trước khi gửi yêu cầu đặt thuê');
      return;
    }

    if (user.role !== 'CUSTOMER') {
      toast.error('Tài khoản quản lý không gửi yêu cầu đặt thuê');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    const groupedRequests = selectedItems.reduce<Record<string, GroupedRequest>>(
      (result, item) => {
        const key = `${item.rentalStartDate}|${item.rentalEndDate}`;

        if (!result[key]) {
          result[key] = {
            rentalStartDate: item.rentalStartDate,
            rentalEndDate: item.rentalEndDate,
            items: [],
          };
        }

        result[key].items.push({
          productId: item.productId,
          quantity: item.quantity,
        });

        return result;
      },
      {},
    );

    try {
      for (const request of Object.values(groupedRequests)) {
        await requestMutation.mutateAsync({
          rentalStartDate: request.rentalStartDate,
          rentalEndDate: request.rentalEndDate,
          items: request.items,
          note: note.trim() || undefined,
        });
      }

      clearCart();
      setNote('');
      setCartOpen(false);
      toast.success('Đã gửi yêu cầu đặt thuê');
    } catch {
      // error toast is handled by the API layer
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(85,132,255,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(85,132,255,0.08),transparent_22%),linear-gradient(180deg,#f4f7fb_0%,#edf2f8_100%)] text-foreground">
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/82 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark className="size-11" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold tracking-tight">{shopName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <Button type="button" className="rounded-full px-4" onClick={() => setCartOpen(true)}>
              <ShoppingBag className="mr-2 size-4" />
              Giỏ đồ
              <span className="ml-2 rounded-full bg-primary-foreground/15 px-2 py-0.5 text-xs text-primary-foreground">
                {cartSummary.quantity}
              </span>
            </Button>

            {user ? (
              <>
                <Button asChild variant="outline" className="hidden rounded-full md:inline-flex">
                  <Link href={getDashboardRoute()}>
                    <ArrowRight className="mr-2 size-4" />
                    Vào dashboard
                  </Link>
                </Button>

                <div className="hidden items-center gap-3 rounded-full border border-primary/10 bg-white/90 px-2 py-2 shadow-sm md:flex">
                  <div className="flex size-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#5a7efc,#7aa2ff)] text-sm font-semibold text-white">
                    {getInitials(user.fullName)}
                  </div>
                  <div className="pr-2">
                    <p className="text-sm font-medium">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.role === 'OWNER' ? 'Chủ cửa hàng' : 'Khách hàng'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    aria-label="Đăng xuất"
                  >
                    <LogOut className="size-4" />
                  </Button>
                </div>

                <Button asChild variant="outline" size="sm" className="rounded-full md:hidden">
                  <Link href={getDashboardRoute()}>Dashboard</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link href="/register">Đăng ký</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-6 md:px-8 md:py-8">
        <section className="overflow-hidden rounded-[2rem] border border-[var(--page-divider)] bg-[var(--page-panel)] shadow-[var(--page-shadow-soft)]">
          <div className="px-6 py-8 lg:px-10 lg:py-10">
            <div className="max-w-5xl">
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-[#141b23] md:text-5xl lg:text-6xl">
                {heroTitle}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-[#5b6676]">
                {heroSubtitle}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                type="button"
                className="rounded-full px-5"
                onClick={() =>
                  document
                    .getElementById('danh-sach-san-pham')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              >
                Xem sản phẩm
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[1.8rem] border border-white/60 bg-white/86 p-4 shadow-[0_18px_44px_rgba(44,65,98,0.08)] md:p-5">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-2">
              <Label htmlFor="search">Tìm sản phẩm</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm theo tên sản phẩm..."
                  className="h-11 pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Danh mục</Label>
              <select
                id="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="flex h-11 w-full rounded-xl border border-input bg-white px-3 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section id="danh-sach-san-pham" className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-[#141b23] md:text-3xl">
                Chọn sản phẩm phù hợp cho lịch thuê của bạn
              </h2>
            </div>
            <p className="hidden text-sm text-muted-foreground md:block">
              Nhấn vào từng thẻ để mở form chọn lịch thuê.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {products.length === 0 ? (
              <div className="rounded-[1.8rem] border border-dashed border-[var(--page-divider)] bg-white/88 p-10 text-center text-sm text-muted-foreground sm:col-span-2 xl:col-span-3 2xl:col-span-4">
                Chưa có sản phẩm phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => openProductDialog(product.id)}
                  className="group overflow-hidden rounded-[1.9rem] border border-white/60 bg-white text-left shadow-[0_18px_44px_rgba(62,71,81,0.08)] transition-transform duration-200 hover:-translate-y-1"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-[linear-gradient(135deg,#d9e3f5,#f8fbff)]">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Chưa có ảnh sản phẩm
                      </div>
                    )}

                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,18,27,0.06)_15%,rgba(12,18,27,0.42)_62%,rgba(12,18,27,0.82)_100%)]" />

                    <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
                      <span className="rounded-full bg-primary/85 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur">
                        {product.categoryName || 'Sản phẩm'}
                      </span>
                      <span className="rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-[#16202b]">
                        Còn {product.availableQuantity}
                      </span>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                      <h3 className="text-xl font-semibold tracking-tight">{product.name}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/78">
                        {product.description ||
                          'Nhấn để chọn ngày thuê, ngày trả và thêm nhanh vào giỏ đồ.'}
                      </p>
                      <div className="mt-4 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-white/60">
                            Giá thuê / ngày
                          </p>
                          <p className="mt-1 text-lg font-semibold">
                            {formatCurrency(product.rentalPrice)}
                          </p>
                        </div>
                        <div className="rounded-full bg-primary/20 px-4 py-2 text-sm font-medium text-white backdrop-blur">
                          Chọn sản phẩm
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-primary/10 bg-white/80 px-4 py-6 backdrop-blur md:px-8">
        <div className="grid gap-4 rounded-[1.8rem] border border-primary/10 bg-white/90 p-5 shadow-[var(--page-shadow-soft)] md:grid-cols-4">
          <div className="rounded-[1.4rem] border border-primary/10 bg-[var(--page-panel)] p-4">
            <p className="text-sm font-medium text-muted-foreground">Cửa hàng</p>
            <p className="mt-2 text-lg font-semibold text-[#141b23]">{shopName}</p>
          </div>

          <div className="rounded-[1.4rem] border border-primary/10 bg-[var(--page-panel)] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="size-4 text-primary" />
              <span>Địa chỉ</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#536173]">{shopAddress}</p>
          </div>

          <div className="rounded-[1.4rem] border border-primary/10 bg-[var(--page-panel)] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Phone className="size-4 text-primary" />
              <span>Hotline</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#536173]">{shopHotline}</p>
          </div>

          <div className="rounded-[1.4rem] border border-primary/10 bg-[var(--page-panel)] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Mail className="size-4 text-primary" />
              <span>Email</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#536173]">
              {shopSettingsResponse?.data?.email || 'Đang cập nhật'}
            </p>
          </div>
        </div>
      </footer>

      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-h-[88vh] max-w-[calc(100%-1rem)] overflow-y-auto border border-[var(--page-divider)] bg-white p-0 sm:max-w-2xl">
          {activeProduct && (
            <div className="space-y-6 p-4 sm:p-6">
              <div className="flex items-start gap-4 rounded-[1.5rem] border border-[var(--page-divider)] bg-[#f7f9fc] p-4">
                <div className="size-20 shrink-0 overflow-hidden rounded-2xl bg-muted">
                  {activeProduct.imageUrl ? (
                    <img
                      src={activeProduct.imageUrl}
                      alt={activeProduct.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <DialogHeader className="space-y-2 text-left">
                    <DialogTitle className="text-xl sm:text-2xl">
                      {activeProduct.name}
                    </DialogTitle>
                    <DialogDescription className="text-sm leading-6 text-muted-foreground">
                      Chọn ngày thuê, ngày trả và số lượng cho sản phẩm này.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-[var(--page-divider)]">
                      Còn {activeProduct.availableQuantity} sản phẩm
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-[var(--page-divider)]">
                      {activeProduct.categoryName || 'Sản phẩm'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dialog-start-date">Ngày thuê</Label>
                  <Input
                    id="dialog-start-date"
                    type="date"
                    value={dialogStartDate}
                    onChange={(event) => setDialogStartDate(event.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dialog-end-date">Ngày trả</Label>
                  <Input
                    id="dialog-end-date"
                    type="date"
                    value={dialogEndDate}
                    onChange={(event) => setDialogEndDate(event.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">Giá thuê / ngày</p>
                  <p className="mt-2 text-lg font-semibold">
                    {formatCurrency(activeProduct.rentalPrice)}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">Tiền cọc</p>
                  <p className="mt-2 text-lg font-semibold">
                    {formatCurrency(activeProduct.depositAmount)}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">Số ngày tính tiền</p>
                  <p className="mt-2 text-lg font-semibold">{dialogRentalDays || 0} ngày</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--page-divider)] bg-white p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">Số lượng muốn thuê</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Chọn số lượng phù hợp với nhu cầu của bạn.
                    </p>
                  </div>

                  <div className="flex w-fit items-center gap-2 rounded-full border border-[var(--page-divider)] px-2 py-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-full"
                      onClick={() => setDialogQuantity((current) => Math.max(1, current - 1))}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <span className="min-w-10 text-center text-sm font-semibold">
                      {dialogQuantity}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-full"
                      onClick={() =>
                        setDialogQuantity((current) =>
                          Math.min(activeProduct.availableQuantity, current + 1),
                        )
                      }
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--page-divider)] bg-[#f7f9fd] p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tiền thuê dự kiến</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(activeProduct.rentalPrice * dialogQuantity * dialogRentalDays)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tiền cọc</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(activeProduct.depositAmount * dialogQuantity)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-[var(--page-divider)] pt-2 text-sm">
                  <span className="text-muted-foreground">Tổng dự kiến</span>
                  <span className="text-base font-semibold text-foreground">
                    {formatCurrency(
                      activeProduct.rentalPrice * dialogQuantity * dialogRentalDays +
                        activeProduct.depositAmount * dialogQuantity,
                    )}
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" className="w-full rounded-full" onClick={addProductToCart}>
                  <ShoppingBag className="mr-2 size-4" />
                  Thêm vào giỏ đồ
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Drawer open={cartOpen} onOpenChange={setCartOpen} direction="right" repositionInputs={false}>
        <DrawerContent className="h-[100dvh] max-h-[100dvh] max-w-[520px] overflow-hidden border-l border-[var(--page-divider)]">
          <div className="flex h-full min-h-0 flex-col bg-white">
            <DrawerHeader className="border-b border-[var(--page-divider)] pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <DrawerTitle className="text-lg font-semibold tracking-tight">
                    Giỏ đồ của bạn
                  </DrawerTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Mỗi sản phẩm có lịch thuê riêng. Kiểm tra lại trước khi gửi yêu cầu.
                  </p>
                </div>

                <DrawerClose asChild>
                  <Button variant="outline" size="sm" className="rounded-full">
                    Đóng
                  </Button>
                </DrawerClose>
              </div>
            </DrawerHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              {selectedItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--page-divider)] p-6 text-center text-sm text-muted-foreground">
                  Chưa có sản phẩm nào trong giỏ.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedItems.map((item) => (
                    <article
                      key={item.lineId}
                      className="rounded-2xl border border-[var(--page-divider)] bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-muted">
                          {item.product.imageUrl ? (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-sm font-semibold leading-5">
                                {item.product.name}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatCurrency(item.product.rentalPrice)}/ngày · cọc{' '}
                                {formatCurrency(item.product.depositAmount)}
                              </p>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="shrink-0 rounded-full px-2 text-xs text-muted-foreground"
                              onClick={() => removeCartLine(item.lineId)}
                            >
                              Xóa
                            </Button>
                          </div>

                          <div className="mt-3 rounded-2xl bg-[#f7f9fd] px-3 py-2 text-xs text-[#536173]">
                            <p>
                              Thuê: {formatDateLabel(item.rentalStartDate)} -{' '}
                              {formatDateLabel(item.rentalEndDate)}
                            </p>
                            <p className="mt-1">{item.rentalDays} ngày tính tiền</p>
                          </div>

                          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div className="flex w-fit items-center gap-1 rounded-full border border-[var(--page-divider)] px-1.5 py-0.5">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-8 rounded-full"
                                onClick={() =>
                                  updateCartQuantity(item.lineId, item.quantity - 1)
                                }
                              >
                                <Minus className="size-3.5" />
                              </Button>
                              <span className="min-w-8 text-center text-sm font-semibold">
                                {item.quantity}
                              </span>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-8 rounded-full"
                                onClick={() =>
                                  updateCartQuantity(
                                    item.lineId,
                                    Math.min(item.quantity + 1, item.product.availableQuantity),
                                  )
                                }
                              >
                                <Plus className="size-3.5" />
                              </Button>
                            </div>

                            <div className="text-left sm:text-right">
                              <p className="text-base font-semibold leading-none">
                                {formatCurrency(item.rentalTotal + item.depositTotal)}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Thuê {formatCurrency(item.rentalTotal)} · cọc{' '}
                                {formatCurrency(item.depositTotal)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <DrawerFooter className="border-t border-[var(--page-divider)] bg-white">
              <div className="space-y-2 rounded-2xl border border-[var(--page-divider)] bg-[#f7f9fd] p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tổng sản phẩm</span>
                  <span className="font-medium">{cartSummary.quantity} món</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tiền thuê</span>
                  <span className="font-medium">{formatCurrency(cartSummary.rental)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tiền cọc</span>
                  <span className="font-medium">{formatCurrency(cartSummary.deposit)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--page-divider)] pt-2 text-base font-semibold">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(cartSummary.rental + cartSummary.deposit)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note" className="text-xs">
                  Ghi chú cho cửa hàng
                </Label>
                <Textarea
                  id="note"
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Ghi thêm yêu cầu về size, màu hoặc thời gian nhận đồ..."
                  className="text-sm"
                />
              </div>

              {user?.role === 'OWNER' ? (
                <Button asChild className="w-full rounded-full">
                  <Link href="/dashboard">
                    <Store className="mr-2 size-4" />
                    Vào dashboard quản lý
                  </Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  className="w-full rounded-full"
                  disabled={requestMutation.isPending}
                  onClick={submitRequest}
                >
                  Gửi yêu cầu đặt thuê
                </Button>
              )}

              {!user && (
                <p className="text-center text-xs text-muted-foreground">
                  Bạn cần đăng nhập trước khi gửi yêu cầu.
                </p>
              )}
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
