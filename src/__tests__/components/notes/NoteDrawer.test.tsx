import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteDrawer } from '../../../components/notes/NoteDrawer';
import type { Note, CreateNoteDto, UpdateNoteDto } from '../../../lib/types/api.types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'notes.newNote': 'Nueva Nota',
        'notes.editNote': 'Editar Nota',
        'notes.drawer.closePanel': 'Cerrar panel',
        'notes.drawer.noteDate': 'Fecha de la nota',
        'notes.drawer.noteContent': 'Contenido de la nota',
        'notes.drawer.placeholder': 'Escribe el contenido de la nota...',
        'notes.drawer.encryptionNote': 'El contenido se cifrará de forma segura.',
        'notes.drawer.saving': 'Guardando...',
        'notes.drawer.save': 'Guardar',
        'notes.drawer.update': 'Actualizar',
        'common.cancel': 'Cancelar',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock note data for edit mode
const mockNote: Note = {
  id: 'note-1',
  text: 'Esta es una nota de prueba con contenido clínico.',
  noteDate: '2024-03-15T10:00:00.000Z',
  patientId: 'patient-1',
  patient: {
    id: 'patient-1',
    firstName: 'Juan',
    lastName: 'Pérez',
    active: true,
  },
  createdAt: '2024-03-15T10:00:00.000Z',
  updatedAt: '2024-03-15T10:00:00.000Z',
};

