import { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/components/ui/utils';

interface CollapsibleSectionProps {
  /** Section title displayed in header */
  title: string;
  /** Icon component to display next to title */
  icon: React.ElementType;
  /** Icon color class (e.g., 'text-pink-600') */
  iconColor?: string;
  /** Whether section starts expanded */
  defaultOpen?: boolean;
  /** Content to render inside the collapsible area */
  children: ReactNode;
  /** Badge/count to show in header (optional) */
  badge?: ReactNode;
  /** Additional className for the card */
  className?: string;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Collapsible card section with animated expand/collapse.
 * Uses CSS transitions for smooth height animation.
 */
export function CollapsibleSection({
  title,
  icon: Icon,
  iconColor = 'text-indigo-600',
  defaultOpen = true,
  children,
  badge,
  className,
  onOpenChange,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
      <Card
        className={cn(
          'bg-card overflow-hidden',
          'transition-shadow duration-200 hover:shadow-md',
          className
        )}
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'w-full p-4 flex items-center justify-between',
              'hover:bg-muted',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset',
              'rounded-t-lg',
              !isOpen && 'rounded-b-lg'
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className={cn('w-5 h-5', iconColor)} />
              <h3 className="font-semibold text-foreground">
                {title}
              </h3>
              {badge}
            </div>
            <ChevronDown
              className={cn(
                'w-5 h-5 text-muted-foreground transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent
          className={cn(
            'overflow-hidden',
            'data-[state=open]:animate-collapsible-down',
            'data-[state=closed]:animate-collapsible-up'
          )}
        >
          <div className="px-4 pb-4">{children}</div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
