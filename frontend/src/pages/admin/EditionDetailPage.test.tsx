import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { EditionDetailPage } from './EditionDetailPage';
import { editionsApi, depositSlotsApi, ApiException } from '@/api';
import type { Edition, EditionStatus } from '@/types';

// Mock the APIs
vi.mock('@/api', () => ({
  editionsApi: {
    getEdition: vi.fn(),
    updateEdition: vi.fn(),
    updateEditionStatus: vi.fn(),
  },
  depositSlotsApi: {
    getDepositSlots: vi.fn(),
  },
  ApiException: class ApiException extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

// Mock AuthProvider
vi.mock('@/contexts', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-edition-id' }),
    useNavigate: () => mockNavigate,
  };
});

const mockEdition: Edition = {
  id: 'test-edition-id',
  name: 'Bourse Printemps 2025',
  description: 'Test description',
  location: 'Salle des fêtes',
  status: 'draft' as EditionStatus,
  startDatetime: '2025-03-15T09:00:00Z',
  endDatetime: '2025-03-16T18:00:00Z',
  declarationDeadline: null,
  depositStartDatetime: null,
  depositEndDatetime: null,
  saleStartDatetime: null,
  saleEndDatetime: null,
  retrievalStartDatetime: null,
  retrievalEndDatetime: null,
  commissionRate: 0.2,
  createdAt: '2025-01-15T10:00:00Z',
  createdBy: null,
};

const mockConfiguredEdition: Edition = {
  ...mockEdition,
  status: 'configured' as EditionStatus,
  declarationDeadline: '2025-03-10T23:59:00Z',
  depositStartDatetime: '2025-03-12T09:00:00Z',
  depositEndDatetime: '2025-03-14T18:00:00Z',
  saleStartDatetime: '2025-03-15T09:00:00Z',
  saleEndDatetime: '2025-03-16T17:00:00Z',
  retrievalStartDatetime: '2025-03-16T17:00:00Z',
  retrievalEndDatetime: '2025-03-16T19:00:00Z',
};

const mockClosedEdition: Edition = {
  ...mockConfiguredEdition,
  status: 'closed' as EditionStatus,
};

describe('EditionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(depositSlotsApi.getDepositSlots).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 50 });
  });

  it('shows loading state initially', async () => {
    vi.mocked(editionsApi.getEdition).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockEdition), 100))
    );

    renderWithProviders(<EditionDetailPage />);

    // Loading skeleton should be present (pulse animation div)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays edition details after loading', async () => {
    vi.mocked(editionsApi.getEdition).mockResolvedValue(mockEdition);

    renderWithProviders(<EditionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Bourse Printemps 2025')).toBeInTheDocument();
    });

    expect(screen.getByText('Brouillon')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Salle des fêtes')).toBeInTheDocument();
  });

  it('shows error message when edition not found', async () => {
    vi.mocked(editionsApi.getEdition).mockRejectedValue(new Error('Not found'));

    renderWithProviders(<EditionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Édition introuvable/i)).toBeInTheDocument();
    });
  });

  it('displays back link to editions list', async () => {
    vi.mocked(editionsApi.getEdition).mockResolvedValue(mockEdition);

    renderWithProviders(<EditionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Retour aux éditions/i)).toBeInTheDocument();
    });
  });

  it('shows status badge with correct styling', async () => {
    vi.mocked(editionsApi.getEdition).mockResolvedValue(mockEdition);

    renderWithProviders(<EditionDetailPage />);

    await waitFor(() => {
      const statusBadge = screen.getByText('Brouillon');
      expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800');
    });
  });

  it('shows configured status for configured edition', async () => {
    vi.mocked(editionsApi.getEdition).mockResolvedValue(mockConfiguredEdition);

    renderWithProviders(<EditionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Configuré')).toBeInTheDocument();
    });
  });

  it('disables form for closed editions', async () => {
    vi.mocked(editionsApi.getEdition).mockResolvedValue(mockClosedEdition);

    renderWithProviders(<EditionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/ne peut plus être modifiée/i)).toBeInTheDocument();
    });

    // Submit button should be disabled
    expect(screen.getByText(/Enregistrer les modifications/i)).toBeDisabled();
  });

  it('validates required fields - name cannot be empty', async () => {
    vi.mocked(editionsApi.getEdition).mockResolvedValue(mockEdition);

    renderWithProviders(<EditionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Bourse Printemps 2025')).toBeInTheDocument();
    });

    // Clear the name field and add only spaces
    const nameInput = screen.getByPlaceholderText('Bourse Printemps 2025');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, '   '); // Only whitespace

    // Submit - HTML required won't trigger because input has value (spaces)
    await userEvent.click(screen.getByText(/Enregistrer les modifications/i));

    await waitFor(() => {
      expect(screen.getByText(/nom de l'édition est requis/i)).toBeInTheDocument();
    });

    expect(editionsApi.updateEdition).not.toHaveBeenCalled();
  });

  it('validates commission rate between 0 and 100', async () => {
    vi.mocked(editionsApi.getEdition).mockResolvedValue(mockEdition);

    renderWithProviders(<EditionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Bourse Printemps 2025')).toBeInTheDocument();
    });

    // Clear commission rate - empty string is invalid
    const commissionInput = screen.getByLabelText(/Taux de commission/i);
    await userEvent.clear(commissionInput);

    // Submit
    await userEvent.click(screen.getByText(/Enregistrer les modifications/i));

    await waitFor(() => {
      expect(screen.getByText(/commission doit être entre 0 et 100/i)).toBeInTheDocument();
    });
  });

  it('validates chronological order of configuration dates', async () => {
    vi.mocked(editionsApi.getEdition).mockResolvedValue(mockEdition);

    renderWithProviders(<EditionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Bourse Printemps 2025')).toBeInTheDocument();
    });

    // Fill all configuration dates with invalid order (deposit end before deposit start)
    const allInputs = document.querySelectorAll('input[type="datetime-local"]');
    // Order: startDatetime, endDatetime, declarationDeadline, depositStart, depositEnd, saleStart, saleEnd, retrievalStart, retrievalEnd
    const declarationInput = allInputs[2] as HTMLInputElement;
    const depositStartInput = allInputs[3] as HTMLInputElement;
    const depositEndInput = allInputs[4] as HTMLInputElement;
    const saleStartInput = allInputs[5] as HTMLInputElement;
    const saleEndInput = allInputs[6] as HTMLInputElement;
    const retrievalStartInput = allInputs[7] as HTMLInputElement;
    const retrievalEndInput = allInputs[8] as HTMLInputElement;

    await userEvent.type(declarationInput, '2025-03-01T12:00');
    await userEvent.type(depositStartInput, '2025-03-12T09:00');
    await userEvent.type(depositEndInput, '2025-03-11T18:00'); // Invalid: before start
    await userEvent.type(saleStartInput, '2025-03-15T09:00');
    await userEvent.type(saleEndInput, '2025-03-16T17:00');
    await userEvent.type(retrievalStartInput, '2025-03-16T17:00');
    await userEvent.type(retrievalEndInput, '2025-03-16T19:00');

    // Submit
    await userEvent.click(screen.getByText(/Enregistrer les modifications/i));

    await waitFor(() => {
      expect(screen.getByText(/fin du dépôt doit être après le début/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    vi.mocked(editionsApi.getEdition).mockResolvedValue(mockEdition);
    vi.mocked(editionsApi.updateEdition).mockResolvedValue(mockEdition);

    renderWithProviders(<EditionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Bourse Printemps 2025')).toBeInTheDocument();
    });

    // Update name
    const nameInput = screen.getByPlaceholderText('Bourse Printemps 2025');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Edition Name');

    // Submit
    await userEvent.click(screen.getByText(/Enregistrer les modifications/i));

    await waitFor(() => {
      expect(editionsApi.updateEdition).toHaveBeenCalled();
    });

    // Verify API was called with updated name
    const callArg = vi.mocked(editionsApi.updateEdition).mock.calls[0][1];
    expect(callArg.name).toBe('Updated Edition Name');
  });

  it('shows success message after update', async () => {
    vi.mocked(editionsApi.getEdition).mockResolvedValue(mockEdition);
    vi.mocked(editionsApi.updateEdition).mockResolvedValue(mockEdition);

    renderWithProviders(<EditionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Bourse Printemps 2025')).toBeInTheDocument();
    });

    // Submit without changes
    await userEvent.click(screen.getByText(/Enregistrer les modifications/i));

    await waitFor(() => {
      expect(screen.getByText(/Modifications enregistrées/i)).toBeInTheDocument();
    });
  });

  it('shows error message on conflict (duplicate name)', async () => {
    vi.mocked(editionsApi.getEdition).mockResolvedValue(mockEdition);
    vi.mocked(editionsApi.updateEdition).mockRejectedValue(new ApiException('Conflict', 409));

    renderWithProviders(<EditionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Bourse Printemps 2025')).toBeInTheDocument();
    });

    // Submit
    await userEvent.click(screen.getByText(/Enregistrer les modifications/i));

    await waitFor(() => {
      expect(screen.getByText(/existe déjà/i)).toBeInTheDocument();
    });
  });

  it('transitions to configured status when all dates set on draft edition', async () => {
    vi.mocked(editionsApi.getEdition).mockResolvedValue(mockEdition);
    vi.mocked(editionsApi.updateEdition).mockResolvedValue(mockConfiguredEdition);
    vi.mocked(editionsApi.updateEditionStatus).mockResolvedValue(mockConfiguredEdition);

    renderWithProviders(<EditionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Bourse Printemps 2025')).toBeInTheDocument();
    });

    // Fill all configuration dates
    const allInputs = document.querySelectorAll('input[type="datetime-local"]');
    const declarationInput = allInputs[2] as HTMLInputElement;
    const depositStartInput = allInputs[3] as HTMLInputElement;
    const depositEndInput = allInputs[4] as HTMLInputElement;
    const saleStartInput = allInputs[5] as HTMLInputElement;
    const saleEndInput = allInputs[6] as HTMLInputElement;
    const retrievalStartInput = allInputs[7] as HTMLInputElement;
    const retrievalEndInput = allInputs[8] as HTMLInputElement;

    await userEvent.type(declarationInput, '2025-03-01T12:00');
    await userEvent.type(depositStartInput, '2025-03-02T09:00');
    await userEvent.type(depositEndInput, '2025-03-03T18:00');
    await userEvent.type(saleStartInput, '2025-03-04T09:00');
    await userEvent.type(saleEndInput, '2025-03-05T17:00');
    await userEvent.type(retrievalStartInput, '2025-03-05T17:00');
    await userEvent.type(retrievalEndInput, '2025-03-05T19:00');

    // Submit
    await userEvent.click(screen.getByText(/Enregistrer les modifications/i));

    await waitFor(() => {
      expect(editionsApi.updateEditionStatus).toHaveBeenCalledWith('test-edition-id', 'configured');
    });
  });

  it('navigates back to editions list when cancel clicked', async () => {
    vi.mocked(editionsApi.getEdition).mockResolvedValue(mockEdition);

    renderWithProviders(<EditionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Bourse Printemps 2025')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Annuler'));

    expect(mockNavigate).toHaveBeenCalledWith('/editions');
  });

  it('displays deposit slots section', async () => {
    vi.mocked(editionsApi.getEdition).mockResolvedValue(mockEdition);

    renderWithProviders(<EditionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Créneaux de dépôt')).toBeInTheDocument();
    });
  });

  it('displays commission rate with correct value', async () => {
    vi.mocked(editionsApi.getEdition).mockResolvedValue(mockEdition);

    renderWithProviders(<EditionDetailPage />);

    await waitFor(() => {
      const commissionInput = screen.getByLabelText(/Taux de commission/i);
      expect(commissionInput).toHaveValue(20); // 0.2 * 100 = 20%
    });
  });
});
