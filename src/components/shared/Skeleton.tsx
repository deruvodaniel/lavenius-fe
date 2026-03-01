import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave';
}

export function Skeleton({ 
  className = '', 
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}: SkeletonProps) {
  const baseClasses = 'bg-muted rounded';

  const variantClasses = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-background to-muted'
  };

  const style: React.CSSProperties = {
    width: width,
    height: height
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1">
            <Skeleton width="60%" className="mb-2" />
            <Skeleton width="40%" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rectangular" width={36} height={36} />
          <Skeleton variant="rectangular" width={36} height={36} />
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <Skeleton width={80} height={24} className="rounded-full" />
        <Skeleton width={80} height={24} className="rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton width="100%" />
        <Skeleton width="80%" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-card rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex gap-4">
          <Skeleton width="20%" />
          <Skeleton width="30%" />
          <Skeleton width="25%" />
          <Skeleton width="15%" />
          <Skeleton width="10%" />
        </div>
      </div>
      {/* Rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4">
            <div className="flex gap-4 items-center">
              <Skeleton width="20%" />
              <Skeleton width="30%" />
              <Skeleton width="25%" />
              <Skeleton width="15%" />
              <Skeleton width="10%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-card rounded-lg shadow-sm p-4 border border-border">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1">
              <Skeleton width="60%" className="mb-2" />
              <Skeleton width="40%" />
            </div>
            <Skeleton width={60} height={32} className="rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Calendar skeleton - shows a loading state for calendar views
 */
export function SkeletonCalendar() {
  return (
    <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={120} height={28} />
        <div className="flex gap-2">
          <Skeleton width={32} height={32} className="rounded" />
          <Skeleton width={32} height={32} className="rounded" />
        </div>
      </div>
      {/* Week days header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} height={20} className="rounded" />
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} height={60} className="rounded" />
        ))}
      </div>
    </div>
  );
}

/**
 * Stats card skeleton - for payment stats and dashboard metrics
 */
export function SkeletonStats({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="bg-card rounded-lg shadow-sm p-4 border border-border">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton width="60%" height={16} />
          </div>
          <Skeleton width="80%" height={28} className="mb-1" />
          <Skeleton width="50%" height={14} />
        </div>
      ))}
    </div>
  );
}

/**
 * Notes skeleton - for clinical notes list
 */
export function SkeletonNotes({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-start justify-between mb-2">
            <Skeleton width="40%" height={18} />
            <Skeleton width={80} height={14} />
          </div>
          <div className="space-y-2">
            <Skeleton width="100%" height={14} />
            <Skeleton width="90%" height={14} />
            <Skeleton width="70%" height={14} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Session card skeleton - for upcoming sessions
 */
export function SkeletonSessionCard() {
  return (
    <div className="bg-card rounded-lg p-4 border border-border">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton variant="circular" width={36} height={36} />
        <div className="flex-1">
          <Skeleton width="50%" height={16} className="mb-1" />
          <Skeleton width="30%" height={12} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton width={60} height={24} className="rounded-full" />
        <Skeleton width={80} height={24} className="rounded-full" />
      </div>
    </div>
  );
}

/**
 * Full page loading overlay with spinner
 */
export function LoadingOverlay({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}

/**
 * Inline spinner for buttons and small loading states
 */
export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  };
  
  return (
    <div 
      className={`${sizes[size]} border-current border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Cargando"
    />
  );
}
