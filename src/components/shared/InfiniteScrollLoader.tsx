import { RefObject } from 'react';

interface InfiniteScrollLoaderProps {
  /** Whether more items are currently being loaded */
  isLoading: boolean;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Ref for the intersection observer target element */
  loadMoreRef: RefObject<HTMLDivElement | null>;
  /** Loading text to display */
  loadingText?: string;
}

/**
 * InfiniteScrollLoader - A loading indicator for infinite scroll lists
 * 
 * Place this at the end of a scrollable list. When it becomes visible,
 * the parent component should load more items.
 * 
 * Usage:
 * ```tsx
 * const loadMoreRef = useRef<HTMLDivElement>(null);
 * 
 * useEffect(() => {
 *   const observer = new IntersectionObserver(
 *     (entries) => {
 *       if (entries[0].isIntersecting && !isLoading) {
 *         loadMore();
 *       }
 *     },
 *     { threshold: 0.1 }
 *   );
 *   if (loadMoreRef.current) observer.observe(loadMoreRef.current);
 *   return () => observer.disconnect();
 * }, [isLoading]);
 * 
 * return (
 *   <>
 *     <ItemList items={items} />
 *     <InfiniteScrollLoader
 *       isLoading={isLoading}
 *       hasMore={hasMore}
 *       loadMoreRef={loadMoreRef}
 *     />
 *   </>
 * );
 * ```
 */
export function InfiniteScrollLoader({
  isLoading,
  hasMore,
  loadMoreRef,
  loadingText = 'Cargando más...',
}: InfiniteScrollLoaderProps) {
  if (!hasMore) return null;

  return (
    <div ref={loadMoreRef} className="py-6 text-center">
      {isLoading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2">
            <div
              className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
          <p className="text-sm text-muted-foreground">{loadingText}</p>
        </div>
      ) : (
        <div className="h-4" />
      )}
    </div>
  );
}
