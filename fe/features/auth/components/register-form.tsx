'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BrandMark } from '@/common/components/brand-mark';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useShopSettings } from '@/features/shop/hooks/use-shop';
import { useRegister } from '../hooks/use-auth';
import { registerSchema, type RegisterFormData } from '../schema';

export function RegisterForm() {
  const registerMutation = useRegister();
  const { data: shopSettingsResponse } = useShopSettings();
  const shopName = shopSettingsResponse?.data?.shopName?.trim() || 'UniCo';

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      username: '',
      phoneNumber: '',
      address: '',
      password: '',
    },
  });

  return (
    <Card className="w-full max-w-md border-0 shadow-none ring-1 ring-border/60">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex flex-col items-center gap-3">
          <BrandMark className="size-14" />
          <p className="text-2xl font-semibold tracking-tight">{shopName}</p>
        </div>
        <CardTitle className="text-2xl">Tạo tài khoản</CardTitle>
        <CardDescription>Tạo tài khoản để gửi yêu cầu đặt thuê</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit((data) => registerMutation.mutate(data))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ tên</Label>
            <Input id="fullName" {...form.register('fullName')} />
            {form.formState.errors.fullName && (
              <p className="text-sm text-destructive">
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Tên đăng nhập</Label>
            <Input id="username" {...form.register('username')} />
            {form.formState.errors.username && (
              <p className="text-sm text-destructive">
                {form.formState.errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Số điện thoại</Label>
            <Input id="phoneNumber" {...form.register('phoneNumber')} />
            {form.formState.errors.phoneNumber && (
              <p className="text-sm text-destructive">
                {form.formState.errors.phoneNumber.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input id="address" {...form.register('address')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input id="password" type="password" {...form.register('password')} />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Đã có tài khoản?{' '}
            <Link href="/login" className="font-medium text-foreground underline">
              Đăng nhập
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
