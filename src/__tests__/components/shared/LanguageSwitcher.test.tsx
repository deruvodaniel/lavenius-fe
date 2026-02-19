import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSwitcher } from '../../../components/shared/LanguageSwitcher';

// Mock react-i18next
const mockChangeLanguage = vi.fn();
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
    i18n: {
      language: 'es',
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

// Mock the Select component from shadcn/ui
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: { children: React.ReactNode; onValueChange: (value: string) => void; value: string }) => (
    <div data-testid="select-mock" data-value={value}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children, ...props }: { children: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-value={value}>{children}</div>
  ),
  SelectValue: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Compact variant (default)', () => {
    it('renders with default variant (compact)', () => {
      render(<LanguageSwitcher />);

      // Should render the trigger button with flag
      const trigger = screen.getByRole('button', { name: /select language/i });
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('shows correct flag for current language (Spanish)', () => {
      render(<LanguageSwitcher />);

      // Spanish flag SVG should be visible (rendered as SVG)
      const trigger = screen.getByRole('button', { name: /select language/i });
      const flagSvg = trigger.querySelector('svg');
      expect(flagSvg).toBeInTheDocument();
      // Screen reader text for current language
      expect(screen.getByText('Español')).toBeInTheDocument();
    });

    it('opens dropdown on click', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const trigger = screen.getByRole('button', { name: /select language/i });
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      await user.click(trigger);

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      // Dropdown should now be visible with all language options
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getAllByRole('option')).toHaveLength(3);
    });

    it('shows all language options when dropdown is open', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button', { name: /select language/i }));

      // Check all languages are shown
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Português')).toBeInTheDocument();
      // Español appears twice (in trigger and dropdown)
      expect(screen.getAllByText('Español').length).toBeGreaterThanOrEqual(1);

      // All 3 language options should be visible
      const options = screen.getAllByRole('option');
      expect(options.length).toBe(3);
    });

    it('changes language when option is selected', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      // Open dropdown
      await user.click(screen.getByRole('button', { name: /select language/i }));

      // Click on English option
      const englishOption = screen.getByRole('option', { name: /english/i });
      await user.click(englishOption);

      expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    });

    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <div data-testid="outside">Outside element</div>
          <LanguageSwitcher />
        </div>
      );

      const trigger = screen.getByRole('button', { name: /select language/i });

      // Open dropdown
      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      // Click outside - use mouseDown as component listens for mousedown
      fireEvent.mouseDown(screen.getByTestId('outside'));

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('closes dropdown when language is selected', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const trigger = screen.getByRole('button', { name: /select language/i });

      // Open dropdown
      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      // Select a language
      await user.click(screen.getByRole('option', { name: /english/i }));

      // Dropdown should close
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('shows checkmark for currently selected language', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button', { name: /select language/i }));

      // Spanish option should be selected (aria-selected)
      const spanishOption = screen.getByRole('option', { name: /español/i });
      expect(spanishOption).toHaveAttribute('aria-selected', 'true');

      // Other options should not be selected
      const englishOption = screen.getByRole('option', { name: /english/i });
      expect(englishOption).toHaveAttribute('aria-selected', 'false');
    });

    it('shows label when showLabel prop is true', () => {
      render(<LanguageSwitcher showLabel />);

      expect(screen.getByText('Idioma')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<LanguageSwitcher className="custom-class" />);

      const container = screen.getByRole('button', { name: /select language/i }).parentElement;
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Buttons variant (legacy)', () => {
    it('renders the same as compact variant', () => {
      render(<LanguageSwitcher variant="buttons" />);

      // Buttons variant uses same implementation as compact
      const trigger = screen.getByRole('button', { name: /select language/i });
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('Dropdown variant', () => {
    it('renders with Select component for dropdown variant', () => {
      render(<LanguageSwitcher variant="dropdown" />);

      // Should use the shadcn Select component
      expect(screen.getByTestId('select-mock')).toBeInTheDocument();
    });

    it('shows label when showLabel prop is true for dropdown variant', () => {
      render(<LanguageSwitcher variant="dropdown" showLabel />);

      expect(screen.getByLabelText('Idioma')).toBeInTheDocument();
    });
  });

  describe('Alignment', () => {
    it('applies end alignment by default', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button', { name: /select language/i }));

      const dropdown = screen.getByRole('listbox');
      expect(dropdown).toHaveClass('right-0');
    });

    it('applies start alignment when specified', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher align="start" />);

      await user.click(screen.getByRole('button', { name: /select language/i }));

      const dropdown = screen.getByRole('listbox');
      expect(dropdown).toHaveClass('left-0');
    });

    it('applies center alignment when specified', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher align="center" />);

      await user.click(screen.getByRole('button', { name: /select language/i }));

      const dropdown = screen.getByRole('listbox');
      expect(dropdown).toHaveClass('left-1/2');
      expect(dropdown).toHaveClass('-translate-x-1/2');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes on trigger', () => {
      render(<LanguageSwitcher />);

      const trigger = screen.getByRole('button', { name: /select language/i });
      expect(trigger).toHaveAttribute('aria-label');
      expect(trigger).toHaveAttribute('aria-expanded');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('has proper ARIA attributes on dropdown', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button', { name: /select language/i }));

      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-label');
    });

    it('has proper ARIA attributes on options', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button', { name: /select language/i }));

      const options = screen.getAllByRole('option');
      options.forEach((option) => {
        expect(option).toHaveAttribute('aria-selected');
      });
    });

    it('contains screen reader only text for current language', () => {
      render(<LanguageSwitcher />);

      const srOnly = screen.getByText('Español');
      expect(srOnly).toHaveClass('sr-only');
    });
  });

  describe('Keyboard navigation', () => {
    it('can toggle dropdown with keyboard', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const trigger = screen.getByRole('button', { name: /select language/i });
      trigger.focus();

      // Press Enter to open
      await user.keyboard('{Enter}');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      // Press Enter again to close (by toggling)
      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  });
});
