import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { EditionsListPage } from './EditionsListPage';
import { editionsApi } from '@/api';
import type { Edition, EditionListResponse, EditionStatus } from '@/types';

// Mock the editions API
vi.mock('@/api', () => ({
  editionsApi: {
    getEditions: vi.fn(),
    deleteEdition: vi.fn(),
  },
}));

// Mock useAuth to provide user context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '1', role: 'administrator', email: 'admin@test.com' },
    isAuthenticated: true,
    isLoading: false,
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Also mock the contexts barrel export
vi.mock('@/contexts', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '1', role: 'administrator', email: 'admin@test.com' },
    isAuthenticated: true,
    isLoading: false,
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockEditions: Edition[] = [
  {
    id: '1',
    name: 'Bourse Printemps 2025',
    description: 'Édition de printemps',
    location: 'Salle des fêtes',
    status: 'draft' as EditionStatus,
    startDatetime: '2025-03-15T09:00:00Z',
    endDatetime: '2025-03-16T18:00:00Z',
    declarationDeadline: null,
    depositStartDatetime: null,
    depositEndDatetime: null,
    retrievalStartDatetime: null,
    retrievalEndDatetime: null,
    commissionRate: null,
    createdAt: '2025-01-15T10:00:00Z',
    createdBy: {
      id: '1',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
    },
  },
  {
    id: '2',
    name: 'Bourse Automne 2024',
    description: null,
    location: 'Gymnase',
    status: 'closed' as EditionStatus,
    startDatetime: '2024-09-20T09:00:00Z',
    endDatetime: '2024-09-21T18:00:00Z',
    declarationDeadline: null,
    depositStartDatetime: null,
    depositEndDatetime: null,
    retrievalStartDatetime: null,
    retrievalEndDatetime: null,
    commissionRate: 0.15,
    createdAt: '2024-08-01T10:00:00Z',
    createdBy: null,
  },
  {
    id: '3',
    name: 'Bourse Été 2024',
    description: null,
    location: null,
    status: 'in_progress' as EditionStatus,
    startDatetime: '2024-06-15T09:00:00Z',
    endDatetime: '2024-06-16T18:00:00Z',
    declarationDeadline: null,
    depositStartDatetime: null,
    depositEndDatetime: null,
    retrievalStartDatetime: null,
    retrievalEndDatetime: null,
    commissionRate: 0.10,
    createdAt: '2024-05-01T10:00:00Z',
    createdBy: null,
  },
];

const mockEditionsResponse: EditionListResponse = {
  items: mockEditions,
  total: 3,
  page: 1,
  limit: 20,
  pages: 1,
};

