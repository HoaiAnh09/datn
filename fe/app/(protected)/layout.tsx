'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { AuthGuard } from '@/common/components/auth-guard';
import { BrandMark } from '@/common/components/brand-mark';
import { Sidebar } from '@/common/components/sidebar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-transparent text-foreground md:flex-row">
        <div className="sticky top-0 z-30 border-b border-[var(--page-divider)] bg-[color-mix(in_oklab,var(--page-panel)_86%,white)]/95 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <BrandMark className="size-9" />
              <div>
                <p className="text-base font-semibold tracking-tight">UniCo</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Mở menu điều hướng"
            >
              <Menu className="size-4" />
            </Button>
          </div>
        </div>

        <Sidebar className="hidden md:flex" />
        <main className="min-w-0 flex-1 p-4 md:p-[var(--spacing-layout)]">
          {children}
        </main>

        <Dialog open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <DialogContent
            className="left-0 top-0 h-screen w-[280px] max-w-[85vw] translate-x-0 translate-y-0 rounded-none border-r border-[var(--page-divider)] p-0 sm:max-w-[280px]"
            showCloseButton={false}
          >
            <DialogHeader className="sr-only">
              <DialogTitle>Điều hướng</DialogTitle>
            </DialogHeader>
            <Sidebar
              className="h-full border-r-0"
              onNavigate={() => setMobileSidebarOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
