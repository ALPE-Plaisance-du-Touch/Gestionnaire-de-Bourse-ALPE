import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { BulkInvitationModal } from './BulkInvitationModal';
import { invitationsApi } from '@/api';

// Mock the invitations API
vi.mock('@/api', () => ({
  invitationsApi: {
    createBulkInvitations: vi.fn(),
  },
}));

describe('BulkInvitationModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with upload area when open', () => {
    renderWithProviders(<BulkInvitationModal {...defaultProps} />);

    expect(screen.getByText('Invitations en masse')).toBeInTheDocument();
    expect(screen.getByText(/glissez-déposez/i)).toBeInTheDocument();
    expect(screen.getByText('Parcourir...')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithProviders(<BulkInvitationModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Invitations en masse')).not.toBeInTheDocument();
  });

  it('shows format instructions', () => {
    renderWithProviders(<BulkInvitationModal {...defaultProps} />);

    expect(screen.getByText(/format attendu/i)).toBeInTheDocument();
    expect(screen.getByText(/email,prenom,nom,type_liste/i)).toBeInTheDocument();
  });

  it('shows error for non-CSV file', async () => {
    renderWithProviders(<BulkInvitationModal {...defaultProps} />);

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const input = document.getElementById('csv-upload') as HTMLInputElement;

    // Manually trigger file upload since userEvent.upload may not work well with hidden inputs
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    // Trigger the change event
    const changeEvent = new Event('change', { bubbles: true });
    input.dispatchEvent(changeEvent);

    await waitFor(() => {
      expect(screen.getByText(/veuillez sélectionner un fichier csv/i)).toBeInTheDocument();
    });
  });

  it('parses CSV and shows preview', async () => {
    renderWithProviders(<BulkInvitationModal {...defaultProps} />);

    const csvContent = `email,prenom,nom,type_liste
jean@example.com,Jean,Dupont,standard
marie@example.com,Marie,Martin,list_1000`;
    const file = new File([csvContent], 'invitations.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/parcourir/i, { selector: 'input' }) as HTMLInputElement;

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('jean@example.com')).toBeInTheDocument();
    });

    expect(screen.getByText('marie@example.com')).toBeInTheDocument();
    expect(screen.getByText('2 valides')).toBeInTheDocument();
  });

  it('shows validation errors for invalid emails', async () => {
    renderWithProviders(<BulkInvitationModal {...defaultProps} />);

    const csvContent = `email,prenom,nom
valid@example.com,Jean,Dupont
invalid-email,Marie,Martin`;
    const file = new File([csvContent], 'invitations.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/parcourir/i, { selector: 'input' }) as HTMLInputElement;

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('1 valide')).toBeInTheDocument();
    });

    expect(screen.getByText('1 erreur')).toBeInTheDocument();
    expect(screen.getByText(/email invalide/i)).toBeInTheDocument();
  });

  it('sends valid invitations on submit', async () => {
    vi.mocked(invitationsApi.createBulkInvitations).mockResolvedValue({
      total: 2,
      created: 2,
      duplicates: 0,
      errors: [],
    });

    renderWithProviders(<BulkInvitationModal {...defaultProps} />);

    const csvContent = `email,prenom,nom
jean@example.com,Jean,Dupont
marie@example.com,Marie,Martin`;
    const file = new File([csvContent], 'invitations.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/parcourir/i, { selector: 'input' }) as HTMLInputElement;

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('Envoyer 2 invitations')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Envoyer 2 invitations'));

    await waitFor(() => {
      expect(invitationsApi.createBulkInvitations).toHaveBeenCalled();
      const calls = vi.mocked(invitationsApi.createBulkInvitations).mock.calls;
      expect(calls[0][0]).toEqual([
        { email: 'jean@example.com', firstName: 'Jean', lastName: 'Dupont', listType: 'standard' },
        { email: 'marie@example.com', firstName: 'Marie', lastName: 'Martin', listType: 'standard' },
      ]);
    });
  });

  it('shows result summary after bulk creation', async () => {
    vi.mocked(invitationsApi.createBulkInvitations).mockResolvedValue({
      total: 3,
      created: 2,
      duplicates: 1,
      errors: [],
    });

    renderWithProviders(<BulkInvitationModal {...defaultProps} />);

    const csvContent = `email,prenom,nom
a@example.com,A,A
b@example.com,B,B
c@example.com,C,C`;
    const file = new File([csvContent], 'invitations.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/parcourir/i, { selector: 'input' }) as HTMLInputElement;

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('Envoyer 3 invitations')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Envoyer 3 invitations'));

    await waitFor(() => {
      expect(screen.getByText('Import terminé !')).toBeInTheDocument();
    });

    expect(screen.getByText('3')).toBeInTheDocument(); // Total
    expect(screen.getByText('2')).toBeInTheDocument(); // Created
    expect(screen.getByText('1')).toBeInTheDocument(); // Duplicates
  });

  it('allows changing file', async () => {
    renderWithProviders(<BulkInvitationModal {...defaultProps} />);

    const csvContent = `email,prenom,nom
jean@example.com,Jean,Dupont`;
    const file = new File([csvContent], 'invitations.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/parcourir/i, { selector: 'input' }) as HTMLInputElement;

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('jean@example.com')).toBeInTheDocument();
    });

    // Click "change file" button
    await userEvent.click(screen.getByText('Changer de fichier'));

    // Should return to upload step
    await waitFor(() => {
      expect(screen.getByText(/glissez-déposez/i)).toBeInTheDocument();
    });
  });

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn();
    renderWithProviders(<BulkInvitationModal isOpen={true} onClose={onClose} />);

    await userEvent.click(screen.getByText('Annuler'));

    expect(onClose).toHaveBeenCalled();
  });

  it('handles empty CSV file', async () => {
    renderWithProviders(<BulkInvitationModal {...defaultProps} />);

    const csvContent = `email,prenom,nom`;
    const file = new File([csvContent], 'empty.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/parcourir/i, { selector: 'input' }) as HTMLInputElement;

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/le fichier est vide/i)).toBeInTheDocument();
    });
  });
});
