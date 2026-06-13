import { BrandMark } from '@/common/components/brand-mark';

export function Loading() {
  return (
    <div className="flex items-center justify-center py-16">
      <BrandMark className="size-12" animated showShadow />
    </div>
  );
}
