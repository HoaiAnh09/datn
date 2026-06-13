'use client';

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronsUpDown, Plus, Trash } from 'lucide-react';
import { createOrderSchema, type CreateOrderFormData } from '../schema';
import { useCreateOrder } from '../hooks/use-orders';
import { useCustomers } from '@/features/customer/hooks/use-customers';
import { useProductsAvailability } from '@/features/product/hooks/use-products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { cn } from '@/lib/utils';

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OrderItemForm {
  productId: string;
  quantity: number;
}

function mapItemsToFormValues(items: OrderItemForm[]) {
  return items.map((item) => ({
    productId: Number(item.productId) || 0,
    quantity: item.quantity,
  }));
}

function formatCurrency(value: number) {
  return `${Number(value).toLocaleString('vi-VN')}đ`;
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

export function OrderForm({ open, onOpenChange }: OrderFormProps) {
  const [items, setItems] = useState<OrderItemForm[]>([
    { productId: '', quantity: 1 },
  ]);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [productOpenIdx, setProductOpenIdx] = useState<number | null>(null);

  const createMutation = useCreateOrder();
  const { data: customersData } = useCustomers();
  const form = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      customerId: 0,
      rentalStartDate: '',
      rentalEndDate: '',
      items: mapItemsToFormValues(items),
      note: '',
    },
  });
  const rentalStartDate = useWatch({
    control: form.control,
    name: 'rentalStartDate',
  });
  const rentalEndDate = useWatch({
    control: form.control,
    name: 'rentalEndDate',
  });
  const { data: productsData } = useProductsAvailability(
    rentalStartDate,
    rentalEndDate
  );

  const customers = customersData?.data ?? [];
  const products = productsData?.data ?? [];
  const rentalDays = getChargeableRentalDays(rentalStartDate, rentalEndDate);
  const pricingSummary = items.reduce(
    (summary, item) => {
      const product = products.find(
        (productItem) => productItem.id === Number(item.productId),
      );

      if (!product) {
        return summary;
      }

      summary.rental += product.rentalPrice * item.quantity * rentalDays;
      summary.deposit += product.depositAmount * item.quantity;
      return summary;
    },
    { rental: 0, deposit: 0 },
  );

  useEffect(() => {
    form.setValue('items', mapItemsToFormValues(items), {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });
  }, [form, items]);

  const addItem = () => {
    setItems((current) => [...current, { productId: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      return;
    }

    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateItem = (
    index: number,
    field: keyof OrderItemForm,
    value: string | number
  ) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const onSubmit = (data: CreateOrderFormData) => {
    createMutation.mutate(
      {
        customerId: data.customerId,
        rentalStartDate: data.rentalStartDate,
        rentalEndDate: data.rentalEndDate,
        items: data.items,
        note: data.note,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const selectedCustomerId = useWatch({
    control: form.control,
    name: 'customerId',
  });
  const selectedCustomer = customers.find(
    (customer) => customer.id === Number(selectedCustomerId)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Tạo đơn thuê mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Khách hàng *</Label>
            <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={customerOpen}
                  className="w-full justify-between"
                >
                  {selectedCustomer
                    ? `${selectedCustomer.fullName} - ${selectedCustomer.phoneNumber}`
                    : 'Chọn khách hàng...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Tìm khách hàng..." />
                  <CommandList>
                    <CommandEmpty>Không tìm thấy.</CommandEmpty>
                    <CommandGroup>
                      {customers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={customer.fullName}
                          onSelect={() => {
                            form.setValue('customerId', customer.id, {
                              shouldDirty: true,
                              shouldValidate: form.formState.isSubmitted,
                            });
                            setCustomerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedCustomerId === customer.id
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          {customer.fullName} - {customer.phoneNumber}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {form.formState.errors.customerId && (
              <p className="text-xs text-destructive">
                {form.formState.errors.customerId.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rentalStartDate">Ngày thuê *</Label>
              <Input
                id="rentalStartDate"
                type="date"
                {...form.register('rentalStartDate')}
              />
              {form.formState.errors.rentalStartDate && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.rentalStartDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rentalEndDate">Ngày trả *</Label>
              <Input
                id="rentalEndDate"
                type="date"
                {...form.register('rentalEndDate')}
              />
              {form.formState.errors.rentalEndDate && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.rentalEndDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Sản phẩm *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-1 h-4 w-4" />
                Thêm
              </Button>
            </div>

            {items.map((item, index) => {
              const selectedProduct = products.find(
                (product) => product.id === Number(item.productId)
              );
              const itemError = form.formState.errors.items?.[index];

              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex gap-2">
                    <Popover
                      open={productOpenIdx === index}
                      onOpenChange={(isOpen) =>
                        setProductOpenIdx(isOpen ? index : null)
                      }
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={productOpenIdx === index}
                          className="flex-1 justify-between"
                        >
                          {selectedProduct
                            ? `${selectedProduct.name} (Khả dụng: ${selectedProduct.availableQuantity})`
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
                            {products
                                .filter((product) => product.availableQuantity > 0)
                                .map((product) => (
                                  <CommandItem
                                    key={product.id}
                                    value={product.name}
                                    onSelect={() => {
                                      updateItem(index, 'productId', String(product.id));
                                      setProductOpenIdx(null);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        item.productId === String(product.id)
                                          ? 'opacity-100'
                                          : 'opacity-0'
                                      )}
                                    />
                                    {product.name} ({formatCurrency(product.rentalPrice)}/ngày, khả dụng: {product.availableQuantity})
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
                        updateItem(
                          index,
                          'quantity',
                          parseInt(event.target.value, 10) || 1
                        )
                      }
                      className="w-20"
                    />

                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <Trash className="h-4 w-4" />
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

            {typeof form.formState.errors.items?.message === 'string' && (
              <p className="text-xs text-destructive">
                {form.formState.errors.items.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Ghi chú</Label>
            <Input id="note" {...form.register('note')} />
          </div>

          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Tạm tính đơn thuê</p>
                <p className="text-xs text-muted-foreground">
                  Giá thuê tính theo ngày. Trả sớm không giảm tiền thuê.
                </p>
              </div>
              <div className="rounded-full bg-background px-3 py-1 text-xs font-medium">
                {rentalDays > 0 ? `${rentalDays} ngày` : 'Chưa chọn ngày'}
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tiền thuê</span>
                <span>{formatCurrency(pricingSummary.rental)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tiền cọc</span>
                <span>{formatCurrency(pricingSummary.deposit)}</span>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span>Tổng cần thanh toán</span>
                <span>
                  {formatCurrency(
                    pricingSummary.rental + pricingSummary.deposit,
                  )}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
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
