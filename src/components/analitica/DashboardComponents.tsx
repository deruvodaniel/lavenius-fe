import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/components/ui/utils';

// Lazy load framer-motion to avoid SSR/hydration issues
const MotionDiv = lazy(() => 
  import('framer-motion').then(mod => ({ 
    default: mod.motion.div 
  }))
);

// ============================================================================
// ANIMATED SECTION - Framer Motion wrapper for fade-in-up animations
// ============================================================================

interface AnimatedSectionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function AnimatedSection({ children, delay = 0, className }: AnimatedSectionProps) {
  return (
    <Suspense fallback={<div className={className}>{children}</div>}>
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.4, 
          delay,
          ease: [0.25, 0.46, 0.45, 0.94] // easeOutQuad
        }}
        className={className}
      >
        {children}
      </MotionDiv>
    </Suspense>
  );
}

// ============================================================================
// EMPTY STATE - Unified empty state component
// ============================================================================

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  variant?: 'success' | 'neutral' | 'warning';
  className?: string;
}

const variantStyles = {
  success: {
    bg: 'bg-green-100',
    icon: 'text-green-600',
  },
  neutral: {
    bg: 'bg-muted',
    icon: 'text-muted-foreground',
  },
  warning: {
    bg: 'bg-amber-100',
    icon: 'text-amber-600',
  },
};

export function EmptyState({ icon: Icon, title, variant = 'neutral', className }: EmptyStateProps) {
  const styles = variantStyles[variant];
  
  return (
    <div className={cn('flex flex-col items-center justify-center py-8', className)}>
      <div className={cn('w-12 h-12 rounded-full flex items-center justify-center mb-3', styles.bg)}>
        <Icon className={cn('w-6 h-6', styles.icon)} />
      </div>
      <p className="text-sm text-muted-foreground text-center">{title}</p>
    </div>
  );
}

// ============================================================================
// SWIPEABLE CARDS - Touch-enabled carousel for mobile
// ============================================================================

interface SwipeableCardsProps {
  children: React.ReactNode[];
  peek?: boolean;
}

export function SwipeableCards({ children, peek = false }: SwipeableCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Filter out falsy children (hidden sections)
  const validChildren = children.filter(Boolean);
  const totalCards = validChildren.length;

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < totalCards - 1) {
      setCurrentIndex(prev => prev + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // Scroll to current card
  useEffect(() => {
    if (containerRef.current && trackRef.current) {
      const firstCard = trackRef.current.querySelector('[data-swipe-card]') as HTMLElement | null;
      if (!firstCard) return;

      const trackStyle = window.getComputedStyle(trackRef.current);
      const gap = parseFloat(trackStyle.columnGap || trackStyle.gap || '0') || 0;
      const targetLeft = currentIndex * (firstCard.offsetWidth + gap);

      containerRef.current.scrollTo({
        left: targetLeft,
        behavior: 'smooth'
      });
    }
  }, [currentIndex, peek]);

  if (totalCards === 0) return null;
  if (totalCards === 1) return <>{validChildren[0]}</>;

  return (
    <div className="relative">
      {/* Cards Container */}
      <div
        ref={containerRef}
        className="overflow-x-hidden overflow-y-visible"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          ref={trackRef}
          className={cn('flex', peek ? 'gap-3 px-[7%]' : '')}
        >
          {validChildren.map((child, index) => (
            <div 
              key={index} 
              data-swipe-card
              className={cn(
                'flex-shrink-0',
                peek ? 'w-[86%] pt-5 pb-4' : 'w-full px-1'
              )}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows (visible on touch devices with enough space) */}
      <button
        onClick={goToPrevious}
        disabled={currentIndex === 0}
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10',
          'w-8 h-8 rounded-full bg-background shadow-md flex items-center justify-center',
          'transition-opacity',
          currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
        aria-label="Previous card"
      >
        <ChevronLeft className="w-5 h-5 text-muted-foreground" />
      </button>
      
      <button
        onClick={goToNext}
        disabled={currentIndex === totalCards - 1}
        className={cn(
          'absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10',
          'w-8 h-8 rounded-full bg-background shadow-md flex items-center justify-center',
          'transition-opacity',
          currentIndex === totalCards - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
        aria-label="Next card"
      >
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {validChildren.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              index === currentIndex 
                ? 'bg-indigo-600' 
                : 'bg-border hover:bg-muted-foreground'
            )}
            aria-label={`Go to card ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// DASHBOARD SKELETON - Full page skeleton with section-specific loading states
// ============================================================================

export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Welcome Header Skeleton */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 bg-white/20" />
            <Skeleton className="h-10 w-64 bg-white/20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg bg-white/20" />
        </div>
      </div>

      {/* Today's Summary Skeleton */}
      <Card className="p-4 bg-card">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>

      {/* Stats Section Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-4 bg-card">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="w-12 h-12 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>

      {/* Pending Payments Skeleton */}
      <Card className="p-4 bg-card">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-36" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between p-3">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </Card>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <Card key={i} className="p-4 bg-card">
            <div className="mb-4">
              <Skeleton className="h-5 w-40 mb-1" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
          </Card>
        ))}
      </div>
    </div>
  );
}
