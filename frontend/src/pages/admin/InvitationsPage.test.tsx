import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { InvitationsPage } from './InvitationsPage';
import { invitationsApi } from '@/api';

// Mock the invitations API
vi.mock('@/api', () => ({
  invitationsApi: {
    getInvitations: vi.fn(),
    resendInvitation: vi.fn(),
  },
}));

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
      expect(screen.getByText('pending@example.com')).toBeInTheDocument();
    });

    expect(screen.getByText('activated@example.com')).toBeInTheDocument();
    expect(screen.getByText('expired@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('Marie Martin')).toBeInTheDocument();
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
      expect(screen.getByText('pending@example.com')).toBeInTheDocument();
    });

    // Check status badges exist in table
    expect(screen.getByText('Activé')).toBeInTheDocument();
    expect(screen.getByText('Expiré')).toBeInTheDocument();
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
      expect(screen.getByText('pending@example.com')).toBeInTheDocument();
    });

    // Change filter to pending
    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, 'pending');

    // API should be called with filter
    await waitFor(() => {
      expect(invitationsApi.getInvitations).toHaveBeenCalledWith('pending');
    });
  });
});
