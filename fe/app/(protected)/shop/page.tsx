'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Building2, Landmark, Phone, ReceiptText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useShopSettings, useUpdateShopSettings } from '@/features/shop/hooks/use-shop';

type ShopFormData = {
  shopName: string;
  legalName: string;
  hotline: string;
  email: string;
  address: string;
  taxCode: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  invoiceFooter: string;
};

export default function ShopPage() {
  const { data, isLoading } = useShopSettings();
  const updateMutation = useUpdateShopSettings();
  const form = useForm<ShopFormData>({
    defaultValues: {
      shopName: '',
      legalName: '',
      hotline: '',
      email: '',
      address: '',
      taxCode: '',
      bankName: '',
      bankAccountNumber: '',
      bankAccountName: '',
      invoiceFooter: '',
    },
  });

  useEffect(() => {
    if (!data?.data) {
      return;
    }

    form.reset({
      shopName: data.data.shopName || '',
      legalName: data.data.legalName || '',
      hotline: data.data.hotline || '',
      email: data.data.email || '',
      address: data.data.address || '',
      taxCode: data.data.taxCode || '',
      bankName: data.data.bankName || '',
      bankAccountNumber: data.data.bankAccountNumber || '',
      bankAccountName: data.data.bankAccountName || '',
      invoiceFooter: data.data.invoiceFooter || '',
    });
  }, [data?.data, form]);

  const onSubmit = (values: ShopFormData) => {
    updateMutation.mutate(values);
  };

  const stats = [
    {
      label: 'Tên hiển thị',
      value: data?.data?.shopName || 'Chưa cấu hình',
      icon: Building2,
    },
    {
      label: 'Hotline',
      value: data?.data?.hotline || 'Chưa cấu hình',
      icon: Phone,
    },
    {
      label: 'Mã số thuế',
      value: data?.data?.taxCode || 'Chưa cấu hình',
      icon: ReceiptText,
    },
    {
      label: 'Ngân hàng',
      value: data?.data?.bankName || 'Chưa cấu hình',
      icon: Landmark,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Skeleton className="h-28 rounded-[1.9rem]" />
          <Skeleton className="h-28 rounded-[1.9rem]" />
          <Skeleton className="h-28 rounded-[1.9rem]" />
          <Skeleton className="h-28 rounded-[1.9rem]" />
        </div>
        <Skeleton className="h-[560px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-5 shadow-[var(--page-shadow-soft)] sm:p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Quản lý thông tin cửa hàng</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Shop</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Thông tin ở đây sẽ được dùng cho hóa đơn, biên nhận và thanh toán.
          </p>
        </div>
        <Button
          type="submit"
          form="shop-settings-form"
          className="w-full rounded-full px-5 sm:w-auto"
          disabled={updateMutation.isPending}
        >
          Lưu thông tin shop
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((item) => (
          <Card
            key={item.label}
            className="rounded-[1.6rem] border-0 bg-white shadow-[0_12px_32px_rgba(120,134,164,0.12)] sm:rounded-[1.9rem]"
          >
            <CardContent className="flex min-h-[96px] items-center justify-between gap-3 p-4 sm:min-h-[112px] sm:gap-4 sm:p-5">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground sm:text-sm">{item.label}</p>
                <p className="mt-2 truncate text-sm font-semibold sm:text-base">{item.value}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted/70 sm:size-12 sm:rounded-2xl">
                <item.icon className="size-4 text-foreground sm:size-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <form
        id="shop-settings-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="rounded-2xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-5 shadow-[var(--page-shadow-soft)]"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="shopName">Tên shop</Label>
            <Input id="shopName" {...form.register('shopName')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="legalName">Tên pháp lý / tên hộ kinh doanh</Label>
            <Input id="legalName" {...form.register('legalName')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hotline">Hotline</Label>
            <Input id="hotline" {...form.register('hotline')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" {...form.register('email')} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input id="address" {...form.register('address')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxCode">Mã số thuế</Label>
            <Input id="taxCode" {...form.register('taxCode')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoiceFooter">Footer hóa đơn</Label>
            <Input id="invoiceFooter" {...form.register('invoiceFooter')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankName">Tên ngân hàng</Label>
            <Input id="bankName" {...form.register('bankName')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankAccountNumber">Số tài khoản</Label>
            <Input id="bankAccountNumber" {...form.register('bankAccountNumber')} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bankAccountName">Tên chủ tài khoản</Label>
            <Input id="bankAccountName" {...form.register('bankAccountName')} />
          </div>
        </div>
      </form>
    </div>
  );
}