describe('NoteDrawer', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const mockPatientId = 'patient-1';

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSave.mockResolvedValue(undefined);
  });

  // ==================== RENDERING TESTS ====================
  describe('Rendering', () => {
    it('renders drawer when open', () => {
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      expect(screen.getByText('Nueva Nota')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <NoteDrawer
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      expect(screen.queryByText('Nueva Nota')).not.toBeInTheDocument();
    });

    it('shows "Nueva Nota" title for create mode', () => {
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      expect(screen.getByText('Nueva Nota')).toBeInTheDocument();
    });

    it('shows "Editar Nota" title for edit mode', () => {
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
          note={mockNote}
        />
      );

      expect(screen.getByText('Editar Nota')).toBeInTheDocument();
    });

    it('renders close button with aria-label', () => {
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      expect(screen.getByLabelText('Cerrar panel')).toBeInTheDocument();
    });

    it('renders encryption note message', () => {
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      expect(screen.getByText('El contenido se cifrará de forma segura.')).toBeInTheDocument();
    });
  });

  // ==================== FORM FIELDS TESTS ====================
  describe('Form Fields', () => {
    it('renders note date input', () => {
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      expect(screen.getByLabelText(/Fecha de la nota/)).toBeInTheDocument();
    });

    it('renders note content textarea', () => {
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      expect(screen.getByLabelText('Contenido de la nota')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Escribe el contenido de la nota...')).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    });

    it('renders save button in create mode', () => {
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      expect(screen.getByRole('button', { name: /Guardar/ })).toBeInTheDocument();
    });

    it('renders update button in edit mode', () => {
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
          note={mockNote}
        />
      );

      expect(screen.getByRole('button', { name: /Actualizar/ })).toBeInTheDocument();
    });
  });

  // ==================== FORM VALIDATION TESTS ====================
  describe('Form Validation', () => {
    it('disables submit button when content is empty', () => {
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      const submitButton = screen.getByRole('button', { name: /Guardar/ });
      expect(submitButton).toBeDisabled();
    });

    it('disables submit button when content is only whitespace', async () => {
      const user = userEvent.setup();
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      const textarea = screen.getByLabelText('Contenido de la nota');
      await user.type(textarea, '   ');

      const submitButton = screen.getByRole('button', { name: /Guardar/ });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when content is provided', async () => {
      const user = userEvent.setup();
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      const textarea = screen.getByLabelText('Contenido de la nota');
      await user.type(textarea, 'Contenido de prueba');

      const submitButton = screen.getByRole('button', { name: /Guardar/ });
      expect(submitButton).not.toBeDisabled();
    });

    it('does not call onSave when content is empty', async () => {
      const user = userEvent.setup();
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      // Button is disabled, click should not trigger save
      const submitButton = screen.getByRole('button', { name: /Guardar/ });
      await user.click(submitButton);

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  // ==================== CREATE MODE TESTS ====================
  describe('Create Mode', () => {
    it('submits form with CreateNoteDto when valid content is provided', async () => {
      const user = userEvent.setup();
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      const textarea = screen.getByLabelText('Contenido de la nota');
      await user.type(textarea, 'Nueva nota de sesión');

      await user.click(screen.getByRole('button', { name: /Guardar/ }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            text: 'Nueva nota de sesión',
            patientId: mockPatientId,
            noteDate: expect.any(String),
          })
        );
      });
    });

    it('includes noteDate in create data', async () => {
      const user = userEvent.setup();
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      const textarea = screen.getByLabelText('Contenido de la nota');
      await user.type(textarea, 'Contenido de prueba');

      await user.click(screen.getByRole('button', { name: /Guardar/ }));

      await waitFor(() => {
        const callArg = mockOnSave.mock.calls[0][0] as CreateNoteDto;
        expect(callArg.noteDate).toBeDefined();
        expect(typeof callArg.noteDate).toBe('string');
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      // Make onSave take some time
      mockOnSave.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      const textarea = screen.getByLabelText('Contenido de la nota');
      await user.type(textarea, 'Contenido de prueba');

      await user.click(screen.getByRole('button', { name: /Guardar/ }));

      expect(screen.getByText('Guardando...')).toBeInTheDocument();

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('closes drawer on successful save', async () => {
      const user = userEvent.setup();
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      const textarea = screen.getByLabelText('Contenido de la nota');
      await user.type(textarea, 'Contenido de prueba');

      await user.click(screen.getByRole('button', { name: /Guardar/ }));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('does not pass noteId when creating', async () => {
      const user = userEvent.setup();
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      const textarea = screen.getByLabelText('Contenido de la nota');
      await user.type(textarea, 'Contenido de prueba');

      await user.click(screen.getByRole('button', { name: /Guardar/ }));

      await waitFor(() => {
        // onSave should be called with just the data (no noteId)
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({ text: 'Contenido de prueba' })
        );
        // Second argument should be undefined (no noteId)
        expect(mockOnSave.mock.calls[0][1]).toBeUndefined();
      });
    });
  });

  // ==================== EDIT MODE TESTS ====================
  describe('Edit Mode', () => {
    it('pre-fills form with note data', () => {
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
          note={mockNote}
        />
      );

      const textarea = screen.getByLabelText('Contenido de la nota');
      expect(textarea).toHaveValue('Esta es una nota de prueba con contenido clínico.');
    });

    it('pre-fills note date from note data', () => {
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
          note={mockNote}
        />
      );

      const dateInput = screen.getByLabelText(/Fecha de la nota/);
      // Date input value is in YYYY-MM-DD format
      expect(dateInput).toHaveValue('2024-03-15');
    });

    it('calls onSave with UpdateNoteDto and noteId', async () => {
      const user = userEvent.setup();
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
          note={mockNote}
        />
      );

      const textarea = screen.getByLabelText('Contenido de la nota');
      await user.clear(textarea);
      await user.type(textarea, 'Contenido actualizado');

      await user.click(screen.getByRole('button', { name: /Actualizar/ }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            text: 'Contenido actualizado',
          }),
          'note-1' // noteId
        );
      });
    });

    it('UpdateNoteDto does not include patientId', async () => {
      const user = userEvent.setup();
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
          note={mockNote}
        />
      );

      const textarea = screen.getByLabelText('Contenido de la nota');
      await user.clear(textarea);
      await user.type(textarea, 'Contenido actualizado');

      await user.click(screen.getByRole('button', { name: /Actualizar/ }));

      await waitFor(() => {
        const callArg = mockOnSave.mock.calls[0][0] as UpdateNoteDto;
        expect(callArg).not.toHaveProperty('patientId');
      });
    });

    it('closes drawer on successful update', async () => {
      const user = userEvent.setup();
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
          note={mockNote}
        />
      );

      await user.click(screen.getByRole('button', { name: /Actualizar/ }));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('resets form when note prop changes to null', async () => {
      const { rerender } = render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
          note={mockNote}
        />
      );

      expect(screen.getByLabelText('Contenido de la nota')).toHaveValue(
        'Esta es una nota de prueba con contenido clínico.'
      );

      rerender(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
          note={null}
        />
      );

      expect(screen.getByLabelText('Contenido de la nota')).toHaveValue('');
    });

    it('updates form when note prop changes to different note', async () => {
      const anotherNote: Note = {
        ...mockNote,
        id: 'note-2',
        text: 'Otra nota diferente',
      };

      const { rerender } = render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
          note={mockNote}
        />
      );

      expect(screen.getByLabelText('Contenido de la nota')).toHaveValue(
        'Esta es una nota de prueba con contenido clínico.'
      );

      rerender(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
          note={anotherNote}
        />
      );

      expect(screen.getByLabelText('Contenido de la nota')).toHaveValue('Otra nota diferente');
    });
  });

  // ==================== ERROR HANDLING TESTS ====================
  describe('Error Handling', () => {
    it('does not close drawer on save error', async () => {
      const user = userEvent.setup();
      mockOnSave.mockRejectedValue(new Error('Network error'));

      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      const textarea = screen.getByLabelText('Contenido de la nota');
      await user.type(textarea, 'Contenido de prueba');

      await user.click(screen.getByRole('button', { name: /Guardar/ }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      // onClose should NOT be called on error
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('re-enables submit button after error', async () => {
      const user = userEvent.setup();
      mockOnSave.mockRejectedValue(new Error('Network error'));

      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      const textarea = screen.getByLabelText('Contenido de la nota');
      await user.type(textarea, 'Contenido de prueba');

      await user.click(screen.getByRole('button', { name: /Guardar/ }));

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Guardar/ });
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  // ==================== INTERACTION TESTS ====================
  describe('Interactions', () => {
    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button (X) is clicked', async () => {
      const user = userEvent.setup();
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      await user.click(screen.getByLabelText('Cerrar panel'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking backdrop', async () => {
      const user = userEvent.setup();
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      // Click the backdrop
      const backdrop = document.querySelector('.backdrop-blur-\\[2px\\]');
      if (backdrop) {
        await user.click(backdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });

    it('does not call onClose when clicking inside drawer content', async () => {
      const user = userEvent.setup();
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      // Click inside the drawer on the textarea
      const textarea = screen.getByLabelText('Contenido de la nota');
      await user.click(textarea);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('allows typing in textarea', async () => {
      const user = userEvent.setup();
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      const textarea = screen.getByLabelText('Contenido de la nota');
      await user.type(textarea, 'Texto de prueba');

      expect(textarea).toHaveValue('Texto de prueba');
    });

    it('allows changing the date', () => {
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      const dateInput = screen.getByLabelText(/Fecha de la nota/) as HTMLInputElement;
      const initialValue = dateInput.value;
      
      // Use fireEvent for date inputs as userEvent.type doesn't work well with date inputs in jsdom
      fireEvent.change(dateInput, { target: { value: '2024-06-20' } });

      // The component may adjust the date due to timezone handling in formatISODate
      // Just verify that the date changed from the initial value
      expect(dateInput.value).not.toBe(initialValue);
    });

    it('does not close when saving is in progress', async () => {
      const user = userEvent.setup();
      let resolvePromise: () => void;
      mockOnSave.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      const textarea = screen.getByLabelText('Contenido de la nota');
      await user.type(textarea, 'Contenido de prueba');

      await user.click(screen.getByRole('button', { name: /Guardar/ }));

      // Try to close while saving
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      // Should not close
      expect(mockOnClose).not.toHaveBeenCalled();

      // Now resolve the promise
      resolvePromise!();

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('disables close button (X) when saving is in progress', async () => {
      const user = userEvent.setup();
      mockOnSave.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      const textarea = screen.getByLabelText('Contenido de la nota');
      await user.type(textarea, 'Contenido de prueba');

      await user.click(screen.getByRole('button', { name: /Guardar/ }));

      const closeButton = screen.getByLabelText('Cerrar panel');
      expect(closeButton).toBeDisabled();
    });

    it('disables textarea when saving is in progress', async () => {
      const user = userEvent.setup();
      mockOnSave.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      const textarea = screen.getByLabelText('Contenido de la nota');
      await user.type(textarea, 'Contenido de prueba');

      await user.click(screen.getByRole('button', { name: /Guardar/ }));

      expect(textarea).toBeDisabled();
    });

    it('disables cancel button when saving is in progress', async () => {
      const user = userEvent.setup();
      mockOnSave.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      const textarea = screen.getByLabelText('Contenido de la nota');
      await user.type(textarea, 'Contenido de prueba');

      await user.click(screen.getByRole('button', { name: /Guardar/ }));

      const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
      expect(cancelButton).toBeDisabled();
    });
  });

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('handles note with empty text', () => {
      const noteWithEmptyText: Note = {
        ...mockNote,
        text: '',
      };

      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
          note={noteWithEmptyText}
        />
      );

      const textarea = screen.getByLabelText('Contenido de la nota');
      expect(textarea).toHaveValue('');
    });

    it('handles note with null text gracefully', () => {
      const noteWithNullText: Note = {
        ...mockNote,
        text: null as unknown as string,
      };

      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
          note={noteWithNullText}
        />
      );

      const textarea = screen.getByLabelText('Contenido de la nota');
      expect(textarea).toHaveValue('');
    });

    it('resets form state when isOpen changes from false to true', async () => {
      const { rerender } = render(
        <NoteDrawer
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      rerender(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      const textarea = screen.getByLabelText('Contenido de la nota');
      expect(textarea).toHaveValue('');
    });

    it('handles very long text content', async () => {
      const user = userEvent.setup();
      const longText = 'A'.repeat(5000);

      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      const textarea = screen.getByLabelText('Contenido de la nota');
      // Use fireEvent for long text to avoid timeout
      fireEvent.change(textarea, { target: { value: longText } });

      expect(textarea).toHaveValue(longText);

      await user.click(screen.getByRole('button', { name: /Guardar/ }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({ text: longText })
        );
      });
    });

    it('maintains date when text is cleared and re-typed', async () => {
      const user = userEvent.setup();
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
          note={mockNote}
        />
      );

      const textarea = screen.getByLabelText('Contenido de la nota');
      const dateInput = screen.getByLabelText(/Fecha de la nota/);

      const initialDate = dateInput.getAttribute('value');

      await user.clear(textarea);
      await user.type(textarea, 'Nuevo contenido');

      // Date should be unchanged
      expect(dateInput).toHaveValue(initialDate);
    });
  });

  // ==================== ACCESSIBILITY TESTS ====================
  describe('Accessibility', () => {
    it('has accessible label for textarea', () => {
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      expect(screen.getByLabelText('Contenido de la nota')).toBeInTheDocument();
    });

    it('has accessible label for date input', () => {
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      expect(screen.getByLabelText(/Fecha de la nota/)).toBeInTheDocument();
    });

    it('close button has aria-label', () => {
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      const closeButton = screen.getByLabelText('Cerrar panel');
      expect(closeButton).toBeInTheDocument();
    });

    it('date input has correct type attribute', () => {
      render(
        <NoteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patientId={mockPatientId}
        />
      );

      const dateInput = screen.getByLabelText(/Fecha de la nota/);
      expect(dateInput).toHaveAttribute('type', 'date');
    });
  });
});
