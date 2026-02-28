import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
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
          : 'w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100'
      } rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110`}>
        <Icon className={`${isSubtle ? 'w-8 h-8 text-muted-foreground' : 'w-10 h-10 text-indigo-600'}`} />
      </div>
      
      <h3 className={`${isSubtle ? 'text-base' : 'text-lg'} font-medium text-foreground mb-2`}>
        {title}
      </h3>
      
      <p className={`${isSubtle ? 'text-sm' : 'text-base'} text-muted-foreground max-w-sm mb-6`}>
        {description}
      </p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
