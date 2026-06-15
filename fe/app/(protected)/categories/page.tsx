'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { AuthGuard } from '@/common/components/auth-guard';
import { useDebounce } from '@/common/hooks/use-debounce';
import type { Category } from '@/common/types/category';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CategoryForm } from '@/features/category/components/category-form';
import {
  useCategories,
  useDeleteCategory,
} from '@/features/category/hooks/use-categories';

export default function CategoriesPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const { data, isLoading } = useCategories(debouncedSearch);
  const deleteMutation = useDeleteCategory();

  const categories = data?.data ?? [];

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={['OWNER']}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-5 shadow-[var(--page-shadow-soft)] md:flex-row md:items-center md:justify-between sm:p-6">
          <div>
            <p className="text-sm text-muted-foreground">Quản lý danh mục sản phẩm</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Danh mục</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tạo và quản lý các nhóm phân loại dùng cho sản phẩm và storefront.
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedCategory(null);
              setFormOpen(true);
            }}
            className="w-full rounded-full px-5 sm:w-auto"
          >
            <Plus className="mr-2 size-4" />
            Thêm danh mục
          </Button>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-5 shadow-[var(--page-shadow-soft)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Input
                type="text"
                placeholder="Tìm kiếm danh mục..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-11 rounded-full bg-card px-4"
              />
            </div>

            <div className="rounded-full bg-muted/70 px-4 py-2 text-sm text-muted-foreground">
              {categories.length} kết quả
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/50">
                <TableHead>Tên danh mục</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.description || '-'}</TableCell>
                  <TableCell>{new Date(category.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(category)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => deleteMutation.mutate(category.id)}
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

        <CategoryForm
          open={formOpen}
          onOpenChange={setFormOpen}
          category={selectedCategory}
        />
      </div>
    </AuthGuard>
  );
}
