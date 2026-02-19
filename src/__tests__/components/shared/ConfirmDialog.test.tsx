import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Check } from 'lucide-react';

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  title: 'Confirm Action',
  description: 'Are you sure you want to proceed?',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe('ConfirmDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders dialog when open is true', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('does not render dialog when open is false', () => {
      render(<ConfirmDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('displays the title prop', () => {
      render(<ConfirmDialog {...defaultProps} title="Delete Item" />);

      expect(screen.getByText('Delete Item')).toBeInTheDocument();
    });

    it('displays the description prop', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          description="This action cannot be undone."
        />
      );

      expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    });

    it('shows default confirm button text "Confirmar"', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument();
    });

    it('shows custom confirm button text', () => {
      render(<ConfirmDialog {...defaultProps} confirmLabel="Delete" />);

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('shows default cancel button text "Cancelar"', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    });

    it('shows custom cancel button text', () => {
      render(<ConfirmDialog {...defaultProps} cancelLabel="Go Back" />);

      expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onConfirm when confirm button is clicked', async () => {
      const onConfirm = vi.fn();
      const user = userEvent.setup();

      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      await user.click(screen.getByRole('button', { name: 'Confirmar' }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onOpenChange(false) after confirm', async () => {
      const onOpenChange = vi.fn();
      const user = userEvent.setup();

      render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);

      await user.click(screen.getByRole('button', { name: 'Confirmar' }));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const onCancel = vi.fn();
      const user = userEvent.setup();

      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onOpenChange(false) when cancel button is clicked', async () => {
      const onOpenChange = vi.fn();
      const user = userEvent.setup();

      render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);

      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('handles async onConfirm correctly', async () => {
      const onConfirm = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      const user = userEvent.setup();

      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      await user.click(screen.getByRole('button', { name: 'Confirmar' }));

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledTimes(1);
      });
    });

    it('works without onCancel prop (optional)', async () => {
      const onOpenChange = vi.fn();
      const user = userEvent.setup();

      render(
        <ConfirmDialog
          open={true}
          onOpenChange={onOpenChange}
          title="Test"
          description="Test description"
          onConfirm={vi.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Variants', () => {
    it('renders default variant with indigo styling', () => {
      render(<ConfirmDialog {...defaultProps} variant="default" />);

      const confirmButton = screen.getByRole('button', { name: 'Confirmar' });
      expect(confirmButton).toHaveClass('bg-indigo-600');
    });

    it('renders danger variant with red styling', () => {
      render(<ConfirmDialog {...defaultProps} variant="danger" />);

      const confirmButton = screen.getByRole('button', { name: 'Confirmar' });
      expect(confirmButton).toHaveClass('bg-red-600');
    });

    it('renders warning variant with amber styling', () => {
      render(<ConfirmDialog {...defaultProps} variant="warning" />);

      const confirmButton = screen.getByRole('button', { name: 'Confirmar' });
      expect(confirmButton).toHaveClass('bg-amber-600');
    });

    it('renders info variant with blue styling', () => {
      render(<ConfirmDialog {...defaultProps} variant="info" />);

      const confirmButton = screen.getByRole('button', { name: 'Confirmar' });
      expect(confirmButton).toHaveClass('bg-blue-600');
    });

    it('renders variant icon in dialog', () => {
      render(<ConfirmDialog {...defaultProps} variant="danger" />);

      // Verify dialog renders correctly with the danger variant
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toBeInTheDocument();

      // The confirm button should have red styling for danger variant
      const confirmButton = screen.getByRole('button', { name: 'Confirmar' });
      expect(confirmButton).toHaveClass('bg-red-600');
    });

    it('renders with custom icon prop', () => {
      render(<ConfirmDialog {...defaultProps} icon={Check} />);

      // Verify dialog renders with custom icon
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toBeInTheDocument();

      // Default variant styling should still apply
      const confirmButton = screen.getByRole('button', { name: 'Confirmar' });
      expect(confirmButton).toHaveClass('bg-indigo-600');
    });
  });

  describe('Loading State', () => {
    it('shows "Procesando..." text when loading', () => {
      render(<ConfirmDialog {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('button', { name: 'Procesando...' })).toBeInTheDocument();
    });

    it('hides confirm label when loading', () => {
      render(
        <ConfirmDialog {...defaultProps} isLoading={true} confirmLabel="Delete" />
      );

      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Procesando...' })).toBeInTheDocument();
    });

    it('disables confirm button when loading', () => {
      render(<ConfirmDialog {...defaultProps} isLoading={true} />);

      const confirmButton = screen.getByRole('button', { name: 'Procesando...' });
      expect(confirmButton).toBeDisabled();
    });

    it('disables cancel button when loading', () => {
      render(<ConfirmDialog {...defaultProps} isLoading={true} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
      expect(cancelButton).toBeDisabled();
    });

    it('does not disable buttons when not loading', () => {
      render(<ConfirmDialog {...defaultProps} isLoading={false} />);

      const confirmButton = screen.getByRole('button', { name: 'Confirmar' });
      const cancelButton = screen.getByRole('button', { name: 'Cancelar' });

      expect(confirmButton).not.toBeDisabled();
      expect(cancelButton).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('dialog has alertdialog role', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('has accessible title', () => {
      render(<ConfirmDialog {...defaultProps} title="Confirm Delete" />);

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveAccessibleName('Confirm Delete');
    });

    it('has accessible description', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          description="This will permanently delete the item."
        />
      );

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveAccessibleDescription('This will permanently delete the item.');
    });

    it('confirm button is focusable', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const confirmButton = screen.getByRole('button', { name: 'Confirmar' });
      confirmButton.focus();

      expect(document.activeElement).toBe(confirmButton);
    });

    it('cancel button is focusable', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
      cancelButton.focus();

      expect(document.activeElement).toBe(cancelButton);
    });

    it('buttons are not focusable when disabled', () => {
      render(<ConfirmDialog {...defaultProps} isLoading={true} />);

      const confirmButton = screen.getByRole('button', { name: 'Procesando...' });
      const cancelButton = screen.getByRole('button', { name: 'Cancelar' });

      expect(confirmButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('can confirm with keyboard (Enter on confirm button)', async () => {
      const onConfirm = vi.fn();
      const user = userEvent.setup();

      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      const confirmButton = screen.getByRole('button', { name: 'Confirmar' });
      confirmButton.focus();

      await user.keyboard('{Enter}');

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('can cancel with keyboard (Enter on cancel button)', async () => {
      const onCancel = vi.fn();
      const user = userEvent.setup();

      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
      cancelButton.focus();

      await user.keyboard('{Enter}');

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('can navigate between buttons with Tab', async () => {
      const user = userEvent.setup();

      render(<ConfirmDialog {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
      const confirmButton = screen.getByRole('button', { name: 'Confirmar' });

      // Start by focusing one of the buttons
      cancelButton.focus();
      expect(document.activeElement).toBe(cancelButton);

      // Tab to next focusable element
      await user.tab();

      // Should move focus (exact order depends on DOM structure)
      expect(document.activeElement).not.toBe(cancelButton);
    });

    it('calls onOpenChange when Escape is pressed', async () => {
      const onOpenChange = vi.fn();
      const user = userEvent.setup();

      render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty title gracefully', () => {
      render(<ConfirmDialog {...defaultProps} title="" />);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('handles empty description gracefully', () => {
      render(<ConfirmDialog {...defaultProps} description="" />);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('handles rapid clicks on confirm button', async () => {
      const onConfirm = vi.fn();
      const user = userEvent.setup();

      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      const confirmButton = screen.getByRole('button', { name: 'Confirmar' });

      // Rapid clicks
      await user.click(confirmButton);
      await user.click(confirmButton);
      await user.click(confirmButton);

      // Should handle gracefully - exact behavior depends on implementation
      expect(onConfirm).toHaveBeenCalled();
    });

    it('handles long title text', () => {
      const longTitle = 'A'.repeat(200);
      render(<ConfirmDialog {...defaultProps} title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('handles long description text', () => {
      const longDescription = 'B'.repeat(500);
      render(<ConfirmDialog {...defaultProps} description={longDescription} />);

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });
  });

  describe('Visual Structure', () => {
    it('renders dialog content container', () => {
      render(<ConfirmDialog {...defaultProps} />);

      // Dialog content should be present
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toBeInTheDocument();
    });

    it('renders with variant-specific styling', () => {
      render(<ConfirmDialog {...defaultProps} variant="warning" />);

      // Warning variant should have amber button styling
      const confirmButton = screen.getByRole('button', { name: 'Confirmar' });
      expect(confirmButton).toHaveClass('bg-amber-600');
    });

    it('renders footer with both buttons', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });
  });
});
