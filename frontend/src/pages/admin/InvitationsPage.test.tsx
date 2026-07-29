import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { InvitationsPage } from './InvitationsPage';
import { invitationsApi } from '@/api';

// Mock the invitations API
vi.mock('@/api', () => ({
  invitationsApi: {
    getInvitations: vi.fn(),
    resendInvitation: vi.fn(),
    deleteInvitation: vi.fn(),
    bulkDeleteInvitations: vi.fn(),
    bulkResendInvitations: vi.fn(),
  },
}));

// The page renders every invitation twice (mobile card + desktop table row),
// so row-level queries are scoped to the desktop table.
const getTable = () => screen.getByRole('table');
const getTableCheckboxes = () => within(getTable()).getAllByRole('checkbox');

const mockInvitations = [
  {
    id: '1',
    email: 'pending@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    status: 'pending',
    createdAt: '2024-01-15T10:00:00Z',
    expiresAt: '2024-01-22T10:00:00Z',
    usedAt: null,
  },
  {
    id: '2',
    email: 'activated@example.com',
    firstName: 'Marie',
    lastName: 'Martin',
    status: 'activated',
    createdAt: '2024-01-10T10:00:00Z',
    expiresAt: '2024-01-17T10:00:00Z',
    usedAt: '2024-01-12T14:30:00Z',
  },
  {
    id: '3',
    email: 'expired@example.com',
    firstName: null,
    lastName: null,
    status: 'expired',
    createdAt: '2024-01-01T10:00:00Z',
    expiresAt: '2024-01-08T10:00:00Z',
    usedAt: null,
  },
];

