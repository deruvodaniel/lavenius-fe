import { Badge } from '@/components/ui/badge';
import { cn } from '@/components/ui/utils';
import { useTranslation } from 'react-i18next';

export function BetaBadge({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-600 text-[10px] font-bold tracking-widest uppercase px-1.5 py-0',
        className
      )}
      aria-label={t('beta.description')}
    >
      {t('beta.label')}
    </Badge>
  );
}
