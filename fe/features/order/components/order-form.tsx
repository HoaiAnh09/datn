'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Check, ChevronsUpDown, Plus, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useProductsAvailability } from '@/features/product/hooks/use-products';
import { useCreateOrder } from '../hooks/use-orders';
import { createOrderSchema, type CreateOrderFormData } from '../schema';
import { formatCurrency } from './order-detail-dialog';

type ItemForm = {
  productId: string;
  quantity: number;
};

function mapItems(items: ItemForm[]) {
  return items.map((item) => ({
    productId: Number(item.productId) || 0,
    quantity: item.quantity,
  }));
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

export function OrderForm({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [items, setItems] = useState<ItemForm[]>([{ productId: '', quantity: 1 }]);
  const [openComboboxIndex, setOpenComboboxIndex] = useState<number | null>(null);
  const createMutation = useCreateOrder();
  const form = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      renterFullName: '',
      renterPhoneNumber: '',
      renterAddress: '',
      rentalStartDate: '',
      rentalEndDate: '',
      items: mapItems(items),
      note: '',
    },
  });

  const rentalStartDate = useWatch({ control: form.control, name: 'rentalStartDate' });
  const rentalEndDate = useWatch({ control: form.control, name: 'rentalEndDate' });
  const rentalDays = getChargeableRentalDays(rentalStartDate, rentalEndDate);
  const { data: productsResponse } = useProductsAvailability(
    rentalStartDate,
    rentalEndDate,
  );
  const products = productsResponse?.data ?? [];

  useEffect(() => {
    form.setValue('items', mapItems(items), {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });
  }, [form, items]);

  const pricingSummary = items.reduce(
    (summary, item) => {
      const product = products.find((productItem) => productItem.id === Number(item.productId));
      if (!product) {
        return summary;
      }

      summary.rental += product.rentalPrice * item.quantity * rentalDays;
      summary.deposit += product.depositAmount * item.quantity;
      return summary;
    },
    { rental: 0, deposit: 0 },
  );

  const updateItem = (index: number, key: keyof ItemForm, value: string | number) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  };

  const onSubmit = (data: CreateOrderFormData) => {
    createMutation.mutate(
      {
        renterFullName: data.renterFullName,
        renterPhoneNumber: data.renterPhoneNumber,
        renterAddress: data.renterAddress,
        rentalStartDate: data.rentalStartDate,
        rentalEndDate: data.rentalEndDate,
        items: data.items,
        note: data.note,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          setItems([{ productId: '', quantity: 1 }]);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo đơn thuê mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="renterFullName">Tên người thuê</Label>
              <Input id="renterFullName" {...form.register('renterFullName')} />
              {form.formState.errors.renterFullName && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.renterFullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="renterPhoneNumber">Số điện thoại</Label>
              <Input id="renterPhoneNumber" {...form.register('renterPhoneNumber')} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="renterAddress">Địa chỉ</Label>
              <Input id="renterAddress" {...form.register('renterAddress')} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rentalStartDate">Ngày thuê</Label>
              <Input id="rentalStartDate" type="date" {...form.register('rentalStartDate')} />
              {form.formState.errors.rentalStartDate && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.rentalStartDate.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rentalEndDate">Ngày trả</Label>
              <Input id="rentalEndDate" type="date" {...form.register('rentalEndDate')} />
              {form.formState.errors.rentalEndDate && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.rentalEndDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Sản phẩm</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setItems((current) => [...current, { productId: '', quantity: 1 }])
                }
              >
                <Plus className="mr-1 size-4" />
                Thêm dòng
              </Button>
            </div>

            {items.map((item, index) => {
              const itemError = form.formState.errors.items?.[index];
              const selectedProduct = products.find(
                (p) => p.id === Number(item.productId),
              );
              const availableProducts = products.filter(
                (p) => p.availableQuantity > 0,
              );

              return (
                <div key={index} className="space-y-1">
                  <div className="flex gap-2">
                    <Popover
                      open={openComboboxIndex === index}
                      onOpenChange={(open) =>
                        setOpenComboboxIndex(open ? index : null)
                      }
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={openComboboxIndex === index}
                          className="h-8 flex-1 justify-between px-3 font-normal"
                        >
                          {selectedProduct
                            ? `${selectedProduct.name} — còn ${selectedProduct.availableQuantity}`
                            : 'Chọn sản phẩm...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Tìm sản phẩm..." />
                          <CommandList>
                            <CommandEmpty>Không tìm thấy.</CommandEmpty>
                            <CommandGroup>
                              {availableProducts.map((product) => (
                                <CommandItem
                                  key={product.id}
                                  value={product.name}
                                  onSelect={() => {
                                    updateItem(index, 'productId', String(product.id));
                                    setOpenComboboxIndex(null);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      item.productId === String(product.id)
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                  {product.name} — còn {product.availableQuantity}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(index, 'quantity', Number(event.target.value || 1))
                      }
                      className="w-24"
                    />

                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setItems((current) => current.filter((_, idx) => idx !== index))
                        }
                      >
                        <Trash className="size-4" />
                      </Button>
                    )}
                  </div>

                  {(itemError?.productId?.message || itemError?.quantity?.message) && (
                    <p className="text-xs text-destructive">
                      {itemError?.productId?.message || itemError?.quantity?.message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Ghi chú</Label>
            <Input id="note" {...form.register('note')} />
          </div>

          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Số ngày tính tiền</span>
              <span className="font-medium">{rentalDays || 0} ngày</span>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tiền thuê</span>
                <span>{formatCurrency(pricingSummary.rental)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tiền cọc</span>
                <span>{formatCurrency(pricingSummary.deposit)}</span>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span>Tổng dự kiến</span>
                <span>{formatCurrency(pricingSummary.rental + pricingSummary.deposit)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              Tạo đơn
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
