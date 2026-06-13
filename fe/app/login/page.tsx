'use client';

import { GuestGuard } from '@/common/components/guest-guard';
import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
  return (
    <GuestGuard>
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <LoginForm />
      </div>
    </GuestGuard>
  );
}
