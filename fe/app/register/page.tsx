'use client';

import { GuestGuard } from '@/common/components/guest-guard';
import { RegisterForm } from '@/features/auth/components/register-form';

export default function RegisterPage() {
  return (
    <GuestGuard>
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
        <RegisterForm />
      </div>
    </GuestGuard>
  );
}
