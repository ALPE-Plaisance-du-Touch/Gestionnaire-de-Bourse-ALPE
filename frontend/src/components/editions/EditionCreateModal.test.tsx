import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { EditionCreateModal } from './EditionCreateModal';
import { editionsApi, billetwebApiSettings, ApiException } from '@/api';
import type { Edition, EditionStatus } from '@/types';

// Mock the editions API
vi.mock('@/api', () => ({
  editionsApi: {
    createEdition: vi.fn(),
  },
  billetwebApiSettings: {
    getConfig: vi.fn(),
  },
  ApiException: class ApiException extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

const getDatetimeInputs = () => {
  const inputs = document.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]');
  return { startInput: inputs[0], endInput: inputs[1] };
};

// Modal focuses its own container from a requestAnimationFrame callback on open.
// That rAF resolves asynchronously, so without waiting for it here it can fire in
// the middle of a userEvent.type() sequence, pull focus off the field being typed
// into and silently drop the remaining keystrokes. Waiting for the trap to settle
// makes every subsequent interaction deterministic.
const waitForModalFocusTrap = async () => {
  const modalContainer = document.querySelector('[role="dialog"] > div');
  await waitFor(() => {
    expect(modalContainer).toHaveFocus();
  });
};

// datetime-local values are set directly: userEvent.type() drives these inputs
// segment by segment, which is needlessly brittle for what is a single value.
const setDatetime = (input: HTMLInputElement, value: string) => {
  fireEvent.change(input, { target: { value } });
};

describe('EditionCreateModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Re-armed after the clear: the modal queries this on open.
    vi.mocked(billetwebApiSettings.getConfig).mockResolvedValue({
      configured: false,
      user: null,
      apiKeyMasked: null,
    });
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

    await waitForModalFocusTrap();

    // Fill in name
    await userEvent.type(getNameInput(), 'Test Edition');

    // Set dates with end before start
    const { startInput, endInput } = getDatetimeInputs();
    setDatetime(startInput, '2025-03-16T09:00');
    setDatetime(endInput, '2025-03-15T18:00');

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

    await waitForModalFocusTrap();

    // Fill in form
    await userEvent.type(getNameInput(), 'Bourse Test 2025');

    const { startInput, endInput } = getDatetimeInputs();
    setDatetime(startInput, '2025-03-15T09:00');
    setDatetime(endInput, '2025-03-16T18:00');
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

    await waitForModalFocusTrap();

    // Fill in minimum required fields
    await userEvent.type(getNameInput(), 'Bourse Test 2025');

    const { startInput, endInput } = getDatetimeInputs();
    setDatetime(startInput, '2025-03-15T09:00');
    setDatetime(endInput, '2025-03-16T18:00');

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

    await waitForModalFocusTrap();

    // Fill in form
    await userEvent.type(getNameInput(), 'Existing Edition');

    const { startInput, endInput } = getDatetimeInputs();
    setDatetime(startInput, '2025-03-15T09:00');
    setDatetime(endInput, '2025-03-16T18:00');

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

    await waitForModalFocusTrap();

    await userEvent.click(screen.getByText('Annuler'));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when close button (Fermer) clicked after success', async () => {
    vi.mocked(editionsApi.createEdition).mockResolvedValue(mockCreatedEdition);

    renderWithProviders(
      <EditionCreateModal isOpen={true} onClose={mockOnClose} />
    );

    await waitForModalFocusTrap();

    // Fill and submit
    await userEvent.type(getNameInput(), 'Bourse Test 2025');

    const { startInput, endInput } = getDatetimeInputs();
    setDatetime(startInput, '2025-03-15T09:00');
    setDatetime(endInput, '2025-03-16T18:00');
    await userEvent.click(screen.getByText("Créer l'édition"));

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/Édition créée avec succès/i)).toBeInTheDocument();
    });

    // Click close
    await userEvent.click(screen.getByText('Fermer'));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('navigates to the created edition after success', async () => {
    vi.mocked(editionsApi.createEdition).mockResolvedValue(mockCreatedEdition);

    renderWithProviders(
      <EditionCreateModal isOpen={true} onClose={mockOnClose} />
    );

    await waitForModalFocusTrap();

    // Fill and submit first edition
    await userEvent.type(getNameInput(), 'Bourse Test 2025');

    const { startInput, endInput } = getDatetimeInputs();
    setDatetime(startInput, '2025-03-15T09:00');
    setDatetime(endInput, '2025-03-16T18:00');
    await userEvent.click(screen.getByText("Créer l'édition"));

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/Édition créée avec succès/i)).toBeInTheDocument();
    });

    // The success screen now offers navigation to the created edition
    await userEvent.click(screen.getByText("Voir l'édition"));

    expect(mockNavigate).toHaveBeenCalledWith('/editions/1');
    expect(mockOnClose).toHaveBeenCalled();
  });
});