describe('InvitationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    vi.mocked(invitationsApi.getInvitations).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<InvitationsPage />);

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('displays invitations in table', async () => {
    vi.mocked(invitationsApi.getInvitations).mockResolvedValue(mockInvitations);

    renderWithProviders(<InvitationsPage />);

    await waitFor(() => {
      expect(getTable()).toBeInTheDocument();
    });

    // Assert on the desktop table, since each row is also rendered as a mobile card
    const table = within(getTable());
    expect(table.getByText('pending@example.com')).toBeInTheDocument();
    expect(table.getByText('activated@example.com')).toBeInTheDocument();
    expect(table.getByText('expired@example.com')).toBeInTheDocument();
    expect(table.getByText('Jean Dupont')).toBeInTheDocument();
    expect(table.getByText('Marie Martin')).toBeInTheDocument();
  });

  it('displays statistics cards', async () => {
    vi.mocked(invitationsApi.getInvitations).mockResolvedValue(mockInvitations);

    renderWithProviders(<InvitationsPage />);

    await waitFor(() => {
      // Total stat card shows 3
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    // Check for stat labels using getAllByText for labels that appear multiple times
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getAllByText('En attente').length).toBeGreaterThan(0);
    expect(screen.getByText('Activés')).toBeInTheDocument();
    // "Expirés" appears in both stat card and filter dropdown
    expect(screen.getAllByText('Expirés').length).toBeGreaterThan(0);
  });

  it('shows status badges with correct labels', async () => {
    vi.mocked(invitationsApi.getInvitations).mockResolvedValue(mockInvitations);

    renderWithProviders(<InvitationsPage />);

    // Wait for data to load (table to appear)
    await waitFor(() => {
      expect(getTable()).toBeInTheDocument();
    });

    // Check status badges exist in table
    const table = within(getTable());
    expect(table.getByText('En attente')).toBeInTheDocument();
    expect(table.getByText('Activé')).toBeInTheDocument();
    expect(table.getByText('Expiré')).toBeInTheDocument();
  });

  it('shows resend button for pending invitations', async () => {
    vi.mocked(invitationsApi.getInvitations).mockResolvedValue(mockInvitations);

    renderWithProviders(<InvitationsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Relancer').length).toBeGreaterThan(0);
    });
  });

  it('calls onCreateClick when "Nouvelle invitation" is clicked', async () => {
    vi.mocked(invitationsApi.getInvitations).mockResolvedValue([]);
    const onCreateClick = vi.fn();

    renderWithProviders(<InvitationsPage onCreateClick={onCreateClick} />);

    await waitFor(() => {
      expect(screen.getByText('Nouvelle invitation')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Nouvelle invitation'));

    expect(onCreateClick).toHaveBeenCalled();
  });

  it('calls onBulkCreateClick when "Invitations en masse" is clicked', async () => {
    vi.mocked(invitationsApi.getInvitations).mockResolvedValue([]);
    const onBulkCreateClick = vi.fn();

    renderWithProviders(<InvitationsPage onBulkCreateClick={onBulkCreateClick} />);

    await waitFor(() => {
      expect(screen.getByText('Invitations en masse')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Invitations en masse'));

    expect(onBulkCreateClick).toHaveBeenCalled();
  });

  it('shows empty state when no invitations', async () => {
    vi.mocked(invitationsApi.getInvitations).mockResolvedValue([]);

    renderWithProviders(<InvitationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Aucune invitation trouvée.')).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    vi.mocked(invitationsApi.getInvitations).mockRejectedValue(new Error('API Error'));

    renderWithProviders(<InvitationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/erreur lors du chargement/i)).toBeInTheDocument();
    });
  });

  it('filters invitations by status', async () => {
    vi.mocked(invitationsApi.getInvitations).mockResolvedValue(mockInvitations);

    renderWithProviders(<InvitationsPage />);

    await waitFor(() => {
      expect(getTable()).toBeInTheDocument();
    });

    // Change filter to pending
    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, 'pending');

    // API should be called with filter
    await waitFor(() => {
      expect(invitationsApi.getInvitations).toHaveBeenCalledWith('pending');
    });
  });

  describe('Selection and deletion', () => {
    it('shows checkboxes for each invitation', async () => {
      vi.mocked(invitationsApi.getInvitations).mockResolvedValue(mockInvitations);

      renderWithProviders(<InvitationsPage />);

      await waitFor(() => {
        expect(getTable()).toBeInTheDocument();
      });

      // Should have checkboxes in the table (1 header + 3 rows)
      expect(getTableCheckboxes().length).toBe(4);
    });

    it('selects individual invitation when checkbox clicked', async () => {
      vi.mocked(invitationsApi.getInvitations).mockResolvedValue(mockInvitations);

      renderWithProviders(<InvitationsPage />);

      await waitFor(() => {
        expect(getTable()).toBeInTheDocument();
      });

      // Click on first row checkbox (index 1, since 0 is header)
      await userEvent.click(getTableCheckboxes()[1]);

      // Selection bar should appear
      expect(screen.getByText('1 invitation sélectionnée')).toBeInTheDocument();
    });

    it('selects all invitations when header checkbox clicked', async () => {
      vi.mocked(invitationsApi.getInvitations).mockResolvedValue(mockInvitations);

      renderWithProviders(<InvitationsPage />);

      await waitFor(() => {
        expect(getTable()).toBeInTheDocument();
      });

      // Click header checkbox
      await userEvent.click(getTableCheckboxes()[0]);

      // Selection bar should show all selected
      expect(screen.getByText('3 invitations sélectionnées')).toBeInTheDocument();
    });

    it('shows selection bar with count when items selected', async () => {
      vi.mocked(invitationsApi.getInvitations).mockResolvedValue(mockInvitations);

      renderWithProviders(<InvitationsPage />);

      await waitFor(() => {
        expect(getTable()).toBeInTheDocument();
      });

      // Select two items
      const checkboxes = getTableCheckboxes();
      await userEvent.click(checkboxes[1]);
      await userEvent.click(checkboxes[2]);

      // Selection bar should show count
      expect(screen.getByText('2 invitations sélectionnées')).toBeInTheDocument();
      expect(screen.getByText('Supprimer la sélection')).toBeInTheDocument();
    });

    it('clears selection when deselect button clicked', async () => {
      vi.mocked(invitationsApi.getInvitations).mockResolvedValue(mockInvitations);

      renderWithProviders(<InvitationsPage />);

      await waitFor(() => {
        expect(getTable()).toBeInTheDocument();
      });

      // Select an item
      await userEvent.click(getTableCheckboxes()[1]);

      // Click deselect
      await userEvent.click(screen.getByText('Désélectionner'));

      // Selection bar should disappear
      expect(screen.queryByText(/sélectionnée/)).not.toBeInTheDocument();
    });

    it('shows delete confirmation modal when delete button clicked', async () => {
      vi.mocked(invitationsApi.getInvitations).mockResolvedValue(mockInvitations);

      renderWithProviders(<InvitationsPage />);

      await waitFor(() => {
        expect(getTable()).toBeInTheDocument();
      });

      // Select items
      await userEvent.click(getTableCheckboxes()[0]); // Select all

      // Click bulk delete
      await userEvent.click(screen.getByText('Supprimer la sélection'));

      // Modal should appear
      expect(screen.getByText('Confirmer la suppression en masse')).toBeInTheDocument();
    });

    it('calls bulkDeleteInvitations API when confirmed', async () => {
      vi.mocked(invitationsApi.getInvitations).mockResolvedValue(mockInvitations);
      vi.mocked(invitationsApi.bulkDeleteInvitations).mockResolvedValue({
        total: 3,
        deleted: 3,
        notFound: 0,
      });

      renderWithProviders(<InvitationsPage />);

      await waitFor(() => {
        expect(getTable()).toBeInTheDocument();
      });

      // Select all
      await userEvent.click(getTableCheckboxes()[0]);

      // Open modal and confirm
      await userEvent.click(screen.getByText('Supprimer la sélection'));
      await userEvent.click(screen.getByText('Supprimer (3)'));

      await waitFor(() => {
        expect(invitationsApi.bulkDeleteInvitations).toHaveBeenCalled();
        const calls = vi.mocked(invitationsApi.bulkDeleteInvitations).mock.calls;
        expect(calls[0][0]).toEqual(['1', '2', '3']);
      });
    });

    it('closes modal when cancel clicked', async () => {
      vi.mocked(invitationsApi.getInvitations).mockResolvedValue(mockInvitations);

      renderWithProviders(<InvitationsPage />);

      await waitFor(() => {
        expect(getTable()).toBeInTheDocument();
      });

      // Select and open modal
      await userEvent.click(getTableCheckboxes()[1]);
      await userEvent.click(screen.getByText('Supprimer la sélection'));

      // Click cancel
      await userEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', { name: 'Annuler' })
      );

      // Modal should close
      expect(screen.queryByText('Confirmer la suppression en masse')).not.toBeInTheDocument();
    });

    it('shows success message after bulk delete', async () => {
      vi.mocked(invitationsApi.getInvitations).mockResolvedValue(mockInvitations);
      vi.mocked(invitationsApi.bulkDeleteInvitations).mockResolvedValue({
        total: 2,
        deleted: 2,
        notFound: 0,
      });

      renderWithProviders(<InvitationsPage />);

      await waitFor(() => {
        expect(getTable()).toBeInTheDocument();
      });

      // Select two items and delete
      const checkboxes = getTableCheckboxes();
      await userEvent.click(checkboxes[1]);
      await userEvent.click(checkboxes[2]);
      await userEvent.click(screen.getByText('Supprimer la sélection'));
      await userEvent.click(screen.getByText('Supprimer (2)'));

      await waitFor(() => {
        expect(screen.getByText(/2 invitations supprimées avec succès/)).toBeInTheDocument();
      });
    });
  });

  describe('Individual deletion', () => {
    it('shows delete button for each invitation', async () => {
      vi.mocked(invitationsApi.getInvitations).mockResolvedValue(mockInvitations);

      renderWithProviders(<InvitationsPage />);

      await waitFor(() => {
        expect(getTable()).toBeInTheDocument();
      });

      // Should have one delete button per row in the table
      const deleteButtons = within(getTable()).getAllByRole('button', { name: 'Supprimer' });
      expect(deleteButtons.length).toBe(3);
    });

    it('shows confirmation modal for individual delete', async () => {
      vi.mocked(invitationsApi.getInvitations).mockResolvedValue(mockInvitations);

      renderWithProviders(<InvitationsPage />);

      await waitFor(() => {
        expect(getTable()).toBeInTheDocument();
      });

      // Click delete on first invitation
      const deleteButtons = within(getTable()).getAllByRole('button', { name: 'Supprimer' });
      await userEvent.click(deleteButtons[0]);

      // Modal should appear and name the targeted invitation
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = within(screen.getByRole('dialog'));
      expect(modal.getByText('Confirmer la suppression')).toBeInTheDocument();
      expect(modal.getByText('pending@example.com')).toBeInTheDocument();
    });

    it('calls deleteInvitation API when confirmed', async () => {
      vi.mocked(invitationsApi.getInvitations).mockResolvedValue(mockInvitations);
      vi.mocked(invitationsApi.deleteInvitation).mockResolvedValue(undefined);

      renderWithProviders(<InvitationsPage />);

      await waitFor(() => {
        expect(getTable()).toBeInTheDocument();
      });

      // Click delete on first row
      const deleteButtons = within(getTable()).getAllByRole('button', { name: 'Supprimer' });
      await userEvent.click(deleteButtons[0]);

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click the confirm button inside the modal
      const confirmButton = within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Supprimer',
      });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(invitationsApi.deleteInvitation).toHaveBeenCalled();
        const calls = vi.mocked(invitationsApi.deleteInvitation).mock.calls;
        expect(calls[0][0]).toBe('1');
      });
    });

    it('shows different message for activated invitation deletion', async () => {
      vi.mocked(invitationsApi.getInvitations).mockResolvedValue(mockInvitations);

      renderWithProviders(<InvitationsPage />);

      await waitFor(() => {
        expect(getTable()).toBeInTheDocument();
      });

      // Click delete on activated invitation (second row)
      const deleteButtons = within(getTable()).getAllByRole('button', { name: 'Supprimer' });
      await userEvent.click(deleteButtons[1]);

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Should show different message for activated users
      const modal = within(screen.getByRole('dialog'));
      expect(modal.getByText('Confirmer la suppression')).toBeInTheDocument();
      expect(modal.getByText(/compte sera conservé/)).toBeInTheDocument();
    });
  });
});
