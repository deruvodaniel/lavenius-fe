import * as React from 'react';
import { cn } from '@/components/ui/utils';

type NativeSelectProps = React.ComponentProps<'select'>;

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'border-input bg-input-background text-foreground dark:bg-input/30',
          'flex h-9 w-full rounded-md border px-3 py-1 text-sm',
          'transition-[color,box-shadow] outline-none',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

NativeSelect.displayName = 'NativeSelect';

export { NativeSelect };
