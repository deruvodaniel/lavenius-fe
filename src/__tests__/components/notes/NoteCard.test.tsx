import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteCard } from '@/components/notes/NoteCard';
import type { Note } from '@/lib/types/api.types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'notes.card.editNote': 'Editar nota',
        'notes.card.deleteNote': 'Eliminar nota',
        'notes.card.edited': 'Editado',
        'notes.deleteConfirm.title': 'Eliminar nota',
        'notes.deleteConfirm.description': '¿Estás seguro de que deseas eliminar esta nota?',
        'common.delete': 'Eliminar',
        'common.cancel': 'Cancelar',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock date formatters
vi.mock('@/lib/utils/dateFormatters', () => ({
  formatDateTime: (date: string) => `${date.split('T')[0]} 10:00`,
  formatDate: (date: string) => date.split('T')[0],
}));

// Mock data
const mockNote: Note = {
  id: 'note-1',
  text: 'Esta es una nota de prueba con contenido importante.',
  noteDate: '2024-03-15',
  patientId: 'patient-1',
  createdAt: '2024-03-15T10:00:00Z',
  updatedAt: '2024-03-15T10:00:00Z',
};

const mockEditedNote: Note = {
  ...mockNote,
  id: 'note-2',
  createdAt: '2024-03-15T10:00:00Z',
  updatedAt: '2024-03-16T14:30:00Z',
};

