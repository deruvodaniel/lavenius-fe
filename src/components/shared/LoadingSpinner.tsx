/**
 * Loading Spinner Component
 * Reusable loading indicator with animated dots
 */

import { useTranslation } from 'react-i18next';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ message, size = 'md' }: LoadingSpinnerProps) {
  const { t } = useTranslation();
  const displayMessage = message || t('common.loading');

  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="inline-flex items-center gap-2">
        <div 
          className={`${dotSizes[size]} bg-indigo-600 rounded-full animate-bounce`} 
          style={{ animationDelay: '0ms' }}
        />
        <div 
          className={`${dotSizes[size]} bg-indigo-600 rounded-full animate-bounce`} 
          style={{ animationDelay: '150ms' }}
        />
        <div 
          className={`${dotSizes[size]} bg-indigo-600 rounded-full animate-bounce`} 
          style={{ animationDelay: '300ms' }}
        />
      </div>
      <p className="text-muted-foreground">{displayMessage}</p>
    </div>
  );
}
