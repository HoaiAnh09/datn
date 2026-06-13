'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, type ProductFormData } from '../schema';
import { useCreateProduct, useUpdateProduct, useUploadProductImage } from '../hooks/use-products';
import { useCategories } from '@/features/category/hooks/use-categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/common/types';
import Image from 'next/image';

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

function getDefaultValues(product?: Product | null): ProductFormData {
  return {
    name: product?.name ?? '',
    description: product?.description ?? '',
    rentalPrice: product?.rentalPrice ?? 0,
    depositAmount: product?.depositAmount ?? 0,
    damageFee: product?.damageFee ?? 0,
    stockQuantity: product?.stockQuantity ?? 0,
    categoryId: product?.categoryId ?? null,
  };
}

export function ProductForm({
  open,
  onOpenChange,
  product,
}: ProductFormProps) {
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const uploadImageMutation = useUploadProductImage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const { data: categoryData } = useCategories();
  const categories = categoryData?.data ?? [];
  const previewUrl = useMemo(() => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile);
    }
    return product?.imageUrl ?? null;
  }, [product?.imageUrl, selectedFile]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: getDefaultValues(product),
  });

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] ?? null);
  };

  const onSubmit = async (data: ProductFormData) => {
    const payload = { ...data, categoryId: data.categoryId ?? undefined };
    const savedProduct = product
      ? await updateMutation.mutateAsync({ id: product.id, data: payload })
      : await createMutation.mutateAsync(payload);

    if (selectedFile && savedProduct.data?.id) {
      await uploadImageMutation.mutateAsync({
        id: savedProduct.data.id,
        file: selectedFile,
      });
    }

    onOpenChange(false);
  };

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || uploadImageMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>
            {product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 pb-6 space-y-4">
          {previewUrl && (
            <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-xl border border-border bg-muted">
              <Image
                src={previewUrl}
                alt={product?.name || 'Ảnh sản phẩm'}
                fill
                unoptimized
                sizes="160px"
                className="object-cover"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name">Tên sản phẩm *</Label>
            <Input id="name" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Danh mục</Label>
            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={categoryOpen}
                  className="w-full justify-between"
                >
                  {form.getValues('categoryId')
                    ? categories.find((c) => c.id === form.getValues('categoryId'))?.name
                    : 'Chọn danh mục...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Tìm danh mục..." />
                  <CommandList>
                    <CommandEmpty>Không tìm thấy.</CommandEmpty>
                    <CommandGroup>
                      {categories.map((category) => (
                        <CommandItem
                          key={category.id}
                          value={category.name}
                          onSelect={() => {
                            form.setValue('categoryId', category.id);
                            setCategoryOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              form.getValues('categoryId') === category.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {category.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Mô tả</Label>
            <Input id="description" {...form.register('description')} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="rentalPrice">Giá thuê/ngày *</Label>
              <Input id="rentalPrice" type="number" min="0" {...form.register('rentalPrice', { valueAsNumber: true })} />
              {form.formState.errors.rentalPrice && (
                <p className="text-xs text-destructive">{form.formState.errors.rentalPrice.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="depositAmount">Tiền cọc *</Label>
              <Input id="depositAmount" type="number" min="0" {...form.register('depositAmount', { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="damageFee">Phí hư hỏng</Label>
              <Input id="damageFee" type="number" min="0" {...form.register('damageFee', { valueAsNumber: true })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stockQuantity">Số lượng tồn kho *</Label>
            <Input id="stockQuantity" type="number" min="0" {...form.register('stockQuantity', { valueAsNumber: true })} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="image">Ảnh sản phẩm</Label>
            <Input id="image" type="file" accept="image/*" onChange={handleFileChange} />
            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, GIF. Ảnh tải lên sau khi lưu.</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {product ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
