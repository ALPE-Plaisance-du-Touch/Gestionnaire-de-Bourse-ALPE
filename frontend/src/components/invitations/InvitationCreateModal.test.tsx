import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { InvitationCreateModal } from './InvitationCreateModal';
import { invitationsApi, ApiException } from '@/api';

// Mock the invitations API
vi.mock('@/api', () => ({
  invitationsApi: {
    createInvitation: vi.fn(),
    // Called from a debounced timer as the email field is typed; without it the
    // timer rejects after the test ends and pollutes the run.
    lookupDepositor: vi.fn().mockResolvedValue(null),
  },
  ApiException: class ApiException extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

// Modal focuses its own container from a requestAnimationFrame callback on open.
// If that fires mid-typing it pulls focus off the field and silently drops the
// remaining keystrokes, leaving the submit button disabled.
const waitForModalFocusTrap = async () => {
  const modalContainer = document.querySelector('[role="dialog"] > div');
  await waitFor(() => {
    expect(modalContainer).toHaveFocus();
  });
};

describe('InvitationCreateModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with form fields when open', async () => {
    renderWithProviders(<InvitationCreateModal {...defaultProps} />);
    await waitForModalFocusTrap();

    expect(screen.getByText('Nouvelle invitation')).toBeInTheDocument();
    expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Prénom')).toBeInTheDocument();
    expect(screen.getByLabelText('Nom')).toBeInTheDocument();
    expect(screen.getByLabelText(/type de liste/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithProviders(<InvitationCreateModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Nouvelle invitation')).not.toBeInTheDocument();
  });

  it('validates email format', async () => {
    renderWithProviders(<InvitationCreateModal {...defaultProps} />);
    await waitForModalFocusTrap();

    const emailInput = screen.getByLabelText(/adresse email/i);
    // Use an email that browser validation accepts but our regex rejects
    // The regex requires at least one character after the dot: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    // An email like "test@test" has no dot after @, so browser may accept but our code won't
    await userEvent.type(emailInput, 'a@b');

    // The submit button should be enabled now since email field has a value
    const submitButton = screen.getByText("Envoyer l'invitation");
    expect(submitButton).not.toBeDisabled();

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/veuillez saisir une adresse email valide/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    vi.mocked(invitationsApi.createInvitation).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      firstName: 'Jean',
      lastName: 'Dupont',
      status: 'sent',
      createdAt: '2024-01-15T10:00:00Z',
      expiresAt: '2024-01-22T10:00:00Z',
      usedAt: null,
    });

    renderWithProviders(<InvitationCreateModal {...defaultProps} />);
    await waitForModalFocusTrap();

    await userEvent.type(screen.getByLabelText(/adresse email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Prénom'), 'Jean');
    await userEvent.type(screen.getByLabelText('Nom'), 'Dupont');
    await userEvent.click(screen.getByText("Envoyer l'invitation"));

    await waitFor(() => {
      expect(invitationsApi.createInvitation).toHaveBeenCalled();
      const calls = vi.mocked(invitationsApi.createInvitation).mock.calls;
      expect(calls[0][0]).toEqual({
        email: 'test@example.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        listType: 'standard',
      });
    });
  });

  it('shows success message after creation', async () => {
    vi.mocked(invitationsApi.createInvitation).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      firstName: 'Jean',
      lastName: 'Dupont',
      status: 'sent',
      createdAt: '2024-01-15T10:00:00Z',
      expiresAt: '2024-01-22T10:00:00Z',
      usedAt: null,
    });

    renderWithProviders(<InvitationCreateModal {...defaultProps} />);
    await waitForModalFocusTrap();

    await userEvent.type(screen.getByLabelText(/adresse email/i), 'test@example.com');
    await userEvent.click(screen.getByText("Envoyer l'invitation"));

    await waitFor(() => {
      expect(screen.getByText(/invitation envoyée avec succès/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Créer une autre invitation')).toBeInTheDocument();
  });

  it('shows error for duplicate email (409)', async () => {
    const apiError = new ApiException('Duplicate', 409);
    (apiError as ApiException).status = 409;
    vi.mocked(invitationsApi.createInvitation).mockRejectedValue(apiError);

    renderWithProviders(<InvitationCreateModal {...defaultProps} />);
    await waitForModalFocusTrap();

    await userEvent.type(screen.getByLabelText(/adresse email/i), 'existing@example.com');
    await userEvent.click(screen.getByText("Envoyer l'invitation"));

    await waitFor(() => {
      expect(screen.getByText(/invitation existe déjà/i)).toBeInTheDocument();
    });
  });

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn();
    renderWithProviders(<InvitationCreateModal isOpen={true} onClose={onClose} />);
    await waitForModalFocusTrap();

    await userEvent.click(screen.getByText('Annuler'));

    expect(onClose).toHaveBeenCalled();
  });

  it('resets form when "create another" is clicked', async () => {
    vi.mocked(invitationsApi.createInvitation).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      firstName: null,
      lastName: null,
      status: 'sent',
      createdAt: '2024-01-15T10:00:00Z',
      expiresAt: '2024-01-22T10:00:00Z',
      usedAt: null,
    });

    renderWithProviders(<InvitationCreateModal {...defaultProps} />);
    await waitForModalFocusTrap();

    // Submit first invitation
    await userEvent.type(screen.getByLabelText(/adresse email/i), 'test@example.com');
    await userEvent.click(screen.getByText("Envoyer l'invitation"));

    await waitFor(() => {
      expect(screen.getByText('Créer une autre invitation')).toBeInTheDocument();
    });

    // Click "create another"
    await userEvent.click(screen.getByText('Créer une autre invitation'));

    // Form should be reset - after clicking "create another", the form reappears
    await waitFor(() => {
      const emailInput = screen.getByLabelText(/adresse email/i);
      expect(emailInput).toHaveValue('');
    });
  });

  it('allows selecting different list types', async () => {
    vi.mocked(invitationsApi.createInvitation).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      firstName: null,
      lastName: null,
      status: 'sent',
      createdAt: '2024-01-15T10:00:00Z',
      expiresAt: '2024-01-22T10:00:00Z',
      usedAt: null,
    });

    renderWithProviders(<InvitationCreateModal {...defaultProps} />);
    await waitForModalFocusTrap();

    await userEvent.type(screen.getByLabelText(/adresse email/i), 'test@example.com');
    await userEvent.selectOptions(screen.getByLabelText(/type de liste/i), 'list_1000');
    await userEvent.click(screen.getByText("Envoyer l'invitation"));

    await waitFor(() => {
      expect(invitationsApi.createInvitation).toHaveBeenCalled();
      const calls = vi.mocked(invitationsApi.createInvitation).mock.calls;
      expect(calls[0][0]).toMatchObject({ listType: 'list_1000' });
    });
  });
});