describe('NoteCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== RENDERING TESTS ====================
  describe('Rendering', () => {
    it('renders note text correctly', () => {
      render(<NoteCard note={mockNote} />);

      expect(screen.getByText('Esta es una nota de prueba con contenido importante.')).toBeInTheDocument();
    });

    it('renders note date correctly', () => {
      render(<NoteCard note={mockNote} />);

      expect(screen.getByText('2024-03-15')).toBeInTheDocument();
    });

    it('renders edit button when onEdit is provided', () => {
      const onEdit = vi.fn();
      render(<NoteCard note={mockNote} onEdit={onEdit} />);

      expect(screen.getByRole('button', { name: 'Editar nota' })).toBeInTheDocument();
    });

    it('renders delete button when onDelete is provided', () => {
      const onDelete = vi.fn();
      render(<NoteCard note={mockNote} onDelete={onDelete} />);

      expect(screen.getByRole('button', { name: 'Eliminar nota' })).toBeInTheDocument();
    });

    it('renders both edit and delete buttons when both handlers provided', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      render(<NoteCard note={mockNote} onEdit={onEdit} onDelete={onDelete} />);

      expect(screen.getByRole('button', { name: 'Editar nota' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Eliminar nota' })).toBeInTheDocument();
    });

    it('does not render edit button when onEdit is not provided', () => {
      render(<NoteCard note={mockNote} />);

      expect(screen.queryByRole('button', { name: 'Editar nota' })).not.toBeInTheDocument();
    });

    it('does not render delete button when onDelete is not provided', () => {
      render(<NoteCard note={mockNote} />);

      expect(screen.queryByRole('button', { name: 'Eliminar nota' })).not.toBeInTheDocument();
    });

    it('shows edited timestamp when note was updated', () => {
      render(<NoteCard note={mockEditedNote} />);

      expect(screen.getByText(/Editado/)).toBeInTheDocument();
      expect(screen.getByText(/2024-03-16 10:00/)).toBeInTheDocument();
    });

    it('does not show edited timestamp when note was not updated', () => {
      render(<NoteCard note={mockNote} />);

      expect(screen.queryByText(/Editado/)).not.toBeInTheDocument();
    });

    it('renders within a Card component', () => {
      render(<NoteCard note={mockNote} />);

      // Check for the card's hover effect class
      const card = screen.getByText(mockNote.text).closest('.hover\\:shadow-md');
      expect(card).toBeInTheDocument();
    });
  });

  // ==================== READ-ONLY MODE TESTS ====================
  describe('Read-Only Mode', () => {
    it('hides action buttons when readOnly is true', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      render(<NoteCard note={mockNote} onEdit={onEdit} onDelete={onDelete} readOnly={true} />);

      expect(screen.queryByRole('button', { name: 'Editar nota' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Eliminar nota' })).not.toBeInTheDocument();
    });

    it('shows action buttons when readOnly is false', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      render(<NoteCard note={mockNote} onEdit={onEdit} onDelete={onDelete} readOnly={false} />);

      expect(screen.getByRole('button', { name: 'Editar nota' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Eliminar nota' })).toBeInTheDocument();
    });

    it('shows action buttons by default (readOnly defaults to false)', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      render(<NoteCard note={mockNote} onEdit={onEdit} onDelete={onDelete} />);

      expect(screen.getByRole('button', { name: 'Editar nota' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Eliminar nota' })).toBeInTheDocument();
    });

    it('still shows note content in read-only mode', () => {
      render(<NoteCard note={mockNote} readOnly={true} />);

      expect(screen.getByText(mockNote.text)).toBeInTheDocument();
      expect(screen.getByText('2024-03-15')).toBeInTheDocument();
    });
  });

  // ==================== EDIT INTERACTION TESTS ====================
  describe('Edit Interaction', () => {
    it('calls onEdit with note when edit button is clicked', async () => {
      const onEdit = vi.fn();
      const user = userEvent.setup();

      render(<NoteCard note={mockNote} onEdit={onEdit} />);

      await user.click(screen.getByRole('button', { name: 'Editar nota' }));

      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledWith(mockNote);
    });

    it('does not call onEdit when readOnly is true', async () => {
      const onEdit = vi.fn();
      const user = userEvent.setup();

      render(<NoteCard note={mockNote} onEdit={onEdit} readOnly={true} />);

      // Button should not be in the document
      expect(screen.queryByRole('button', { name: 'Editar nota' })).not.toBeInTheDocument();
      expect(onEdit).not.toHaveBeenCalled();
    });
  });

  // ==================== DELETE INTERACTION TESTS ====================
  describe('Delete Interaction', () => {
    it('opens confirm dialog when delete button is clicked', async () => {
      const onDelete = vi.fn();
      const user = userEvent.setup();

      render(<NoteCard note={mockNote} onDelete={onDelete} />);

      await user.click(screen.getByRole('button', { name: 'Eliminar nota' }));

      // Confirm dialog should appear
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText('Eliminar nota')).toBeInTheDocument();
      expect(screen.getByText('¿Estás seguro de que deseas eliminar esta nota?')).toBeInTheDocument();
    });

    it('calls onDelete with note id when deletion is confirmed', async () => {
      const onDelete = vi.fn();
      const user = userEvent.setup();

      render(<NoteCard note={mockNote} onDelete={onDelete} />);

      // Open confirm dialog
      await user.click(screen.getByRole('button', { name: 'Eliminar nota' }));

      // Confirm deletion
      await user.click(screen.getByRole('button', { name: 'Eliminar' }));

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith('note-1');
    });

    it('does not call onDelete when deletion is cancelled', async () => {
      const onDelete = vi.fn();
      const user = userEvent.setup();

      render(<NoteCard note={mockNote} onDelete={onDelete} />);

      // Open confirm dialog
      await user.click(screen.getByRole('button', { name: 'Eliminar nota' }));

      // Cancel deletion
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(onDelete).not.toHaveBeenCalled();
    });

    it('closes confirm dialog after confirmation', async () => {
      const onDelete = vi.fn();
      const user = userEvent.setup();

      render(<NoteCard note={mockNote} onDelete={onDelete} />);

      // Open confirm dialog
      await user.click(screen.getByRole('button', { name: 'Eliminar nota' }));
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      // Confirm deletion
      await user.click(screen.getByRole('button', { name: 'Eliminar' }));

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });

    it('closes confirm dialog after cancellation', async () => {
      const onDelete = vi.fn();
      const user = userEvent.setup();

      render(<NoteCard note={mockNote} onDelete={onDelete} />);

      // Open confirm dialog
      await user.click(screen.getByRole('button', { name: 'Eliminar nota' }));
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      // Cancel deletion
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });
  });

  // ==================== ACCESSIBILITY TESTS ====================
  describe('Accessibility', () => {
    it('edit button has accessible aria-label', () => {
      render(<NoteCard note={mockNote} onEdit={vi.fn()} />);

      const editButton = screen.getByRole('button', { name: 'Editar nota' });
      expect(editButton).toHaveAttribute('aria-label', 'Editar nota');
    });

    it('delete button has accessible aria-label', () => {
      render(<NoteCard note={mockNote} onDelete={vi.fn()} />);

      const deleteButton = screen.getByRole('button', { name: 'Eliminar nota' });
      expect(deleteButton).toHaveAttribute('aria-label', 'Eliminar nota');
    });

    it('buttons are focusable', () => {
      render(<NoteCard note={mockNote} onEdit={vi.fn()} onDelete={vi.fn()} />);

      const editButton = screen.getByRole('button', { name: 'Editar nota' });
      const deleteButton = screen.getByRole('button', { name: 'Eliminar nota' });

      editButton.focus();
      expect(editButton).toHaveFocus();

      deleteButton.focus();
      expect(deleteButton).toHaveFocus();
    });

    it('edit button is keyboard accessible', async () => {
      const onEdit = vi.fn();
      const user = userEvent.setup();

      render(<NoteCard note={mockNote} onEdit={onEdit} />);

      const editButton = screen.getByRole('button', { name: 'Editar nota' });
      editButton.focus();

      await user.keyboard('{Enter}');

      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('delete button is keyboard accessible', async () => {
      const onDelete = vi.fn();
      const user = userEvent.setup();

      render(<NoteCard note={mockNote} onDelete={onDelete} />);

      const deleteButton = screen.getByRole('button', { name: 'Eliminar nota' });
      deleteButton.focus();

      await user.keyboard('{Enter}');

      // Should open the confirm dialog
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('note text preserves whitespace formatting', () => {
      const noteWithWhitespace: Note = {
        ...mockNote,
        text: 'Línea 1\nLínea 2\nLínea 3',
      };

      render(<NoteCard note={noteWithWhitespace} />);

      const noteText = screen.getByText(/Línea 1/);
      expect(noteText).toHaveClass('whitespace-pre-wrap');
    });
  });

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('handles note with very long text', () => {
      const longNote: Note = {
        ...mockNote,
        text: 'A'.repeat(1000),
      };

      render(<NoteCard note={longNote} />);

      expect(screen.getByText('A'.repeat(1000))).toBeInTheDocument();
    });

    it('handles note with special characters', () => {
      const specialNote: Note = {
        ...mockNote,
        text: 'Nota con <html> & "caracteres" especiales',
      };

      render(<NoteCard note={specialNote} />);

      expect(screen.getByText('Nota con <html> & "caracteres" especiales')).toBeInTheDocument();
    });

    it('handles note with empty text', () => {
      const emptyNote: Note = {
        ...mockNote,
        text: '',
      };

      render(<NoteCard note={emptyNote} />);

      // Card should still render
      expect(screen.getByText('2024-03-15')).toBeInTheDocument();
    });

    it('handles note with multiline text', () => {
      const multilineNote: Note = {
        ...mockNote,
        text: 'Primera línea\nSegunda línea\nTercera línea',
      };

      render(<NoteCard note={multilineNote} />);

      const textElement = screen.getByText(/Primera línea/);
      expect(textElement).toHaveClass('whitespace-pre-wrap');
      expect(textElement).toHaveClass('break-words');
    });

    it('handles note with patient information', () => {
      const noteWithPatient: Note = {
        ...mockNote,
        patient: {
          id: 'patient-1',
          firstName: 'Juan',
          lastName: 'Pérez',
          active: true,
        },
      };

      render(<NoteCard note={noteWithPatient} />);

      // Should still render note content
      expect(screen.getByText(noteWithPatient.text)).toBeInTheDocument();
    });

    it('handles rapid clicks on edit button', async () => {
      const onEdit = vi.fn();
      const user = userEvent.setup();

      render(<NoteCard note={mockNote} onEdit={onEdit} />);

      const editButton = screen.getByRole('button', { name: 'Editar nota' });

      await user.click(editButton);
      await user.click(editButton);
      await user.click(editButton);

      expect(onEdit).toHaveBeenCalledTimes(3);
    });

    it('handles note where updatedAt equals createdAt (not edited)', () => {
      const unmodifiedNote: Note = {
        ...mockNote,
        createdAt: '2024-03-15T10:00:00Z',
        updatedAt: '2024-03-15T10:00:00Z',
      };

      render(<NoteCard note={unmodifiedNote} />);

      // Should not show "Editado" message
      expect(screen.queryByText(/Editado/)).not.toBeInTheDocument();
    });

    it('handles note without updatedAt', () => {
      const noteWithoutUpdatedAt: Note = {
        id: 'note-1',
        text: 'Nota sin updatedAt',
        noteDate: '2024-03-15',
        patientId: 'patient-1',
        createdAt: '2024-03-15T10:00:00Z',
      } as Note;

      render(<NoteCard note={noteWithoutUpdatedAt} />);

      // Should not show "Editado" message and should not crash
      expect(screen.queryByText(/Editado/)).not.toBeInTheDocument();
      expect(screen.getByText('Nota sin updatedAt')).toBeInTheDocument();
    });

    it('handles note without createdAt', () => {
      const noteWithoutCreatedAt: Note = {
        id: 'note-1',
        text: 'Nota sin createdAt',
        noteDate: '2024-03-15',
        patientId: 'patient-1',
        updatedAt: '2024-03-15T10:00:00Z',
      } as Note;

      render(<NoteCard note={noteWithoutCreatedAt} />);

      // Should not show "Editado" message and should not crash
      expect(screen.queryByText(/Editado/)).not.toBeInTheDocument();
      expect(screen.getByText('Nota sin createdAt')).toBeInTheDocument();
    });
  });

  // ==================== VISUAL STRUCTURE TESTS ====================
  describe('Visual Structure', () => {
    it('has proper card padding', () => {
      render(<NoteCard note={mockNote} />);

      const card = screen.getByText(mockNote.text).closest('.p-4');
      expect(card).toBeInTheDocument();
    });

    it('has hover shadow transition', () => {
      render(<NoteCard note={mockNote} />);

      const card = screen.getByText(mockNote.text).closest('.transition-shadow');
      expect(card).toBeInTheDocument();
    });

    it('delete button has destructive styling', () => {
      render(<NoteCard note={mockNote} onDelete={vi.fn()} />);

      const deleteButton = screen.getByRole('button', { name: 'Eliminar nota' });
      expect(deleteButton).toHaveClass('text-destructive');
    });
  });

  // ==================== CONFIRM DIALOG TESTS ====================
  describe('Confirm Dialog', () => {
    it('confirm dialog uses danger variant', async () => {
      const onDelete = vi.fn();
      const user = userEvent.setup();

      render(<NoteCard note={mockNote} onDelete={onDelete} />);

      await user.click(screen.getByRole('button', { name: 'Eliminar nota' }));

      // Check for danger variant button (red)
      const confirmButton = screen.getByRole('button', { name: 'Eliminar' });
      expect(confirmButton).toHaveClass('bg-red-600');
    });

    it('confirm dialog has correct title', async () => {
      const onDelete = vi.fn();
      const user = userEvent.setup();

      render(<NoteCard note={mockNote} onDelete={onDelete} />);

      await user.click(screen.getByRole('button', { name: 'Eliminar nota' }));

      expect(screen.getByText('Eliminar nota')).toBeInTheDocument();
    });

    it('confirm dialog has correct description', async () => {
      const onDelete = vi.fn();
      const user = userEvent.setup();

      render(<NoteCard note={mockNote} onDelete={onDelete} />);

      await user.click(screen.getByRole('button', { name: 'Eliminar nota' }));

      expect(screen.getByText('¿Estás seguro de que deseas eliminar esta nota?')).toBeInTheDocument();
    });
  });
});
