'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import {
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  MapPin,
  Phone,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CustomerForm } from '@/features/customer/components/customer-form';
import {
  useCustomers,
  useDeleteCustomer,
} from '@/features/customer/hooks/use-customers';
import type { Customer } from '@/common/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/common/hooks/use-debounce';
import { cn } from '@/lib/utils';

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') ?? '';
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(search);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { data, isLoading } = useCustomers(debouncedSearch);
  const deleteMutation = useDeleteCustomer();

  const customers = data?.data ?? [];

  const stats = [
    { label: 'Tổng khách hàng', value: customers.length, icon: UserRound },
    {
      label: 'Có địa chỉ',
      value: customers.filter((item) => Boolean(item.address)).length,
      icon: MapPin,
    },
    {
      label: 'Có số điện thoại',
      value: customers.filter((item) => Boolean(item.phoneNumber)).length,
      icon: Phone,
    },
  ];

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <Skeleton className="h-28 rounded-[1.9rem]" />
          <Skeleton className="h-28 rounded-[1.9rem]" />
          <Skeleton className="h-28 rounded-[1.9rem]" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-5 shadow-[var(--page-shadow-soft)] md:flex-row md:items-center md:justify-between sm:p-6">
        <div>
          <p className="text-sm text-muted-foreground">Quản lý dữ liệu khách hàng</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Khách hàng</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi thông tin liên hệ, địa chỉ và ghi chú của khách thuê.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedCustomer(null);
            setFormOpen(true);
          }}
          className="w-full rounded-full px-5 sm:w-auto"
        >
          <Plus className="mr-2 size-4" />
          Thêm khách hàng
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((item, index) => (
          <Card
            key={item.label}
            className={cn(
              'rounded-[1.6rem] border-0 bg-white shadow-[0_12px_32px_rgba(120,134,164,0.12)] sm:rounded-[1.9rem]',
              index === stats.length - 1 && stats.length % 2 !== 0 && 'col-span-2 lg:col-span-1'
            )}
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
            <Search className="pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm khách hàng..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 rounded-full bg-card pr-4 pl-10"
            />
          </div>

          <div className="rounded-full bg-muted/70 px-4 py-2 text-sm text-muted-foreground">
            {customers.length} kết quả
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Đang tải...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/50">
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{customer.fullName}</TableCell>
                    <TableCell>{customer.phoneNumber}</TableCell>
                    <TableCell>{customer.address || '-'}</TableCell>
                    <TableCell>{customer.note || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(customer)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => deleteMutation.mutate(customer.id)}
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
        )}
      </div>

      <CustomerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={selectedCustomer}
      />
    </div>
  );
}
