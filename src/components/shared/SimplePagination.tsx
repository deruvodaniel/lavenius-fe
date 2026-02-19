import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  /** Labels for i18n */
  labels?: {
    of?: string;
    previousPage?: string;
    nextPage?: string;
  };
}

/**
 * SimplePagination - A simple pagination component with prev/next buttons
 * 
 * Shows: "1-10 de 50" with prev/next buttons
 * Used in Cobros, Pacientes, and other list views
 */
export function SimplePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  labels = {},
}: SimplePaginationProps) {
  if (totalPages <= 1) return null;

  const { of: ofLabel = 'de', previousPage = 'Página anterior', nextPage = 'Página siguiente' } = labels;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
      <p className="text-sm text-gray-500">
        {startItem}-{endItem} {ofLabel} {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8"
          aria-label={previousPage}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-3 text-sm text-gray-600">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8"
          aria-label={nextPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
