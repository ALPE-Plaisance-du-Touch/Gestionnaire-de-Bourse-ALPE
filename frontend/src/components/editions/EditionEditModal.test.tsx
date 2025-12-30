import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { EditionEditModal } from './EditionEditModal';
import { editionsApi, ApiException } from '@/api';
import type { Edition, EditionStatus } from '@/types';

// Mock the editions API
vi.mock('@/api', () => ({
  editionsApi: {
    updateEdition: vi.fn(),
    updateEditionStatus: vi.fn(),
  },
  ApiException: class ApiException extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

// Mock AuthProvider to avoid issues with test-utils wrapper
vi.mock('@/contexts', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockEditionDraft: Edition = {
  id: '1',
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
  commissionRate: null,
  createdAt: '2025-01-15T10:00:00Z',
  createdBy: null,
};

const mockEditionConfigured: Edition = {
  ...mockEditionDraft,
  id: '2',
  status: 'configured' as EditionStatus,
  declarationDeadline: '2025-03-10T18:00:00Z',
  depositStartDatetime: '2025-03-12T09:00:00Z',
  depositEndDatetime: '2025-03-13T18:00:00Z',
  saleStartDatetime: '2025-03-14T09:00:00Z',
  saleEndDatetime: '2025-03-15T18:00:00Z',
  retrievalStartDatetime: '2025-03-16T09:00:00Z',
  retrievalEndDatetime: '2025-03-16T18:00:00Z',
  commissionRate: 0.20,
};

const mockEditionClosed: Edition = {
  ...mockEditionDraft,
  id: '3',
  status: 'closed' as EditionStatus,
};

describe('EditionEditModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with edition data when open', () => {
    renderWithProviders(
      <EditionEditModal isOpen={true} onClose={mockOnClose} edition={mockEditionDraft} />
    );

    expect(screen.getByText(/Modifier : Bourse Printemps 2025/)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bourse Printemps 2025')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Salle des fêtes')).toBeInTheDocument();
  });

  it('does not render modal when closed', () => {
    renderWithProviders(
      <EditionEditModal isOpen={false} onClose={mockOnClose} edition={mockEditionDraft} />
    );

    expect(screen.queryByText(/Modifier :/)).not.toBeInTheDocument();
  });

  it('does not render modal when edition is null', () => {
    renderWithProviders(
      <EditionEditModal isOpen={true} onClose={mockOnClose} edition={null} />
    );

    expect(screen.queryByText(/Modifier :/)).not.toBeInTheDocument();
  });

  it('shows commission rate field with default value', () => {
    renderWithProviders(
      <EditionEditModal isOpen={true} onClose={mockOnClose} edition={mockEditionDraft} />
    );

    // Commission rate defaults to 20%
    const commissionInput = screen.getByDisplayValue('20');
    expect(commissionInput).toBeInTheDocument();
  });

  it('shows configured edition commission rate', () => {
    renderWithProviders(
      <EditionEditModal isOpen={true} onClose={mockOnClose} edition={mockEditionConfigured} />
    );

    // Commission rate should show 20 (from 0.20)
    const commissionInput = screen.getByDisplayValue('20');
    expect(commissionInput).toBeInTheDocument();
  });

  it('validates commission rate is required (not empty)', async () => {
    renderWithProviders(
      <EditionEditModal isOpen={true} onClose={mockOnClose} edition={mockEditionDraft} />
    );

    // Find commission input and clear it
    const commissionInput = screen.getByDisplayValue('20');
    await userEvent.clear(commissionInput);

    // Submit
    await userEvent.click(screen.getByText('Enregistrer'));

    // Error message should appear
    await waitFor(() => {
      expect(screen.getByText(/commission doit être entre 0 et 100/i)).toBeInTheDocument();
    });

    expect(editionsApi.updateEdition).not.toHaveBeenCalled();
  });

  it('validates chronological date order', async () => {
    renderWithProviders(
      <EditionEditModal isOpen={true} onClose={mockOnClose} edition={mockEditionDraft} />
    );

    // Fill all config dates with wrong order (retrieval before sale)
    const allDateInputs = document.querySelectorAll('input[type="datetime-local"]');

    // declaration deadline
    await userEvent.clear(allDateInputs[2] as HTMLInputElement);
    await userEvent.type(allDateInputs[2] as HTMLInputElement, '2025-03-10T18:00');

    // deposit start
    await userEvent.clear(allDateInputs[3] as HTMLInputElement);
    await userEvent.type(allDateInputs[3] as HTMLInputElement, '2025-03-12T09:00');

    // deposit end
    await userEvent.clear(allDateInputs[4] as HTMLInputElement);
    await userEvent.type(allDateInputs[4] as HTMLInputElement, '2025-03-13T18:00');

    // sale start
    await userEvent.clear(allDateInputs[5] as HTMLInputElement);
    await userEvent.type(allDateInputs[5] as HTMLInputElement, '2025-03-14T09:00');

    // sale end
    await userEvent.clear(allDateInputs[6] as HTMLInputElement);
    await userEvent.type(allDateInputs[6] as HTMLInputElement, '2025-03-16T18:00');

    // retrieval start - BEFORE sale end (error!)
    await userEvent.clear(allDateInputs[7] as HTMLInputElement);
    await userEvent.type(allDateInputs[7] as HTMLInputElement, '2025-03-14T09:00');

    // retrieval end
    await userEvent.clear(allDateInputs[8] as HTMLInputElement);
    await userEvent.type(allDateInputs[8] as HTMLInputElement, '2025-03-17T18:00');

    // Submit
    await userEvent.click(screen.getByText('Enregistrer'));

    // Error message should appear
    await waitFor(() => {
      expect(screen.getByText(/récupération doit être après/i)).toBeInTheDocument();
    });

    expect(editionsApi.updateEdition).not.toHaveBeenCalled();
  });

  it('submits update with valid data', async () => {
    vi.mocked(editionsApi.updateEdition).mockResolvedValue(mockEditionDraft);

    renderWithProviders(
      <EditionEditModal isOpen={true} onClose={mockOnClose} edition={mockEditionDraft} />
    );

    // Change the name
    const nameInput = screen.getByDisplayValue('Bourse Printemps 2025');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Bourse Automne 2025');

    // Submit
    await userEvent.click(screen.getByText('Enregistrer'));

    // Success message should appear
    await waitFor(() => {
      expect(screen.getByText(/Modifications enregistrées/i)).toBeInTheDocument();
    });

    expect(editionsApi.updateEdition).toHaveBeenCalled();
    const callArg = vi.mocked(editionsApi.updateEdition).mock.calls[0];
    expect(callArg[0]).toBe('1'); // edition id
    expect(callArg[1].name).toBe('Bourse Automne 2025');
  });

  it('transitions draft to configured when all dates are set', async () => {
    vi.mocked(editionsApi.updateEdition).mockResolvedValue(mockEditionDraft);
    vi.mocked(editionsApi.updateEditionStatus).mockResolvedValue({
      ...mockEditionDraft,
      status: 'configured',
    });

    renderWithProviders(
      <EditionEditModal isOpen={true} onClose={mockOnClose} edition={mockEditionDraft} />
    );

    // Fill all config dates with valid order
    const allDateInputs = document.querySelectorAll('input[type="datetime-local"]');

    // declaration deadline
    await userEvent.clear(allDateInputs[2] as HTMLInputElement);
    await userEvent.type(allDateInputs[2] as HTMLInputElement, '2025-03-10T18:00');

    // deposit start
    await userEvent.clear(allDateInputs[3] as HTMLInputElement);
    await userEvent.type(allDateInputs[3] as HTMLInputElement, '2025-03-12T09:00');

    // deposit end
    await userEvent.clear(allDateInputs[4] as HTMLInputElement);
    await userEvent.type(allDateInputs[4] as HTMLInputElement, '2025-03-13T18:00');

    // sale start
    await userEvent.clear(allDateInputs[5] as HTMLInputElement);
    await userEvent.type(allDateInputs[5] as HTMLInputElement, '2025-03-14T09:00');

    // sale end
    await userEvent.clear(allDateInputs[6] as HTMLInputElement);
    await userEvent.type(allDateInputs[6] as HTMLInputElement, '2025-03-15T18:00');

    // retrieval start
    await userEvent.clear(allDateInputs[7] as HTMLInputElement);
    await userEvent.type(allDateInputs[7] as HTMLInputElement, '2025-03-16T09:00');

    // retrieval end
    await userEvent.clear(allDateInputs[8] as HTMLInputElement);
    await userEvent.type(allDateInputs[8] as HTMLInputElement, '2025-03-16T18:00');

    // Submit
    await userEvent.click(screen.getByText('Enregistrer'));

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/Modifications enregistrées/i)).toBeInTheDocument();
    });

    // Both update and status change should have been called
    expect(editionsApi.updateEdition).toHaveBeenCalled();
    expect(editionsApi.updateEditionStatus).toHaveBeenCalledWith('1', 'configured');
  });

  it('shows warning for closed editions', () => {
    renderWithProviders(
      <EditionEditModal isOpen={true} onClose={mockOnClose} edition={mockEditionClosed} />
    );

    expect(screen.getByText(/clôturée et ne peut plus être modifiée/i)).toBeInTheDocument();
  });

  it('disables form fields for closed editions', () => {
    renderWithProviders(
      <EditionEditModal isOpen={true} onClose={mockOnClose} edition={mockEditionClosed} />
    );

    // Submit button should be disabled
    expect(screen.getByText('Enregistrer')).toBeDisabled();
  });

  it('shows error on duplicate name conflict', async () => {
    vi.mocked(editionsApi.updateEdition).mockRejectedValue(
      new ApiException('Conflict', 409)
    );

    renderWithProviders(
      <EditionEditModal isOpen={true} onClose={mockOnClose} edition={mockEditionDraft} />
    );

    // Change name to existing one
    const nameInput = screen.getByDisplayValue('Bourse Printemps 2025');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Existing Edition');

    // Submit
    await userEvent.click(screen.getByText('Enregistrer'));

    await waitFor(() => {
      expect(screen.getByText(/existe déjà/i)).toBeInTheDocument();
    });
  });

  it('calls onClose when cancel button clicked', async () => {
    renderWithProviders(
      <EditionEditModal isOpen={true} onClose={mockOnClose} edition={mockEditionDraft} />
    );

    await userEvent.click(screen.getByText('Annuler'));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when close button clicked after success', async () => {
    vi.mocked(editionsApi.updateEdition).mockResolvedValue(mockEditionDraft);

    renderWithProviders(
      <EditionEditModal isOpen={true} onClose={mockOnClose} edition={mockEditionDraft} />
    );

    // Submit without changes (still valid)
    await userEvent.click(screen.getByText('Enregistrer'));

    await waitFor(() => {
      expect(screen.getByText(/Modifications enregistrées/i)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Fermer'));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows current status information', () => {
    renderWithProviders(
      <EditionEditModal isOpen={true} onClose={mockOnClose} edition={mockEditionDraft} />
    );

    expect(screen.getByText(/Statut actuel/i)).toBeInTheDocument();
    expect(screen.getByText(/Brouillon/i)).toBeInTheDocument();
  });

  it('shows configured status information for configured edition', () => {
    renderWithProviders(
      <EditionEditModal isOpen={true} onClose={mockOnClose} edition={mockEditionConfigured} />
    );

    expect(screen.getByText(/Configurée/)).toBeInTheDocument();
  });
});
