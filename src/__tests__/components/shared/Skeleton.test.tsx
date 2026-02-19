import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  SkeletonCalendar,
  SkeletonStats,
  SkeletonNotes,
  SkeletonSessionCard,
  LoadingOverlay,
  Spinner,
} from '../../../components/shared/Skeleton';

describe('Skeleton', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.firstChild;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('bg-gray-200');
      expect(skeleton).toHaveClass('rounded');
    });

    it('applies custom className', () => {
      const { container } = render(<Skeleton className="my-custom-class" />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('my-custom-class');
    });
  });

  describe('Variants', () => {
    it('renders text variant with default height', () => {
      const { container } = render(<Skeleton variant="text" />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('h-4');
    });

    it('renders circular variant with rounded-full class', () => {
      const { container } = render(<Skeleton variant="circular" />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('rounded-full');
    });

    it('renders rectangular variant with rounded-lg class', () => {
      const { container } = render(<Skeleton variant="rectangular" />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('rounded-lg');
    });
  });

  describe('Dimensions', () => {
    it('applies width prop as inline style', () => {
      const { container } = render(<Skeleton width={200} />);

      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.width).toBe('200px');
    });

    it('applies height prop as inline style', () => {
      const { container } = render(<Skeleton height={100} />);

      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.height).toBe('100px');
    });

    it('applies string width', () => {
      const { container } = render(<Skeleton width="50%" />);

      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.width).toBe('50%');
    });

    it('applies both width and height', () => {
      const { container } = render(<Skeleton width={100} height={50} />);

      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.width).toBe('100px');
      expect(skeleton.style.height).toBe('50px');
    });
  });

  describe('Animations', () => {
    it('applies pulse animation by default', () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('applies wave animation when specified', () => {
      const { container } = render(<Skeleton animation="wave" />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('animate-shimmer');
      expect(skeleton).toHaveClass('bg-gradient-to-r');
    });
  });
});

describe('SkeletonCard', () => {
  it('renders the card skeleton structure', () => {
    const { container } = render(<SkeletonCard />);

    const card = container.firstChild;
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('rounded-lg');
    expect(card).toHaveClass('shadow-sm');
    expect(card).toHaveClass('p-6');
    expect(card).toHaveClass('border');
  });

  it('contains circular avatar skeleton', () => {
    const { container } = render(<SkeletonCard />);

    const circularElements = container.querySelectorAll('.rounded-full');
    expect(circularElements.length).toBeGreaterThan(0);
  });

  it('contains rectangular button skeletons', () => {
    const { container } = render(<SkeletonCard />);

    const rectangularElements = container.querySelectorAll('.rounded-lg');
    expect(rectangularElements.length).toBeGreaterThan(0);
  });
});

describe('SkeletonTable', () => {
  it('renders default 5 rows', () => {
    const { container } = render(<SkeletonTable />);

    // Each row contains skeleton elements
    const rows = container.querySelectorAll('.divide-y > div');
    expect(rows.length).toBe(5);
  });

  it('renders custom number of rows', () => {
    const { container } = render(<SkeletonTable rows={3} />);

    const rows = container.querySelectorAll('.divide-y > div');
    expect(rows.length).toBe(3);
  });

  it('renders header section', () => {
    const { container } = render(<SkeletonTable />);

    const header = container.querySelector('.border-b');
    expect(header).toBeInTheDocument();
  });

  it('has proper table container styling', () => {
    const { container } = render(<SkeletonTable />);

    const tableContainer = container.firstChild;
    expect(tableContainer).toHaveClass('bg-white');
    expect(tableContainer).toHaveClass('rounded-lg');
    expect(tableContainer).toHaveClass('shadow-sm');
    expect(tableContainer).toHaveClass('overflow-hidden');
  });
});

describe('SkeletonList', () => {
  it('renders default 3 items', () => {
    const { container } = render(<SkeletonList />);

    const items = container.querySelectorAll('.bg-white');
    expect(items.length).toBe(3);
  });

  it('renders custom number of items', () => {
    const { container } = render(<SkeletonList items={5} />);

    const items = container.querySelectorAll('.bg-white');
    expect(items.length).toBe(5);
  });

  it('each item has avatar and content skeletons', () => {
    const { container } = render(<SkeletonList />);

    // Each list item should have a circular avatar
    const avatars = container.querySelectorAll('.rounded-full');
    expect(avatars.length).toBeGreaterThanOrEqual(3);
  });

  it('has proper spacing between items', () => {
    const { container } = render(<SkeletonList />);

    const listContainer = container.firstChild;
    expect(listContainer).toHaveClass('space-y-4');
  });
});

describe('SkeletonCalendar', () => {
  it('renders calendar header', () => {
    const { container } = render(<SkeletonCalendar />);

    // Header should have month/year skeleton and navigation buttons
    const header = container.querySelector('.flex.items-center.justify-between');
    expect(header).toBeInTheDocument();
  });

  it('renders week days header (7 columns)', () => {
    const { container } = render(<SkeletonCalendar />);

    const weekDaysGrid = container.querySelectorAll('.grid-cols-7')[0];
    expect(weekDaysGrid).toBeInTheDocument();
    expect(weekDaysGrid?.children.length).toBe(7);
  });

  it('renders calendar grid (35 cells for 5 weeks)', () => {
    const { container } = render(<SkeletonCalendar />);

    const calendarGrid = container.querySelectorAll('.grid-cols-7')[1];
    expect(calendarGrid?.children.length).toBe(35);
  });

  it('has proper container styling', () => {
    const { container } = render(<SkeletonCalendar />);

    const calendarContainer = container.firstChild;
    expect(calendarContainer).toHaveClass('bg-white');
    expect(calendarContainer).toHaveClass('rounded-lg');
    expect(calendarContainer).toHaveClass('shadow-sm');
    expect(calendarContainer).toHaveClass('p-4');
    expect(calendarContainer).toHaveClass('border');
  });
});

