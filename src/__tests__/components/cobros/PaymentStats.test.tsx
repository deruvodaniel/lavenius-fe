import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaymentStats } from '@/components/cobros/PaymentStats';

// Mock formatCurrency
vi.mock('@/lib/utils/dateFormatters', () => ({
  formatCurrency: (amount: number) => `$${amount.toLocaleString('de-DE')}`,
}));

// Mock totals data
const mockTotals = {
  totalAmount: 100000,
  paidAmount: 60000,
  pendingAmount: 25000,
  overdueAmount: 15000,
  totalCount: 10,
  paidCount: 6,
  pendingCount: 3,
  overdueCount: 1,
};

const mockZeroTotals = {
  totalAmount: 0,
  paidAmount: 0,
  pendingAmount: 0,
  overdueAmount: 0,
  totalCount: 0,
  paidCount: 0,
  pendingCount: 0,
  overdueCount: 0,
};

const mockSinglePaymentTotals = {
  totalAmount: 15000,
  paidAmount: 15000,
  pendingAmount: 0,
  overdueAmount: 0,
  totalCount: 1,
  paidCount: 1,
  pendingCount: 0,
  overdueCount: 0,
};

describe('PaymentStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== RENDERING TESTS ====================
  describe('Rendering', () => {
    it('renders all four stat cards', () => {
      render(<PaymentStats totals={mockTotals} />);

      expect(screen.getByText('Total Sesiones')).toBeInTheDocument();
      expect(screen.getByText('Cobrado')).toBeInTheDocument();
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
      expect(screen.getByText('Vencido')).toBeInTheDocument();
    });

    it('renders total amount correctly', () => {
      render(<PaymentStats totals={mockTotals} />);

      expect(screen.getByText('$100.000')).toBeInTheDocument();
    });

    it('renders paid amount correctly', () => {
      render(<PaymentStats totals={mockTotals} />);

      expect(screen.getByText('$60.000')).toBeInTheDocument();
    });

    it('renders pending amount correctly', () => {
      render(<PaymentStats totals={mockTotals} />);

      expect(screen.getByText('$25.000')).toBeInTheDocument();
    });

    it('renders overdue amount correctly', () => {
      render(<PaymentStats totals={mockTotals} />);

      expect(screen.getByText('$15.000')).toBeInTheDocument();
    });

    it('renders payment counts correctly', () => {
      render(<PaymentStats totals={mockTotals} />);

      expect(screen.getByText('10 pagos')).toBeInTheDocument();
      expect(screen.getByText('6 pagos')).toBeInTheDocument();
      expect(screen.getByText('3 pagos')).toBeInTheDocument();
      expect(screen.getByText('1 pago')).toBeInTheDocument();
    });

    it('renders icons for each stat card', () => {
      const { container } = render(<PaymentStats totals={mockTotals} />);

      const iconContainers = container.querySelectorAll('.rounded-full');
      expect(iconContainers).toHaveLength(4);

      iconContainers.forEach((container) => {
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });

  // ==================== LOADING STATE TESTS ====================
  describe('Loading State', () => {
    it('renders skeleton when isLoading is true', () => {
      const { container } = render(<PaymentStats totals={mockTotals} isLoading={true} />);

      // SkeletonStats renders skeleton items with animate-pulse
      const skeletonItems = container.querySelectorAll('.animate-pulse');
      expect(skeletonItems.length).toBeGreaterThan(0);
    });

    it('does not render stats when isLoading is true', () => {
      render(<PaymentStats totals={mockTotals} isLoading={true} />);

      expect(screen.queryByText('Total Sesiones')).not.toBeInTheDocument();
      expect(screen.queryByText('$100.000')).not.toBeInTheDocument();
    });

    it('renders skeleton when totals is null', () => {
      const { container } = render(<PaymentStats totals={null} />);

      const skeletonItems = container.querySelectorAll('.animate-pulse');
      expect(skeletonItems.length).toBeGreaterThan(0);
    });

    it('renders stats when isLoading is false and totals is provided', () => {
      render(<PaymentStats totals={mockTotals} isLoading={false} />);

      expect(screen.getByText('Total Sesiones')).toBeInTheDocument();
      expect(screen.getByText('$100.000')).toBeInTheDocument();
    });
  });

  // ==================== SINGULAR/PLURAL TESTS ====================
  describe('Singular/Plural Labels', () => {
    it('uses singular "pago" when count is 1', () => {
      render(<PaymentStats totals={mockSinglePaymentTotals} />);

      // Multiple cards may have "1 pago" (total and paid both have count 1)
      const singularLabels = screen.getAllByText('1 pago');
      expect(singularLabels.length).toBeGreaterThanOrEqual(1);
    });

    it('uses plural "pagos" when count is greater than 1', () => {
      render(<PaymentStats totals={mockTotals} />);

      expect(screen.getByText('10 pagos')).toBeInTheDocument();
      expect(screen.getByText('6 pagos')).toBeInTheDocument();
    });

    it('uses plural "pagos" when count is 0', () => {
      render(<PaymentStats totals={mockZeroTotals} />);

      const zeroPagos = screen.getAllByText('0 pagos');
      expect(zeroPagos).toHaveLength(4);
    });
  });

  // ==================== ZERO VALUES TESTS ====================
  describe('Zero Values', () => {
    it('renders zero amounts correctly', () => {
      render(<PaymentStats totals={mockZeroTotals} />);

      const zeroAmounts = screen.getAllByText('$0');
      expect(zeroAmounts).toHaveLength(4);
    });

    it('renders zero counts correctly', () => {
      render(<PaymentStats totals={mockZeroTotals} />);

      const zeroCounts = screen.getAllByText('0 pagos');
      expect(zeroCounts).toHaveLength(4);
    });
  });

  // ==================== COLOR STYLING TESTS ====================
  describe('Color Styling', () => {
    it('total card icon has green styling', () => {
      const { container } = render(<PaymentStats totals={mockTotals} />);

      const greenIcon = container.querySelector('.bg-green-50');
      expect(greenIcon).toBeInTheDocument();

      const svg = greenIcon?.querySelector('svg');
      expect(svg).toHaveClass('text-green-600');
    });

    it('paid card icon has blue styling', () => {
      const { container } = render(<PaymentStats totals={mockTotals} />);

      const blueIcon = container.querySelector('.bg-blue-50');
      expect(blueIcon).toBeInTheDocument();

      const svg = blueIcon?.querySelector('svg');
      expect(svg).toHaveClass('text-blue-600');
    });

    it('pending card icon has yellow styling', () => {
      const { container } = render(<PaymentStats totals={mockTotals} />);

      const yellowIcon = container.querySelector('.bg-yellow-50');
      expect(yellowIcon).toBeInTheDocument();

      const svg = yellowIcon?.querySelector('svg');
      expect(svg).toHaveClass('text-yellow-600');
    });

    it('overdue card icon has red styling', () => {
      const { container } = render(<PaymentStats totals={mockTotals} />);

      const redIcon = container.querySelector('.bg-red-50');
      expect(redIcon).toBeInTheDocument();

      const svg = redIcon?.querySelector('svg');
      expect(svg).toHaveClass('text-red-600');
    });
  });

  // ==================== GRID LAYOUT TESTS ====================
  describe('Grid Layout', () => {
    it('renders in a grid layout', () => {
      const { container } = render(<PaymentStats totals={mockTotals} />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-cols-2', 'lg:grid-cols-4');
    });

    it('has proper gap between cards', () => {
      const { container } = render(<PaymentStats totals={mockTotals} />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('gap-3', 'sm:gap-4');
    });
  });

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('handles very large amounts', () => {
      const largeAmounts = {
        ...mockTotals,
        totalAmount: 1000000000,
        paidAmount: 500000000,
      };

      render(<PaymentStats totals={largeAmounts} />);

      expect(screen.getByText('$1.000.000.000')).toBeInTheDocument();
      expect(screen.getByText('$500.000.000')).toBeInTheDocument();
    });

    it('handles decimal amounts', () => {
      const decimalAmounts = {
        ...mockTotals,
        totalAmount: 15000.5,
      };

      render(<PaymentStats totals={decimalAmounts} />);

      expect(screen.getByText('$15.000,5')).toBeInTheDocument();
    });

    it('handles very large counts', () => {
      const largeCounts = {
        ...mockTotals,
        totalCount: 9999,
      };

      render(<PaymentStats totals={largeCounts} />);

      expect(screen.getByText('9999 pagos')).toBeInTheDocument();
    });
  });

  // ==================== CARD STRUCTURE TESTS ====================
  describe('Card Structure', () => {
    it('each card is wrapped in a Card component', () => {
      const { container } = render(<PaymentStats totals={mockTotals} />);

      // Cards have bg-white class
      const cards = container.querySelectorAll('.bg-white');
      expect(cards.length).toBeGreaterThanOrEqual(4);
    });

    it('cards have proper padding', () => {
      const { container } = render(<PaymentStats totals={mockTotals} />);

      const cards = container.querySelectorAll('.p-3');
      expect(cards.length).toBeGreaterThanOrEqual(4);
    });

    it('amounts are displayed with bold font', () => {
      render(<PaymentStats totals={mockTotals} />);

      const amount = screen.getByText('$100.000');
      expect(amount).toHaveClass('font-bold');
    });

    it('labels are displayed with muted foreground', () => {
      render(<PaymentStats totals={mockTotals} />);

      const label = screen.getByText('Total Sesiones');
      expect(label).toHaveClass('text-muted-foreground');
    });
  });

  // ==================== RESPONSIVE DESIGN TESTS ====================
  describe('Responsive Design', () => {
    it('has responsive text sizes for amounts', () => {
      render(<PaymentStats totals={mockTotals} />);

      const amount = screen.getByText('$100.000');
      expect(amount).toHaveClass('text-lg', 'sm:text-xl', 'lg:text-2xl');
    });

    it('has responsive padding for cards', () => {
      const { container } = render(<PaymentStats totals={mockTotals} />);

      const cards = container.querySelectorAll('.p-3.sm\\:p-4.lg\\:p-6');
      expect(cards.length).toBe(4);
    });

    it('has responsive icon sizes', () => {
      const { container } = render(<PaymentStats totals={mockTotals} />);

      const icons = container.querySelectorAll('svg');
      icons.forEach((icon) => {
        expect(icon).toHaveClass('h-4', 'w-4', 'sm:h-5', 'sm:w-5', 'lg:h-6', 'lg:w-6');
      });
    });

    it('has responsive icon container padding', () => {
      const { container } = render(<PaymentStats totals={mockTotals} />);

      const iconContainers = container.querySelectorAll('.p-2.sm\\:p-3');
      expect(iconContainers.length).toBe(4);
    });
  });

  // ==================== SKELETON TESTS ====================
  describe('Skeleton Loading', () => {
    it('skeleton shows 4 cards by default', () => {
      const { container } = render(<PaymentStats totals={null} />);

      // SkeletonStats uses a grid with 4 items
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();

      const skeletonCards = grid?.querySelectorAll('.bg-white');
      expect(skeletonCards?.length).toBe(4);
    });

    it('skeleton has proper grid layout', () => {
      const { container } = render(<PaymentStats totals={null} isLoading={true} />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-2', 'md:grid-cols-4');
    });
  });

  // ==================== ALL STATS DISPLAY CORRECTLY ====================
  describe('All Stats Display', () => {
    it('displays all statistics in order', () => {
      render(<PaymentStats totals={mockTotals} />);

      const labels = ['Total Sesiones', 'Cobrado', 'Pendiente', 'Vencido'];

      labels.forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    it('each stat card displays label, amount, and count', () => {
      render(<PaymentStats totals={mockTotals} />);

      // Total
      expect(screen.getByText('Total Sesiones')).toBeInTheDocument();
      expect(screen.getByText('$100.000')).toBeInTheDocument();
      expect(screen.getByText('10 pagos')).toBeInTheDocument();

      // Cobrado
      expect(screen.getByText('Cobrado')).toBeInTheDocument();
      expect(screen.getByText('$60.000')).toBeInTheDocument();
      expect(screen.getByText('6 pagos')).toBeInTheDocument();

      // Pendiente
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
      expect(screen.getByText('$25.000')).toBeInTheDocument();
      expect(screen.getByText('3 pagos')).toBeInTheDocument();

      // Vencido
      expect(screen.getByText('Vencido')).toBeInTheDocument();
      expect(screen.getByText('$15.000')).toBeInTheDocument();
      expect(screen.getByText('1 pago')).toBeInTheDocument();
    });
  });
});
