'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { AuthGuard } from '@/common/components/auth-guard';
import { useDebounce } from '@/common/hooks/use-debounce';
import type { Product } from '@/common/types';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProductForm } from '@/features/product/components/product-form';
import {
  useDeleteProduct,
  useProducts,
  useRestoreDamagedProduct,
} from '@/features/product/hooks/use-products';
import { cn } from '@/lib/utils';

const EMPTY_PRODUCTS: Product[] = [];

function formatCurrency(value: number) {
  return `${Number(value).toLocaleString('vi-VN')} đ`;
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') ?? '';
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(search);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<Product | null>(null);
  const [restoreQuantity, setRestoreQuantity] = useState('1');
  const { data, isLoading } = useProducts(debouncedSearch);
  const deleteMutation = useDeleteProduct();
  const restoreMutation = useRestoreDamagedProduct();

  const products = data?.data ?? EMPTY_PRODUCTS;

  const stats = useMemo(() => {
    const lowStock = products.filter((product) => product.availableQuantity <= 5).length;
    const damagedItems = products.reduce(
      (total, product) => total + product.damagedQuantity,
      0,
    );

    return [
      { label: 'Tổng sản phẩm', value: products.length, icon: Package },
      { label: 'Đang hỏng', value: damagedItems, icon: AlertCircle },
      { label: 'Khả dụng thấp', value: lowStock, icon: RotateCcw },
    ];
  }, [products]);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormOpen(true);
  };

  const openRestoreDialog = (product: Product) => {
    setRestoreTarget(product);
    setRestoreQuantity(String(Math.min(1, Math.max(product.damagedQuantity, 1))));
    setRestoreDialogOpen(true);
  };

  const submitRestore = () => {
    if (!restoreTarget) {
      return;
    }

    const quantity = Number(restoreQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return;
    }

    restoreMutation.mutate(
      { id: restoreTarget.id, quantity },
      {
        onSuccess: () => {
          setRestoreDialogOpen(false);
          setRestoreTarget(null);
          setRestoreQuantity('1');
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          <Skeleton className="h-28 rounded-[1.9rem]" />
          <Skeleton className="h-28 rounded-[1.9rem]" />
          <Skeleton className="h-28 rounded-[1.9rem]" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={['OWNER']}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-5 shadow-[var(--page-shadow-soft)] sm:p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Quản lý danh mục sản phẩm</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Sản phẩm</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Quản lý thông tin, hình ảnh và tình trạng hàng khả dụng của từng mẫu.
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedProduct(null);
              setFormOpen(true);
            }}
            className="w-full rounded-full px-5 sm:w-auto"
          >
            <Plus className="mr-2 size-4" />
            Thêm sản phẩm
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          {stats.map((item) => (
            <Card
              key={item.label}
              className="rounded-[1.6rem] border-0 bg-white shadow-[0_12px_32px_rgba(120,134,164,0.12)] sm:rounded-[1.9rem]"
            >
              <CardContent className="flex min-h-[96px] items-center justify-between gap-3 p-4 sm:min-h-[112px] sm:gap-4 sm:p-5">
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold sm:text-3xl">{item.value}</p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-muted/70 sm:size-12 sm:rounded-2xl">
                  <item.icon className="size-4 text-foreground sm:size-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-5 shadow-[var(--page-shadow-soft)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-11 rounded-full bg-card pl-10 pr-4"
              />
            </div>

            <div className="rounded-full bg-muted/70 px-4 py-2 text-sm text-muted-foreground">
              {products.length} kết quả
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/50">
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Giá thuê/ngày</TableHead>
                <TableHead>Phí hư hỏng</TableHead>
                <TableHead>Tổng kho</TableHead>
                <TableHead>Đang hỏng</TableHead>
                <TableHead>Khả dụng</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            width={48}
                            height={48}
                            unoptimized
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-muted-foreground">
                            {product.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium">{product.name}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {product.description || 'Chưa có mô tả'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="rounded-full bg-muted/70 px-3 py-1 text-sm text-foreground">
                      {product.categoryName || product.category || 'Chưa phân loại'}
                    </span>
                  </TableCell>
                  <TableCell>{formatCurrency(product.rentalPrice)}</TableCell>
                  <TableCell>{formatCurrency(product.damageFee)}</TableCell>
                  <TableCell>{product.stockQuantity}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-sm font-medium',
                        product.damagedQuantity > 0
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {product.damagedQuantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-sm font-medium',
                        product.availableQuantity <= 5
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-700',
                      )}
                    >
                      {product.availableQuantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {product.damagedQuantity > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRestoreDialog(product)}
                        >
                          <RotateCcw className="mr-1 size-4" />
                          Khôi phục
                        </Button>
                      )}
                      <Button variant="outline" size="icon" onClick={() => handleEdit(product)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => deleteMutation.mutate(product.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <ProductForm
          key={`${formOpen ? 'open' : 'closed'}-${selectedProduct?.id ?? 'new'}`}
          open={formOpen}
          onOpenChange={setFormOpen}
          product={selectedProduct}
        />

        <Dialog
          open={restoreDialogOpen}
          onOpenChange={(open) => {
            setRestoreDialogOpen(open);
            if (!open) {
              setRestoreTarget(null);
              setRestoreQuantity('1');
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Khôi phục hàng hỏng</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm">
                <p className="font-medium">{restoreTarget?.name}</p>
                <p className="mt-1 text-muted-foreground">
                  Đang hỏng: {restoreTarget?.damagedQuantity ?? 0} · Khả dụng:{' '}
                  {restoreTarget?.availableQuantity ?? 0}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="restoreQuantity">Số lượng khôi phục</Label>
                <Input
                  id="restoreQuantity"
                  type="number"
                  min="1"
                  max={restoreTarget?.damagedQuantity ?? 1}
                  value={restoreQuantity}
                  onChange={(event) => setRestoreQuantity(event.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRestoreDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                type="button"
                onClick={submitRestore}
                disabled={restoreMutation.isPending}
              >
                Xác nhận khôi phục
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
