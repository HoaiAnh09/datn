import { cn } from '@/lib/utils';

type BrandMarkProps = {
  className?: string;
  animated?: boolean;
  showShadow?: boolean;
};

export function BrandMark({
  className,
  animated = false,
  showShadow = false,
}: BrandMarkProps) {
  return (
    <div className={cn('relative isolate rotate-[-12deg]', className)}>
      {showShadow && (
        <div
          className={cn(
            'unico-mark-shadow absolute left-0 right-0',
            animated && 'unico-mark-shadow-animated'
          )}
        />
      )}
      <div className={cn('unico-mark size-full', animated && 'unico-mark-animated')} />
    </div>
  );
}
