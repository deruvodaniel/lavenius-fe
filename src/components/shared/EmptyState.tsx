import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  variant?: 'default' | 'subtle';
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  variant = 'default'
}: EmptyStateProps) {
  const isSubtle = variant === 'subtle';

  return (
    <div className={`flex flex-col items-center justify-center ${isSubtle ? 'py-12' : 'py-16'} px-4 text-center`}>
      <div className={`${
        isSubtle
          ? 'w-16 h-16 bg-muted'
          : 'w-20 h-20 bg-gradient-to-br from-primary-muted to-primary-muted'
      } rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110`}>
        <Icon className={`${isSubtle ? 'w-8 h-8 text-muted-foreground' : 'w-10 h-10 text-primary'}`} />
      </div>
      
      <h3 className={`${isSubtle ? 'text-base' : 'text-lg'} font-medium text-foreground mb-2`}>
        {title}
      </h3>
      
      <p className={`${isSubtle ? 'text-sm' : 'text-base'} text-muted-foreground max-w-sm mb-6`}>
        {description}
      </p>
      
      {action && (
        <Button onClick={action.onClick} disabled={action.disabled}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
