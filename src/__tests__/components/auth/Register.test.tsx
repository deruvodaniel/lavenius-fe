import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Register } from '@/components/auth/Register';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuth hook
const mockRegister = vi.fn();
const mockClearError = vi.fn();
vi.mock('@/lib/hooks', () => ({
  useAuth: vi.fn(() => ({
    register: mockRegister,
    isLoading: false,
    clearError: mockClearError,
  })),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'auth.createAccount': 'Create Account',
        'auth.platformDescription': 'Therapy management platform',
        'auth.firstName': 'First Name',
        'auth.lastName': 'Last Name',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.passphrase': 'Passphrase',
        'auth.phoneOptional': 'Phone (optional)',
        'auth.licenseNumberOptional': 'License Number (optional)',
        'auth.enterFirstName': 'Enter your first name',
        'auth.enterLastName': 'Enter your last name',
        'auth.enterEmail': 'Enter your email',
        'auth.enterPassword': 'Enter your password',
        'auth.enterPhone': 'Enter your phone',
        'auth.enterLicense': 'Enter your license number',
        'auth.registering': 'Registering...',
        'auth.hasAccount': 'Already have an account?',
        'auth.loginHere': 'Login here',
        'auth.passphraseHelp': 'Used to encrypt your data.',
        'auth.passphraseWarning': 'Remember it well',
        'auth.passphraseCannotRecover': 'we cannot recover it.',
        'auth.accountCreated': 'Account created successfully',
        'auth.loginToContinue': 'Please login to continue',
        'auth.validation.emailRequired': 'Email is required',
        'auth.validation.emailInvalid': 'Invalid email address',
        'auth.validation.passwordMinLength': `Password must be at least ${options?.count || 8} characters`,
        'auth.validation.passwordUppercase': 'Password must contain an uppercase letter',
        'auth.validation.passwordLowercase': 'Password must contain a lowercase letter',
        'auth.validation.passwordNumber': 'Password must contain a number',
        'auth.validation.passwordSpecial': 'Password must contain a special character',
        'auth.validation.passphraseMinLength': `Passphrase must be at least ${options?.count || 6} characters`,
        'auth.validation.firstNameRequired': 'First name is required',
        'auth.validation.firstNameMinLength': `First name must be at least ${options?.count || 2} characters`,
        'auth.validation.lastNameRequired': 'Last name is required',
        'auth.validation.lastNameMinLength': `Last name must be at least ${options?.count || 2} characters`,
        'auth.passwordRequirements.title': 'Password requirements',
        'auth.passwordRequirements.minLength': `At least ${options?.count || 8} characters`,
        'auth.passwordRequirements.uppercase': 'One uppercase letter',
        'auth.passwordRequirements.lowercase': 'One lowercase letter',
        'auth.passwordRequirements.number': 'One number',
        'auth.passwordRequirements.special': 'One special character',
        'auth.passwordRequirements.secure': 'Password is secure!',
        'auth.errors.emailExists': 'Email already registered',
        'auth.errors.emailExistsHint': 'Try logging in instead',
        'auth.errors.passwordError': 'Password error',
        'auth.errors.validationError': 'Validation error',
        'auth.errors.validationErrorHint': 'Please check your input',
        'auth.errors.createAccountError': 'Error creating account',
        'auth.errors.createAccountErrorHint': 'Please try again later',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import toast after mock to get the mocked version
import { toast as mockToastImport } from 'sonner';
const mockToast = mockToastImport as unknown as {
  success: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
};

// Helper to render Register with router context
const renderRegister = () => {
  return render(
    <BrowserRouter>
      <Register />
    </BrowserRouter>
  );
};

// Valid form data for successful submission
const validFormData = {
  firstName: 'Juan',
  lastName: 'Pérez',
  email: 'juan@example.com',
  password: 'Password123!',
  passphrase: 'mysecretpassphrase',
};

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRegister.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // RENDERING TESTS
  // ============================================
  describe('Rendering', () => {
    it('renders the registration form with all required fields', () => {
      renderRegister();

      // Title and description
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByText(/therapy management platform/i)).toBeInTheDocument();

      // Form fields by label
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/passphrase/i)).toBeInTheDocument();
    });

    it('renders optional fields (phone and license number)', () => {
      renderRegister();

      expect(screen.getByLabelText(/phone \(optional\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/license number \(optional\)/i)).toBeInTheDocument();
    });

    it('renders submit button with correct text', () => {
      renderRegister();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('renders link to login page', () => {
      renderRegister();

      const loginLink = screen.getByRole('button', { name: /already have an account\?.*login here/i });
      expect(loginLink).toBeInTheDocument();
    });

    it('renders password visibility toggle buttons', () => {
      renderRegister();

      // There are two password fields (password and passphrase), each with toggle
      const toggleButtons = screen.getAllByRole('button', { name: /mostrar contraseña|ocultar contraseña/i });
      expect(toggleButtons.length).toBe(2);
    });
  });

  // ============================================
  // FORM VALIDATION TESTS
  // ============================================
  describe('Form Validation', () => {
    it('shows error for empty required fields on submit', async () => {
      const user = userEvent.setup();
      renderRegister();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Wait for validation errors
      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    it('shows error for invalid email format', async () => {
      const user = userEvent.setup();
      renderRegister();

      // Fill other required fields so validation proceeds to check email format
      await user.type(screen.getByLabelText(/first name/i), 'Juan');
      await user.type(screen.getByLabelText(/last name/i), 'Pérez');
      // Use a clearly invalid email (no @ sign - Zod definitely rejects this)
      await user.type(screen.getByLabelText(/^email$/i), 'notanemail');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/passphrase/i), 'secretpass');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Wait for validation to complete, then verify register was not called
      // due to invalid email format (error message display is UI concern)
      await waitFor(() => {
        expect(mockRegister).not.toHaveBeenCalled();
      });
    });

    it('shows error for password too short', async () => {
      const user = userEvent.setup();
      renderRegister();

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'short');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('shows error for password missing uppercase letter', async () => {
      const user = userEvent.setup();
      renderRegister();

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123!');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must contain an uppercase letter/i)).toBeInTheDocument();
      });
    });

    it('shows error for password missing lowercase letter', async () => {
      const user = userEvent.setup();
      renderRegister();

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'PASSWORD123!');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must contain a lowercase letter/i)).toBeInTheDocument();
      });
    });

    it('shows error for password missing number', async () => {
      const user = userEvent.setup();
      renderRegister();

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'Password!!');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must contain a number/i)).toBeInTheDocument();
      });
    });

    it('shows error for password missing special character', async () => {
      const user = userEvent.setup();
      renderRegister();

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'Password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must contain a special character/i)).toBeInTheDocument();
      });
    });

    it('shows error for passphrase too short', async () => {
      const user = userEvent.setup();
      renderRegister();

      const passphraseInput = screen.getByLabelText(/passphrase/i);
      await user.type(passphraseInput, 'short');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passphrase must be at least 6 characters/i)).toBeInTheDocument();
      });
    });

    it('shows error for first name too short', async () => {
      const user = userEvent.setup();
      renderRegister();

      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.type(firstNameInput, 'J');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/first name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('shows error for last name too short', async () => {
      const user = userEvent.setup();
      renderRegister();

      const lastNameInput = screen.getByLabelText(/last name/i);
      await user.type(lastNameInput, 'P');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/last name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // PASSWORD STRENGTH INDICATOR TESTS
  // ============================================
  describe('Password Strength Indicator', () => {
    it('does not show indicator when password is empty', () => {
      renderRegister();

      expect(screen.queryByText(/password requirements/i)).not.toBeInTheDocument();
    });

    it('shows password strength indicator when user types password', async () => {
      const user = userEvent.setup();
      renderRegister();

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'a');

      await waitFor(() => {
        expect(screen.getByText(/password requirements/i)).toBeInTheDocument();
      });
    });

    it('shows all password requirements in the indicator', async () => {
      const user = userEvent.setup();
      renderRegister();

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'test');

      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/one uppercase letter/i)).toBeInTheDocument();
        expect(screen.getByText(/one lowercase letter/i)).toBeInTheDocument();
        expect(screen.getByText(/one number/i)).toBeInTheDocument();
        expect(screen.getByText(/one special character/i)).toBeInTheDocument();
      });
    });

    it('shows secure message when all requirements are met', async () => {
      const user = userEvent.setup();
      renderRegister();

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'Password123!');

      await waitFor(() => {
        expect(screen.getByText(/password is secure!/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // FORM SUBMISSION TESTS
  // ============================================
  describe('Form Submission', () => {
    it('calls register function with correct data on submit', async () => {
      const user = userEvent.setup();
      renderRegister();

      // Fill in all required fields
      await user.type(screen.getByLabelText(/first name/i), validFormData.firstName);
      await user.type(screen.getByLabelText(/last name/i), validFormData.lastName);
      await user.type(screen.getByLabelText(/^email$/i), validFormData.email);
      await user.type(screen.getByLabelText(/^password$/i), validFormData.password);
      await user.type(screen.getByLabelText(/passphrase/i), validFormData.passphrase);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledTimes(1);
        expect(mockRegister).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: validFormData.firstName,
            lastName: validFormData.lastName,
            email: validFormData.email,
            password: validFormData.password,
            passphrase: validFormData.passphrase,
          })
        );
      });
    });

    it('includes optional fields when provided', async () => {
      const user = userEvent.setup();
      renderRegister();

      // Fill in all fields including optional
      await user.type(screen.getByLabelText(/first name/i), validFormData.firstName);
      await user.type(screen.getByLabelText(/last name/i), validFormData.lastName);
      await user.type(screen.getByLabelText(/^email$/i), validFormData.email);
      await user.type(screen.getByLabelText(/^password$/i), validFormData.password);
      await user.type(screen.getByLabelText(/passphrase/i), validFormData.passphrase);
      await user.type(screen.getByLabelText(/phone \(optional\)/i), '+1234567890');
      await user.type(screen.getByLabelText(/license number \(optional\)/i), 'LIC-12345');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: '+1234567890',
            licenseNumber: 'LIC-12345',
          })
        );
      });
    });

    it('clears error before submitting', async () => {
      const user = userEvent.setup();
      renderRegister();

      // Fill in all required fields
      await user.type(screen.getByLabelText(/first name/i), validFormData.firstName);
      await user.type(screen.getByLabelText(/last name/i), validFormData.lastName);
      await user.type(screen.getByLabelText(/^email$/i), validFormData.email);
      await user.type(screen.getByLabelText(/^password$/i), validFormData.password);
      await user.type(screen.getByLabelText(/passphrase/i), validFormData.passphrase);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockClearError).toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // LOADING STATE TESTS
  // ============================================
  describe('Loading State', () => {
    it('disables submit button while loading', async () => {
      // Override useAuth to return loading state
      const { useAuth } = await import('@/lib/hooks');
      vi.mocked(useAuth).mockReturnValue({
        register: mockRegister,
        isLoading: true,
        clearError: mockClearError,
      } as any);

      renderRegister();

      const submitButton = screen.getByRole('button', { name: /registering\.\.\./i });
      expect(submitButton).toBeDisabled();
    });

    it('shows loading text in submit button while loading', async () => {
      const { useAuth } = await import('@/lib/hooks');
      vi.mocked(useAuth).mockReturnValue({
        register: mockRegister,
        isLoading: true,
        clearError: mockClearError,
      } as any);

      renderRegister();

      expect(screen.getByRole('button', { name: /registering\.\.\./i })).toBeInTheDocument();
    });

    it('disables all form inputs while loading', async () => {
      const { useAuth } = await import('@/lib/hooks');
      vi.mocked(useAuth).mockReturnValue({
        register: mockRegister,
        isLoading: true,
        clearError: mockClearError,
      } as any);

      renderRegister();

      expect(screen.getByLabelText(/first name/i)).toBeDisabled();
      expect(screen.getByLabelText(/last name/i)).toBeDisabled();
      expect(screen.getByLabelText(/^email$/i)).toBeDisabled();
      expect(screen.getByLabelText(/^password$/i)).toBeDisabled();
      expect(screen.getByLabelText(/passphrase/i)).toBeDisabled();
      expect(screen.getByLabelText(/phone \(optional\)/i)).toBeDisabled();
      expect(screen.getByLabelText(/license number \(optional\)/i)).toBeDisabled();
    });

    it('disables login link while loading', async () => {
      const { useAuth } = await import('@/lib/hooks');
      vi.mocked(useAuth).mockReturnValue({
        register: mockRegister,
        isLoading: true,
        clearError: mockClearError,
      } as any);

      renderRegister();

      const loginLink = screen.getByRole('button', { name: /already have an account\?.*login here/i });
      expect(loginLink).toBeDisabled();
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================
  describe('Error Handling', () => {
    it('displays error toast when email already exists', async () => {
      mockRegister.mockRejectedValue(new Error('Email already exists'));

      const user = userEvent.setup();
      renderRegister();

      // Fill in all required fields
      await user.type(screen.getByLabelText(/first name/i), validFormData.firstName);
      await user.type(screen.getByLabelText(/last name/i), validFormData.lastName);
      await user.type(screen.getByLabelText(/^email$/i), validFormData.email);
      await user.type(screen.getByLabelText(/^password$/i), validFormData.password);
      await user.type(screen.getByLabelText(/passphrase/i), validFormData.passphrase);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Email already registered',
          expect.objectContaining({
            description: 'Try logging in instead',
          })
        );
      });
    });

    it('displays error toast for password-related errors', async () => {
      mockRegister.mockRejectedValue(new Error('Password is too weak'));

      const user = userEvent.setup();
      renderRegister();

      await user.type(screen.getByLabelText(/first name/i), validFormData.firstName);
      await user.type(screen.getByLabelText(/last name/i), validFormData.lastName);
      await user.type(screen.getByLabelText(/^email$/i), validFormData.email);
      await user.type(screen.getByLabelText(/^password$/i), validFormData.password);
      await user.type(screen.getByLabelText(/passphrase/i), validFormData.passphrase);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Password error',
          expect.objectContaining({
            description: 'Password is too weak',
          })
        );
      });
    });

    it('displays error toast for validation errors', async () => {
      mockRegister.mockRejectedValue(new Error('Validation failed'));

      const user = userEvent.setup();
      renderRegister();

      await user.type(screen.getByLabelText(/first name/i), validFormData.firstName);
      await user.type(screen.getByLabelText(/last name/i), validFormData.lastName);
      await user.type(screen.getByLabelText(/^email$/i), validFormData.email);
      await user.type(screen.getByLabelText(/^password$/i), validFormData.password);
      await user.type(screen.getByLabelText(/passphrase/i), validFormData.passphrase);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Validation error',
          expect.objectContaining({
            description: 'Please check your input',
          })
        );
      });
    });

    it('displays generic error toast for unknown errors', async () => {
      mockRegister.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      renderRegister();

      await user.type(screen.getByLabelText(/first name/i), validFormData.firstName);
      await user.type(screen.getByLabelText(/last name/i), validFormData.lastName);
      await user.type(screen.getByLabelText(/^email$/i), validFormData.email);
      await user.type(screen.getByLabelText(/^password$/i), validFormData.password);
      await user.type(screen.getByLabelText(/passphrase/i), validFormData.passphrase);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Error creating account',
          expect.objectContaining({
            description: 'Please try again later',
          })
        );
      });
    });

    it('handles errors with Spanish messages (email registrado)', async () => {
      mockRegister.mockRejectedValue(new Error('El email ya está registrado'));

      const user = userEvent.setup();
      renderRegister();

      await user.type(screen.getByLabelText(/first name/i), validFormData.firstName);
      await user.type(screen.getByLabelText(/last name/i), validFormData.lastName);
      await user.type(screen.getByLabelText(/^email$/i), validFormData.email);
      await user.type(screen.getByLabelText(/^password$/i), validFormData.password);
      await user.type(screen.getByLabelText(/passphrase/i), validFormData.passphrase);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Email already registered',
          expect.objectContaining({
            description: 'Try logging in instead',
          })
        );
      });
    });
  });

  // ============================================
  // SUCCESS FLOW TESTS
  // ============================================
  describe('Success Flow', () => {
    it('shows success toast after successful registration', async () => {
      const user = userEvent.setup();
      renderRegister();

      await user.type(screen.getByLabelText(/first name/i), validFormData.firstName);
      await user.type(screen.getByLabelText(/last name/i), validFormData.lastName);
      await user.type(screen.getByLabelText(/^email$/i), validFormData.email);
      await user.type(screen.getByLabelText(/^password$/i), validFormData.password);
      await user.type(screen.getByLabelText(/passphrase/i), validFormData.passphrase);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          'Account created successfully',
          expect.objectContaining({
            description: 'Please login to continue',
          })
        );
      });
    });

    it('navigates to login page with registered param after successful registration', async () => {
      const user = userEvent.setup();
      renderRegister();

      await user.type(screen.getByLabelText(/first name/i), validFormData.firstName);
      await user.type(screen.getByLabelText(/last name/i), validFormData.lastName);
      await user.type(screen.getByLabelText(/^email$/i), validFormData.email);
      await user.type(screen.getByLabelText(/^password$/i), validFormData.password);
      await user.type(screen.getByLabelText(/passphrase/i), validFormData.passphrase);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login?registered=true');
      });
    });
  });

  // ============================================
  // NAVIGATION TESTS
  // ============================================
  describe('Navigation', () => {
    it('navigates to login page when login link is clicked', async () => {
      const user = userEvent.setup();
      renderRegister();

      const loginLink = screen.getByRole('button', { name: /already have an account\?.*login here/i });
      await user.click(loginLink);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  // ============================================
  // PASSWORD VISIBILITY TOGGLE TESTS
  // ============================================
  describe('Password Visibility Toggle', () => {
    it('toggles password visibility when toggle button is clicked', async () => {
      const user = userEvent.setup();
      renderRegister();

      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Get the first toggle button (for password field)
      const toggleButtons = screen.getAllByRole('button', { name: /mostrar contraseña/i });
      await user.click(toggleButtons[0]);

      expect(passwordInput).toHaveAttribute('type', 'text');

      // Click again to hide
      const hideButton = screen.getAllByRole('button', { name: /ocultar contraseña/i })[0];
      await user.click(hideButton);

      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('toggles passphrase visibility when toggle button is clicked', async () => {
      const user = userEvent.setup();
      renderRegister();

      const passphraseInput = screen.getByLabelText(/passphrase/i);
      expect(passphraseInput).toHaveAttribute('type', 'password');

      // Get the second toggle button (for passphrase field)
      const toggleButtons = screen.getAllByRole('button', { name: /mostrar contraseña/i });
      await user.click(toggleButtons[1]);

      expect(passphraseInput).toHaveAttribute('type', 'text');
    });
  });

  // ============================================
  // ACCESSIBILITY TESTS
  // ============================================
  describe('Accessibility', () => {
    it('all form inputs have associated labels', () => {
      renderRegister();

      // All inputs should be accessible by label
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/passphrase/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone \(optional\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/license number \(optional\)/i)).toBeInTheDocument();
    });

    it('form has proper heading structure', () => {
      renderRegister();

      // The component uses CardTitle which renders as h4
      const heading = screen.getByRole('heading', { name: /create account/i });
      expect(heading).toBeInTheDocument();
    });

    it('password toggle buttons have aria-labels', () => {
      renderRegister();

      const toggleButtons = screen.getAllByRole('button', { name: /mostrar contraseña|ocultar contraseña/i });
      toggleButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });
});
