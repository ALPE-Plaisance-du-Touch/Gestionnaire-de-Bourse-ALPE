import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { EditionCreateModal } from './EditionCreateModal';
import { editionsApi, ApiException } from '@/api';
import type { Edition, EditionStatus } from '@/types';

// Mock the editions API
vi.mock('@/api', () => ({
  editionsApi: {
    createEdition: vi.fn(),
  },
  ApiException: class ApiException extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

const mockCreatedEdition: Edition = {
  id: '1',
  name: 'Bourse Test 2025',
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

describe('EditionCreateModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when open', () => {
    renderWithProviders(
      <EditionCreateModal isOpen={true} onClose={mockOnClose} />
    );

    expect(screen.getByText('Nouvelle édition')).toBeInTheDocument();
    expect(screen.getByLabelText("Nom de l'édition")).toBeInTheDocument();
    expect(screen.getByLabelText('Date et heure de début')).toBeInTheDocument();
    expect(screen.getByLabelText('Date et heure de fin')).toBeInTheDocument();
    expect(screen.getByLabelText('Lieu')).toBeInTheDocument();
  });

  it('does not render modal when closed', () => {
    renderWithProviders(
      <EditionCreateModal isOpen={false} onClose={mockOnClose} />
    );

    expect(screen.queryByText('Nouvelle édition')).not.toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithProviders(
      <EditionCreateModal isOpen={true} onClose={mockOnClose} />
    );

    // Try to submit without filling required fields
    await userEvent.click(screen.getByText("Créer l'édition"));

    // Check that API was not called
    expect(editionsApi.createEdition).not.toHaveBeenCalled();
  });

  it('validates end date is after start date', async () => {
    renderWithProviders(
      <EditionCreateModal isOpen={true} onClose={mockOnClose} />
    );

    // Fill in name
    await userEvent.type(screen.getByLabelText("Nom de l'édition"), 'Test Edition');

    // Set dates with end before start
    const startInput = screen.getByLabelText('Date et heure de début');
    const endInput = screen.getByLabelText('Date et heure de fin');

    await userEvent.type(startInput, '2025-03-16T09:00');
    await userEvent.type(endInput, '2025-03-15T18:00');

    // Try to submit
    await userEvent.click(screen.getByText("Créer l'édition"));

    // Error message should appear
    await waitFor(() => {
      expect(screen.getByText(/date de fin doit être après/i)).toBeInTheDocument();
    });

    expect(editionsApi.createEdition).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    vi.mocked(editionsApi.createEdition).mockResolvedValue(mockCreatedEdition);

    renderWithProviders(
      <EditionCreateModal isOpen={true} onClose={mockOnClose} />
    );

    // Fill in form
    await userEvent.type(screen.getByLabelText("Nom de l'édition"), 'Bourse Test 2025');
    await userEvent.type(screen.getByLabelText('Date et heure de début'), '2025-03-15T09:00');
    await userEvent.type(screen.getByLabelText('Date et heure de fin'), '2025-03-16T18:00');
    await userEvent.type(screen.getByLabelText('Lieu'), 'Salle des fêtes');

    // Submit
    await userEvent.click(screen.getByText("Créer l'édition"));

    await waitFor(() => {
      expect(editionsApi.createEdition).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Bourse Test 2025',
          location: 'Salle des fêtes',
        })
      );
    });
  });

  it('shows success message after creation', async () => {
    vi.mocked(editionsApi.createEdition).mockResolvedValue(mockCreatedEdition);

    renderWithProviders(
      <EditionCreateModal isOpen={true} onClose={mockOnClose} />
    );

    // Fill in minimum required fields
    await userEvent.type(screen.getByLabelText("Nom de l'édition"), 'Bourse Test 2025');
    await userEvent.type(screen.getByLabelText('Date et heure de début'), '2025-03-15T09:00');
    await userEvent.type(screen.getByLabelText('Date et heure de fin'), '2025-03-16T18:00');

    // Submit
    await userEvent.click(screen.getByText("Créer l'édition"));

    await waitFor(() => {
      expect(screen.getByText(/Édition créée avec succès/i)).toBeInTheDocument();
    });
  });

  it('shows error message on duplicate name', async () => {
    vi.mocked(editionsApi.createEdition).mockRejectedValue(
      new ApiException('Conflict', 409)
    );

    renderWithProviders(
      <EditionCreateModal isOpen={true} onClose={mockOnClose} />
    );

    // Fill in form
    await userEvent.type(screen.getByLabelText("Nom de l'édition"), 'Existing Edition');
    await userEvent.type(screen.getByLabelText('Date et heure de début'), '2025-03-15T09:00');
    await userEvent.type(screen.getByLabelText('Date et heure de fin'), '2025-03-16T18:00');

    // Submit
    await userEvent.click(screen.getByText("Créer l'édition"));

    await waitFor(() => {
      expect(screen.getByText(/existe déjà/i)).toBeInTheDocument();
    });
  });

  it('calls onClose when cancel button clicked', async () => {
    renderWithProviders(
      <EditionCreateModal isOpen={true} onClose={mockOnClose} />
    );

    await userEvent.click(screen.getByText('Annuler'));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when close button (Fermer) clicked after success', async () => {
    vi.mocked(editionsApi.createEdition).mockResolvedValue(mockCreatedEdition);

    renderWithProviders(
      <EditionCreateModal isOpen={true} onClose={mockOnClose} />
    );

    // Fill and submit
    await userEvent.type(screen.getByLabelText("Nom de l'édition"), 'Bourse Test 2025');
    await userEvent.type(screen.getByLabelText('Date et heure de début'), '2025-03-15T09:00');
    await userEvent.type(screen.getByLabelText('Date et heure de fin'), '2025-03-16T18:00');
    await userEvent.click(screen.getByText("Créer l'édition"));

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/Édition créée avec succès/i)).toBeInTheDocument();
    });

    // Click close
    await userEvent.click(screen.getByText('Fermer'));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('allows creating another edition after success', async () => {
    vi.mocked(editionsApi.createEdition).mockResolvedValue(mockCreatedEdition);

    renderWithProviders(
      <EditionCreateModal isOpen={true} onClose={mockOnClose} />
    );

    // Fill and submit first edition
    await userEvent.type(screen.getByLabelText("Nom de l'édition"), 'Bourse Test 2025');
    await userEvent.type(screen.getByLabelText('Date et heure de début'), '2025-03-15T09:00');
    await userEvent.type(screen.getByLabelText('Date et heure de fin'), '2025-03-16T18:00');
    await userEvent.click(screen.getByText("Créer l'édition"));

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/Édition créée avec succès/i)).toBeInTheDocument();
    });

    // Click "Create another"
    await userEvent.click(screen.getByText('Créer une autre édition'));

    // Form should be reset
    expect(screen.getByLabelText("Nom de l'édition")).toHaveValue('');
    expect(screen.queryByText(/Édition créée avec succès/i)).not.toBeInTheDocument();
  });
});