describe('SkeletonStats', () => {
  it('renders default 4 cards', () => {
    const { container } = render(<SkeletonStats />);

    const cards = container.querySelectorAll('.bg-white');
    expect(cards.length).toBe(4);
  });

  it('renders custom number of cards', () => {
    const { container } = render(<SkeletonStats cards={6} />);

    const cards = container.querySelectorAll('.bg-white');
    expect(cards.length).toBe(6);
  });

  it('each card has icon and value skeletons', () => {
    const { container } = render(<SkeletonStats />);

    // Each stat card should have a circular icon
    const icons = container.querySelectorAll('.rounded-full');
    expect(icons.length).toBeGreaterThanOrEqual(4);
  });

  it('has responsive grid layout', () => {
    const { container } = render(<SkeletonStats />);

    const grid = container.firstChild;
    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('grid-cols-2');
    expect(grid).toHaveClass('md:grid-cols-4');
  });
});

describe('SkeletonNotes', () => {
  it('renders default 3 notes', () => {
    const { container } = render(<SkeletonNotes />);

    const notes = container.querySelectorAll('.bg-white');
    expect(notes.length).toBe(3);
  });

  it('renders custom number of notes', () => {
    const { container } = render(<SkeletonNotes items={5} />);

    const notes = container.querySelectorAll('.bg-white');
    expect(notes.length).toBe(5);
  });

  it('each note has title, date, and content skeletons', () => {
    const { container } = render(<SkeletonNotes />);

    // Each note should have multiple skeleton lines
    const skeletonLines = container.querySelectorAll('.bg-gray-200');
    expect(skeletonLines.length).toBeGreaterThan(9); // At least 3 per note
  });

  it('has proper spacing', () => {
    const { container } = render(<SkeletonNotes />);

    const notesContainer = container.firstChild;
    expect(notesContainer).toHaveClass('space-y-3');
  });
});

describe('SkeletonSessionCard', () => {
  it('renders the session card structure', () => {
    const { container } = render(<SkeletonSessionCard />);

    const card = container.firstChild;
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('rounded-lg');
    expect(card).toHaveClass('p-4');
    expect(card).toHaveClass('border');
  });

  it('contains avatar skeleton', () => {
    const { container } = render(<SkeletonSessionCard />);

    const avatar = container.querySelector('.rounded-full');
    expect(avatar).toBeInTheDocument();
  });

  it('contains badge skeletons', () => {
    const { container } = render(<SkeletonSessionCard />);

    // Session card has badge-like elements with rounded-full
    const badges = container.querySelectorAll('.rounded-full');
    expect(badges.length).toBeGreaterThan(1);
  });
});

describe('LoadingOverlay', () => {
  it('renders with default message', () => {
    render(<LoadingOverlay />);

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<LoadingOverlay message="Guardando datos..." />);

    expect(screen.getByText('Guardando datos...')).toBeInTheDocument();
  });

  it('has proper overlay styling', () => {
    const { container } = render(<LoadingOverlay />);

    const overlay = container.firstChild;
    expect(overlay).toHaveClass('absolute');
    expect(overlay).toHaveClass('inset-0');
    expect(overlay).toHaveClass('bg-white/80');
    expect(overlay).toHaveClass('backdrop-blur-sm');
    expect(overlay).toHaveClass('z-50');
  });

  it('centers content', () => {
    const { container } = render(<LoadingOverlay />);

    const overlay = container.firstChild;
    expect(overlay).toHaveClass('flex');
    expect(overlay).toHaveClass('items-center');
    expect(overlay).toHaveClass('justify-center');
  });

  it('contains spinner', () => {
    const { container } = render(<LoadingOverlay />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});

describe('Spinner', () => {
  describe('Rendering', () => {
    it('renders with default size', () => {
      const { container } = render(<Spinner />);

      const spinner = container.firstChild;
      expect(spinner).toHaveClass('w-6');
      expect(spinner).toHaveClass('h-6');
    });

    it('applies custom className', () => {
      const { container } = render(<Spinner className="text-red-500" />);

      const spinner = container.firstChild;
      expect(spinner).toHaveClass('text-red-500');
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      const { container } = render(<Spinner size="sm" />);

      const spinner = container.firstChild;
      expect(spinner).toHaveClass('w-4');
      expect(spinner).toHaveClass('h-4');
      expect(spinner).toHaveClass('border-2');
    });

    it('renders medium size', () => {
      const { container } = render(<Spinner size="md" />);

      const spinner = container.firstChild;
      expect(spinner).toHaveClass('w-6');
      expect(spinner).toHaveClass('h-6');
      expect(spinner).toHaveClass('border-2');
    });

    it('renders large size', () => {
      const { container } = render(<Spinner size="lg" />);

      const spinner = container.firstChild;
      expect(spinner).toHaveClass('w-8');
      expect(spinner).toHaveClass('h-8');
      expect(spinner).toHaveClass('border-3');
    });
  });

  describe('Animation', () => {
    it('has spin animation', () => {
      const { container } = render(<Spinner />);

      const spinner = container.firstChild;
      expect(spinner).toHaveClass('animate-spin');
    });

    it('has border styling for spinner effect', () => {
      const { container } = render(<Spinner />);

      const spinner = container.firstChild;
      expect(spinner).toHaveClass('border-current');
      expect(spinner).toHaveClass('border-t-transparent');
      expect(spinner).toHaveClass('rounded-full');
    });
  });

  describe('Accessibility', () => {
    it('has status role', () => {
      render(<Spinner />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-label for screen readers', () => {
      render(<Spinner />);

      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Cargando');
    });
  });
});
