import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteList } from '@/components/notes/NoteList';
import type { Note } from '@/lib/types/api.types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'notes.emptyState.title': 'No hay notas',
        'notes.emptyState.description': 'Comienza creando tu primera nota clínica.',
        'notes.emptyState.createFirst': 'Crear primera nota',
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
const mockNotes: Note[] = [
  {
    id: 'note-1',
    text: 'Primera nota clínica con información importante del paciente.',
    noteDate: '2024-03-15',
    patientId: 'patient-1',
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z',
  },
  {
    id: 'note-2',
    text: 'Segunda nota con detalles del progreso terapéutico.',
    noteDate: '2024-03-16',
    patientId: 'patient-1',
    createdAt: '2024-03-16T11:00:00Z',
    updatedAt: '2024-03-17T14:30:00Z', // Edited
  },
  {
    id: 'note-3',
    text: 'Tercera nota sobre el plan de tratamiento.',
    noteDate: '2024-03-17',
    patientId: 'patient-1',
    createdAt: '2024-03-17T09:00:00Z',
    updatedAt: '2024-03-17T09:00:00Z',
  },
];

describe('NoteList', () => {
  const defaultProps = {
    notes: mockNotes,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onCreateNew: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== RENDERING TESTS ====================
  describe('Rendering', () => {
    it('renders note cards for each note', () => {
      render(<NoteList {...defaultProps} />);

      expect(screen.getByText(/Primera nota clínica/)).toBeInTheDocument();
      expect(screen.getByText(/Segunda nota con detalles/)).toBeInTheDocument();
      expect(screen.getByText(/Tercera nota sobre/)).toBeInTheDocument();
    });

    it('renders correct number of note cards', () => {
      render(<NoteList {...defaultProps} />);

      const noteCards = screen.getAllByText(/nota/i);
      expect(noteCards.length).toBeGreaterThanOrEqual(3);
    });

    it('renders notes with correct dates', () => {
      render(<NoteList {...defaultProps} />);

      expect(screen.getByText('2024-03-15')).toBeInTheDocument();
      expect(screen.getByText('2024-03-16')).toBeInTheDocument();
      expect(screen.getByText('2024-03-17')).toBeInTheDocument();
    });

    it('renders edit buttons when onEdit is provided', () => {
      render(<NoteList {...defaultProps} />);

      const editButtons = screen.getAllByRole('button', { name: 'Editar nota' });
      expect(editButtons).toHaveLength(3);
    });

    it('renders delete buttons when onDelete is provided', () => {
      render(<NoteList {...defaultProps} />);

      const deleteButtons = screen.getAllByRole('button', { name: 'Eliminar nota' });
      expect(deleteButtons).toHaveLength(3);
    });

    it('renders notes with proper spacing', () => {
      const { container } = render(<NoteList {...defaultProps} />);

      const listContainer = container.querySelector('.space-y-3');
      expect(listContainer).toBeInTheDocument();
    });

    it('shows edited indicator for edited notes', () => {
      render(<NoteList {...defaultProps} />);

      // Second note was edited (updatedAt differs from createdAt)
      const editedIndicators = screen.getAllByText(/Editado/);
      expect(editedIndicators).toHaveLength(1);
    });
  });

  // ==================== LOADING STATE TESTS ====================
  describe('Loading State', () => {
    it('renders skeleton when isLoading is true', () => {
      const { container } = render(<NoteList {...defaultProps} isLoading={true} />);

      // SkeletonNotes renders multiple skeleton items
      const skeletonItems = container.querySelectorAll('.animate-pulse');
      expect(skeletonItems.length).toBeGreaterThan(0);
    });

    it('does not render notes when isLoading is true', () => {
      render(<NoteList {...defaultProps} isLoading={true} />);

      expect(screen.queryByText(/Primera nota clínica/)).not.toBeInTheDocument();
    });

    it('renders notes when isLoading is false', () => {
      render(<NoteList {...defaultProps} isLoading={false} />);

      expect(screen.getByText(/Primera nota clínica/)).toBeInTheDocument();
    });

    it('defaults to isLoading=false', () => {
      render(<NoteList notes={mockNotes} />);

      expect(screen.getByText(/Primera nota clínica/)).toBeInTheDocument();
    });
  });

  // ==================== EMPTY STATE TESTS ====================
  describe('Empty State', () => {
    it('renders empty state when no notes', () => {
      render(<NoteList {...defaultProps} notes={[]} />);

      expect(screen.getByText('No hay notas')).toBeInTheDocument();
      expect(screen.getByText('Comienza creando tu primera nota clínica.')).toBeInTheDocument();
    });

    it('renders custom empty message when provided', () => {
      render(<NoteList {...defaultProps} notes={[]} emptyMessage="Sin notas para este paciente" />);

      expect(screen.getByText('Sin notas para este paciente')).toBeInTheDocument();
    });

    it('renders action button in empty state when onCreateNew is provided', () => {
      render(<NoteList {...defaultProps} notes={[]} />);

      expect(screen.getByRole('button', { name: 'Crear primera nota' })).toBeInTheDocument();
    });

    it('does not render action button when onCreateNew is not provided', () => {
      render(<NoteList {...defaultProps} notes={[]} onCreateNew={undefined} />);

      expect(screen.queryByRole('button', { name: 'Crear primera nota' })).not.toBeInTheDocument();
    });

    it('calls onCreateNew when action button is clicked', async () => {
      const user = userEvent.setup();
      const onCreateNew = vi.fn();

      render(<NoteList {...defaultProps} notes={[]} onCreateNew={onCreateNew} />);

      await user.click(screen.getByRole('button', { name: 'Crear primera nota' }));

      expect(onCreateNew).toHaveBeenCalledTimes(1);
    });

    it('renders with subtle variant', () => {
      render(<NoteList {...defaultProps} notes={[]} />);

      // Subtle variant has smaller padding (py-12)
      const container = screen.getByRole('heading', { level: 3 }).closest('div');
      expect(container).toHaveClass('py-12');
    });

    it('shows file text icon in empty state', () => {
      render(<NoteList {...defaultProps} notes={[]} />);

      const iconContainer = document.querySelector('.rounded-full');
      expect(iconContainer).toBeInTheDocument();

      const svgIcon = iconContainer?.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
    });
  });

  // ==================== INTERACTION TESTS ====================
  describe('Interactions', () => {
    it('calls onEdit with note when edit button is clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();

      render(<NoteList {...defaultProps} onEdit={onEdit} />);

      const editButtons = screen.getAllByRole('button', { name: 'Editar nota' });
      await user.click(editButtons[0]);

      expect(onEdit).toHaveBeenCalledWith(mockNotes[0]);
    });

    it('calls onDelete with note id when delete is confirmed', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      render(<NoteList {...defaultProps} onDelete={onDelete} />);

      const deleteButtons = screen.getAllByRole('button', { name: 'Eliminar nota' });
      await user.click(deleteButtons[0]);

      // Confirm deletion in dialog
      await user.click(screen.getByRole('button', { name: 'Eliminar' }));

      expect(onDelete).toHaveBeenCalledWith('note-1');
    });

    it('does not call onDelete when delete is cancelled', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      render(<NoteList {...defaultProps} onDelete={onDelete} />);

      const deleteButtons = screen.getAllByRole('button', { name: 'Eliminar nota' });
      await user.click(deleteButtons[0]);

      // Cancel deletion in dialog
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(onDelete).not.toHaveBeenCalled();
    });
  });

  // ==================== READ-ONLY MODE TESTS ====================
  describe('Read-Only Mode', () => {
    it('hides action buttons when readOnly is true', () => {
      render(<NoteList {...defaultProps} readOnly={true} />);

      expect(screen.queryByRole('button', { name: 'Editar nota' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Eliminar nota' })).not.toBeInTheDocument();
    });

    it('shows action buttons when readOnly is false', () => {
      render(<NoteList {...defaultProps} readOnly={false} />);

      expect(screen.getAllByRole('button', { name: 'Editar nota' })).toHaveLength(3);
      expect(screen.getAllByRole('button', { name: 'Eliminar nota' })).toHaveLength(3);
    });

    it('defaults to readOnly=false', () => {
      render(<NoteList {...defaultProps} />);

      expect(screen.getAllByRole('button', { name: 'Editar nota' })).toHaveLength(3);
    });

    it('still shows note content in read-only mode', () => {
      render(<NoteList {...defaultProps} readOnly={true} />);

      expect(screen.getByText(/Primera nota clínica/)).toBeInTheDocument();
      expect(screen.getByText(/Segunda nota con detalles/)).toBeInTheDocument();
    });
  });

  // ==================== SINGLE NOTE TESTS ====================
  describe('Single Note', () => {
    it('renders correctly with a single note', () => {
      render(<NoteList {...defaultProps} notes={[mockNotes[0]]} />);

      expect(screen.getByText(/Primera nota clínica/)).toBeInTheDocument();
      expect(screen.getByText('2024-03-15')).toBeInTheDocument();
    });
  });

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('handles note with very long text', () => {
      const longNote: Note = {
        ...mockNotes[0],
        id: 'note-long',
        text: 'A'.repeat(1000),
      };

      render(<NoteList {...defaultProps} notes={[longNote]} />);

      expect(screen.getByText('A'.repeat(1000))).toBeInTheDocument();
    });

    it('handles note with special characters', () => {
      const specialNote: Note = {
        ...mockNotes[0],
        id: 'note-special',
        text: 'Nota con <html> & "caracteres" especiales',
      };

      render(<NoteList {...defaultProps} notes={[specialNote]} />);

      expect(screen.getByText('Nota con <html> & "caracteres" especiales')).toBeInTheDocument();
    });

    it('handles note with empty text', () => {
      const emptyNote: Note = {
        ...mockNotes[0],
        id: 'note-empty',
        text: '',
      };

      render(<NoteList {...defaultProps} notes={[emptyNote]} />);

      // Note card should still render with date
      expect(screen.getByText('2024-03-15')).toBeInTheDocument();
    });

    it('handles note with multiline text', () => {
      const multilineNote: Note = {
        ...mockNotes[0],
        id: 'note-multiline',
        text: 'Línea 1\nLínea 2\nLínea 3',
      };

      render(<NoteList {...defaultProps} notes={[multilineNote]} />);

      const noteText = screen.getByText(/Línea 1/);
      expect(noteText).toHaveClass('whitespace-pre-wrap');
    });

    it('handles very large number of notes', () => {
      const manyNotes = Array.from({ length: 50 }, (_, i) => ({
        ...mockNotes[0],
        id: `note-${i}`,
        text: `Note number ${i}`,
      }));

      render(<NoteList {...defaultProps} notes={manyNotes} />);

      expect(screen.getByText('Note number 0')).toBeInTheDocument();
      expect(screen.getByText('Note number 49')).toBeInTheDocument();
    });

    it('handles notes with patient information', () => {
      const noteWithPatient: Note = {
        ...mockNotes[0],
        patient: {
          id: 'patient-1',
          firstName: 'Juan',
          lastName: 'Pérez',
          active: true,
        },
      };

      render(<NoteList {...defaultProps} notes={[noteWithPatient]} />);

      expect(screen.getByText(/Primera nota clínica/)).toBeInTheDocument();
    });
  });

  // ==================== ORDER PRESERVATION ====================
  describe('Order Preservation', () => {
    it('preserves the order of notes as provided', () => {
      render(<NoteList {...defaultProps} />);

      const noteTexts = screen.getAllByText(/nota/i);

      // Check that first note appears before second
      const firstNoteIndex = noteTexts.findIndex((el) => el.textContent?.includes('Primera'));
      const secondNoteIndex = noteTexts.findIndex((el) => el.textContent?.includes('Segunda'));

      expect(firstNoteIndex).toBeLessThan(secondNoteIndex);
    });
  });

  // ==================== ACCESSIBILITY ====================
  describe('Accessibility', () => {
    it('edit buttons have accessible aria-labels', () => {
      render(<NoteList {...defaultProps} />);

      const editButtons = screen.getAllByRole('button', { name: 'Editar nota' });
      editButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label', 'Editar nota');
      });
    });

    it('delete buttons have accessible aria-labels', () => {
      render(<NoteList {...defaultProps} />);

      const deleteButtons = screen.getAllByRole('button', { name: 'Eliminar nota' });
      deleteButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label', 'Eliminar nota');
      });
    });

    it('buttons are focusable', () => {
      render(<NoteList {...defaultProps} />);

      const editButtons = screen.getAllByRole('button', { name: 'Editar nota' });
      editButtons.forEach((button) => {
        button.focus();
        expect(button).toHaveFocus();
      });
    });

    it('empty state action button is keyboard accessible', async () => {
      const user = userEvent.setup();
      const onCreateNew = vi.fn();

      render(<NoteList {...defaultProps} notes={[]} onCreateNew={onCreateNew} />);

      const button = screen.getByRole('button', { name: 'Crear primera nota' });
      button.focus();
      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(onCreateNew).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== CONFIRM DIALOG INTEGRATION ====================
  describe('Confirm Dialog Integration', () => {
    it('opens confirm dialog with correct content', async () => {
      const user = userEvent.setup();

      render(<NoteList {...defaultProps} />);

      const deleteButtons = screen.getAllByRole('button', { name: 'Eliminar nota' });
      await user.click(deleteButtons[0]);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText('Eliminar nota')).toBeInTheDocument();
      expect(screen.getByText('¿Estás seguro de que deseas eliminar esta nota?')).toBeInTheDocument();
    });

    it('closes confirm dialog when confirmed', async () => {
      const user = userEvent.setup();

      render(<NoteList {...defaultProps} />);

      const deleteButtons = screen.getAllByRole('button', { name: 'Eliminar nota' });
      await user.click(deleteButtons[0]);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Eliminar' }));

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });

    it('closes confirm dialog when cancelled', async () => {
      const user = userEvent.setup();

      render(<NoteList {...defaultProps} />);

      const deleteButtons = screen.getAllByRole('button', { name: 'Eliminar nota' });
      await user.click(deleteButtons[0]);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });
  });

  // ==================== HANDLERS NOT PROVIDED ====================
  describe('Handlers Not Provided', () => {
    it('does not render edit buttons when onEdit is not provided', () => {
      render(<NoteList notes={mockNotes} onDelete={vi.fn()} />);

      expect(screen.queryByRole('button', { name: 'Editar nota' })).not.toBeInTheDocument();
    });

    it('does not render delete buttons when onDelete is not provided', () => {
      render(<NoteList notes={mockNotes} onEdit={vi.fn()} />);

      expect(screen.queryByRole('button', { name: 'Eliminar nota' })).not.toBeInTheDocument();
    });

    it('renders notes without any action buttons when no handlers provided', () => {
      render(<NoteList notes={mockNotes} />);

      expect(screen.queryByRole('button', { name: 'Editar nota' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Eliminar nota' })).not.toBeInTheDocument();
      expect(screen.getByText(/Primera nota clínica/)).toBeInTheDocument();
    });
  });
});