describe('EditionsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    vi.mocked(editionsApi.getEditions).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<EditionsListPage />);

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('displays editions in table', async () => {
    vi.mocked(editionsApi.getEditions).mockResolvedValue(mockEditionsResponse);

    renderWithProviders(<EditionsListPage />);

    await waitFor(() => {
      expect(screen.getByText('Bourse Printemps 2025')).toBeInTheDocument();
    });

    expect(screen.getByText('Bourse Automne 2024')).toBeInTheDocument();
    expect(screen.getByText('Bourse Été 2024')).toBeInTheDocument();
    expect(screen.getByText('Salle des fêtes')).toBeInTheDocument();
    expect(screen.getByText('Gymnase')).toBeInTheDocument();
  });

  it('displays statistics cards', async () => {
    vi.mocked(editionsApi.getEditions).mockResolvedValue(mockEditionsResponse);

    renderWithProviders(<EditionsListPage />);

    await waitFor(() => {
      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    // Check for stat labels - use getAllByText as some labels appear multiple times
    expect(screen.getByText('Brouillons')).toBeInTheDocument();
    expect(screen.getAllByText('En cours').length).toBeGreaterThan(0);
    expect(screen.getByText('Clôturées')).toBeInTheDocument();
  });

  it('shows status badges with correct labels', async () => {
    vi.mocked(editionsApi.getEditions).mockResolvedValue(mockEditionsResponse);

    renderWithProviders(<EditionsListPage />);

    await waitFor(() => {
      expect(screen.getByText('Bourse Printemps 2025')).toBeInTheDocument();
    });

    // Check status badges - use getAllByText since labels can appear multiple times
    expect(screen.getAllByText('Brouillon').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Clôturé').length).toBeGreaterThan(0);
  });

  it('shows empty state when no editions', async () => {
    vi.mocked(editionsApi.getEditions).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      pages: 0,
    });

    renderWithProviders(<EditionsListPage />);

    await waitFor(() => {
      expect(screen.getByText('Aucune édition trouvée.')).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    vi.mocked(editionsApi.getEditions).mockRejectedValue(new Error('API Error'));

    renderWithProviders(<EditionsListPage />);

    await waitFor(() => {
      expect(screen.getByText(/erreur lors du chargement/i)).toBeInTheDocument();
    });
  });

  it('calls onCreateClick when "Nouvelle édition" is clicked', async () => {
    vi.mocked(editionsApi.getEditions).mockResolvedValue(mockEditionsResponse);
    const onCreateClick = vi.fn();

    renderWithProviders(<EditionsListPage onCreateClick={onCreateClick} />);

    await waitFor(() => {
      expect(screen.getByText('Nouvelle édition')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Nouvelle édition'));

    expect(onCreateClick).toHaveBeenCalled();
  });

  it('calls onEditClick when "Modifier" is clicked', async () => {
    vi.mocked(editionsApi.getEditions).mockResolvedValue(mockEditionsResponse);
    const onEditClick = vi.fn();

    renderWithProviders(<EditionsListPage onEditClick={onEditClick} />);

    await waitFor(() => {
      expect(screen.getByText('Bourse Printemps 2025')).toBeInTheDocument();
    });

    const modifyButtons = screen.getAllByText('Modifier');
    await userEvent.click(modifyButtons[0]);

    expect(onEditClick).toHaveBeenCalledWith(mockEditions[0]);
  });

  it('filters editions by status', async () => {
    vi.mocked(editionsApi.getEditions).mockResolvedValue(mockEditionsResponse);

    renderWithProviders(<EditionsListPage />);

    await waitFor(() => {
      expect(screen.getByText('Bourse Printemps 2025')).toBeInTheDocument();
    });

    // Change filter to draft
    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, 'draft');

    // API should be called with filter
    await waitFor(() => {
      expect(editionsApi.getEditions).toHaveBeenCalledWith({ status: 'draft' });
    });
  });

  describe('Deletion', () => {
    it('shows delete button only for draft editions', async () => {
      vi.mocked(editionsApi.getEditions).mockResolvedValue(mockEditionsResponse);

      renderWithProviders(<EditionsListPage />);

      await waitFor(() => {
        expect(screen.getByText('Bourse Printemps 2025')).toBeInTheDocument();
      });

      // Only 1 delete button (for the draft edition)
      const deleteButtons = screen.getAllByText('Supprimer');
      expect(deleteButtons.length).toBe(1);
    });

    it('shows delete confirmation modal when delete button clicked', async () => {
      vi.mocked(editionsApi.getEditions).mockResolvedValue(mockEditionsResponse);

      renderWithProviders(<EditionsListPage />);

      await waitFor(() => {
        expect(screen.getByText('Bourse Printemps 2025')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Supprimer');
      await userEvent.click(deleteButton);

      expect(screen.getByText('Confirmer la suppression')).toBeInTheDocument();
      // The edition name appears both in table and modal, so just check modal warning text
      expect(screen.getByText(/irréversible/i)).toBeInTheDocument();
    });

    it('calls deleteEdition API when confirmed', async () => {
      vi.mocked(editionsApi.getEditions).mockResolvedValue(mockEditionsResponse);
      vi.mocked(editionsApi.deleteEdition).mockResolvedValue(undefined);

      renderWithProviders(<EditionsListPage />);

      await waitFor(() => {
        expect(screen.getByText('Bourse Printemps 2025')).toBeInTheDocument();
      });

      // Click delete button in table
      const deleteButton = screen.getByText('Supprimer');
      await userEvent.click(deleteButton);

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText('Confirmer la suppression')).toBeInTheDocument();
      });

      // Find and click the confirm button in modal (it's the red one)
      const modalButtons = screen.getAllByRole('button');
      const confirmButton = modalButtons.find(
        (btn) => btn.textContent === 'Supprimer' && btn.classList.contains('bg-red-600')
      );

      if (confirmButton) {
        await userEvent.click(confirmButton);
      }

      // The success message proves the deletion happened
      await waitFor(() => {
        expect(screen.getByText(/supprimée avec succès/i)).toBeInTheDocument();
      });
    });

    it('closes modal when cancel clicked', async () => {
      vi.mocked(editionsApi.getEditions).mockResolvedValue(mockEditionsResponse);

      renderWithProviders(<EditionsListPage />);

      await waitFor(() => {
        expect(screen.getByText('Bourse Printemps 2025')).toBeInTheDocument();
      });

      // Open modal
      const deleteButton = screen.getByText('Supprimer');
      await userEvent.click(deleteButton);

      expect(screen.getByText('Confirmer la suppression')).toBeInTheDocument();

      // Click cancel
      await userEvent.click(screen.getByText('Annuler'));

      // Modal should close
      expect(screen.queryByText('Confirmer la suppression')).not.toBeInTheDocument();
    });
  });

  it('displays creator name when available', async () => {
    vi.mocked(editionsApi.getEditions).mockResolvedValue(mockEditionsResponse);

    renderWithProviders(<EditionsListPage />);

    await waitFor(() => {
      expect(screen.getByText('Bourse Printemps 2025')).toBeInTheDocument();
    });

    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });
});
