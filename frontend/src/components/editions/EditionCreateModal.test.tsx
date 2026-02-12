import React from 'react';
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

// Mock AuthProvider to avoid issues with test-utils wrapper
vi.mock('@/contexts', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
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
  retrievalStartDatetime: null,
  retrievalEndDatetime: null,
  commissionRate: null,
  createdAt: '2025-01-15T10:00:00Z',
  createdBy: null,
};

// Helper to get form fields by placeholder
const getNameInput = () => screen.getByPlaceholderText('Bourse Printemps 2025');
const getLocationInput = () => screen.getByPlaceholderText('Salle des fêtes de Plaisance du Touch');

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
    expect(getNameInput()).toBeInTheDocument();
    expect(getLocationInput()).toBeInTheDocument();
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

    // Try to submit without filling required fields - button should be disabled
    const submitButton = screen.getByText("Créer l'édition");
    expect(submitButton).toBeDisabled();

    // Check that API was not called
    expect(editionsApi.createEdition).not.toHaveBeenCalled();
  });

  it('validates end date is after start date', async () => {
    renderWithProviders(
      <EditionCreateModal isOpen={true} onClose={mockOnClose} />
    );

    // Fill in name
    await userEvent.type(getNameInput(), 'Test Edition');

    // Get datetime inputs - they don't have placeholders so use getAllByRole
    const datetimeInputs = screen.getAllByRole('textbox').filter(
      (input) => input.getAttribute('type') === 'datetime-local'
    );

    // If we can't find datetime-local inputs by role, try different approach
    const allInputs = document.querySelectorAll('input[type="datetime-local"]');
    const startInput = allInputs[0] as HTMLInputElement;
    const endInput = allInputs[1] as HTMLInputElement;

    // Set dates with end before start using fireEvent for datetime-local
    await userEvent.clear(startInput);
    await userEvent.type(startInput, '2025-03-16T09:00');
    await userEvent.clear(endInput);
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
    await userEvent.type(getNameInput(), 'Bourse Test 2025');

    const allInputs = document.querySelectorAll('input[type="datetime-local"]');
    const startInput = allInputs[0] as HTMLInputElement;
    const endInput = allInputs[1] as HTMLInputElement;

    await userEvent.type(startInput, '2025-03-15T09:00');
    await userEvent.type(endInput, '2025-03-16T18:00');
    await userEvent.type(getLocationInput(), 'Salle des fêtes');

    // Submit
    await userEvent.click(screen.getByText("Créer l'édition"));

    // Just verify that the success message appears (API was called)
    await waitFor(() => {
      expect(screen.getByText(/Édition créée avec succès/i)).toBeInTheDocument();
    });

    // Verify API was called with correct name
    expect(editionsApi.createEdition).toHaveBeenCalled();
    const callArg = vi.mocked(editionsApi.createEdition).mock.calls[0][0];
    expect(callArg.name).toBe('Bourse Test 2025');
  });

  it('shows success message after creation', async () => {
    vi.mocked(editionsApi.createEdition).mockResolvedValue(mockCreatedEdition);

    renderWithProviders(
      <EditionCreateModal isOpen={true} onClose={mockOnClose} />
    );

    // Fill in minimum required fields
    await userEvent.type(getNameInput(), 'Bourse Test 2025');

    const allInputs = document.querySelectorAll('input[type="datetime-local"]');
    const startInput = allInputs[0] as HTMLInputElement;
    const endInput = allInputs[1] as HTMLInputElement;

    await userEvent.type(startInput, '2025-03-15T09:00');
    await userEvent.type(endInput, '2025-03-16T18:00');

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
    await userEvent.type(getNameInput(), 'Existing Edition');

    const allInputs = document.querySelectorAll('input[type="datetime-local"]');
    const startInput = allInputs[0] as HTMLInputElement;
    const endInput = allInputs[1] as HTMLInputElement;

    await userEvent.type(startInput, '2025-03-15T09:00');
    await userEvent.type(endInput, '2025-03-16T18:00');

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
    await userEvent.type(getNameInput(), 'Bourse Test 2025');

    const allInputs = document.querySelectorAll('input[type="datetime-local"]');
    const startInput = allInputs[0] as HTMLInputElement;
    const endInput = allInputs[1] as HTMLInputElement;

    await userEvent.type(startInput, '2025-03-15T09:00');
    await userEvent.type(endInput, '2025-03-16T18:00');
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
    await userEvent.type(getNameInput(), 'Bourse Test 2025');

    const allInputs = document.querySelectorAll('input[type="datetime-local"]');
    const startInput = allInputs[0] as HTMLInputElement;
    const endInput = allInputs[1] as HTMLInputElement;

    await userEvent.type(startInput, '2025-03-15T09:00');
    await userEvent.type(endInput, '2025-03-16T18:00');
    await userEvent.click(screen.getByText("Créer l'édition"));

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/Édition créée avec succès/i)).toBeInTheDocument();
    });

    // Click "Create another"
    await userEvent.click(screen.getByText('Créer une autre édition'));

    // Form should be reset - check the name input is empty
    await waitFor(() => {
      expect(getNameInput()).toHaveValue('');
    });
    expect(screen.queryByText(/Édition créée avec succès/i)).not.toBeInTheDocument();
  });
});
