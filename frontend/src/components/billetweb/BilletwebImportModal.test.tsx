import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { BilletwebImportModal } from './BilletwebImportModal';
import { billetwebApi } from '@/api';

// Mock the billetweb API
vi.mock('@/api', () => ({
  billetwebApi: {
    previewImport: vi.fn(),
    importFile: vi.fn(),
  },
}));

describe('BilletwebImportModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    editionId: 'test-edition-id',
    editionName: 'Bourse Automne 2025',
    onImportSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial render', () => {
    it('renders modal with instructions when open', () => {
      renderWithProviders(<BilletwebImportModal {...defaultProps} />);

      // Title contains both the action and edition name
      expect(screen.getByText(/importer les inscriptions billetweb.*bourse automne 2025/i)).toBeInTheDocument();
      expect(screen.getByText(/exportez le fichier depuis billetweb/i)).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      renderWithProviders(<BilletwebImportModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText(/importer les inscriptions billetweb/i)).not.toBeInTheDocument();
    });

    it('shows required columns info', () => {
      renderWithProviders(<BilletwebImportModal {...defaultProps} />);

      expect(screen.getByText(/colonnes requises/i)).toBeInTheDocument();
    });

    it('shows drag and drop area', () => {
      renderWithProviders(<BilletwebImportModal {...defaultProps} />);

      expect(screen.getByText(/glissez-deposez/i)).toBeInTheDocument();
    });

    it('shows browse button', () => {
      renderWithProviders(<BilletwebImportModal {...defaultProps} />);

      expect(screen.getByText(/parcourez/i)).toBeInTheDocument();
    });
  });

  describe('File selection via hidden input', () => {
    it('displays file name after selection', async () => {
      renderWithProviders(<BilletwebImportModal {...defaultProps} />);

      const file = new File(['csv content'], 'billetweb.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Manually set files and trigger change
      Object.defineProperty(input, 'files', { value: [file], writable: false });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText('billetweb.csv')).toBeInTheDocument();
      });
    });

    it('shows error for non-CSV file', async () => {
      renderWithProviders(<BilletwebImportModal {...defaultProps} />);

      const file = new File(['content'], 'test.xlsx', { type: 'application/vnd.ms-excel' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', { value: [file], writable: false });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText(/type de fichier invalide/i)).toBeInTheDocument();
      });
    });

    it('enables preview button after file selection', async () => {
      renderWithProviders(<BilletwebImportModal {...defaultProps} />);

      const file = new File(['content'], 'billetweb.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', { value: [file], writable: false });
      fireEvent.change(input);

      await waitFor(() => {
        const previewButton = screen.getByText(/previsualiser/i);
        expect(previewButton).not.toBeDisabled();
      });
    });
  });

  describe('Preview step', () => {
    const mockPreviewResponse = {
      canImport: true,
      stats: {
        totalRows: 10,
        rowsUnpaidInvalid: 2,
        rowsToProcess: 8,
        existingDepositors: 3,
        newDepositors: 5,
        duplicatesInFile: 0,
        alreadyRegistered: 0,
        errorsCount: 0,
      },
      errors: [],
      warnings: [],
    };

    it('calls preview API and shows results', async () => {
      vi.mocked(billetwebApi.previewImport).mockResolvedValue(mockPreviewResponse);

      renderWithProviders(<BilletwebImportModal {...defaultProps} />);

      const file = new File(['csv content'], 'billetweb.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', { value: [file], writable: false });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText(/previsualiser/i)).not.toBeDisabled();
      });

      await userEvent.click(screen.getByText(/previsualiser/i));

      await waitFor(() => {
        expect(billetwebApi.previewImport).toHaveBeenCalledWith('test-edition-id', file);
      });

      await waitFor(() => {
        // Check stats are displayed
        expect(screen.getByText('Total lignes')).toBeInTheDocument();
      });
    });

    it('shows import button when can import', async () => {
      vi.mocked(billetwebApi.previewImport).mockResolvedValue(mockPreviewResponse);

      renderWithProviders(<BilletwebImportModal {...defaultProps} />);

      const file = new File(['csv content'], 'billetweb.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', { value: [file], writable: false });
      fireEvent.change(input);

      await userEvent.click(screen.getByText(/previsualiser/i));

      await waitFor(() => {
        // Button says "Importer" (not "Lancer l'import")
        expect(screen.getByRole('button', { name: /^importer$/i })).toBeInTheDocument();
      });
    });

    it('handles preview API error', async () => {
      vi.mocked(billetwebApi.previewImport).mockRejectedValue({
        response: { data: { detail: 'Erreur serveur' } },
      });

      renderWithProviders(<BilletwebImportModal {...defaultProps} />);

      const file = new File(['csv content'], 'billetweb.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', { value: [file], writable: false });
      fireEvent.change(input);

      await userEvent.click(screen.getByText(/previsualiser/i));

      await waitFor(() => {
        expect(screen.getByText('Erreur serveur')).toBeInTheDocument();
      });
    });
  });

  describe('Import step', () => {
    const mockPreviewResponse = {
      canImport: true,
      stats: {
        totalRows: 5,
        rowsUnpaidInvalid: 0,
        rowsToProcess: 5,
        existingDepositors: 2,
        newDepositors: 3,
        duplicatesInFile: 0,
        alreadyRegistered: 0,
        errorsCount: 0,
      },
      errors: [],
      warnings: [],
    };

    const mockImportResponse = {
      success: true,
      message: 'Import reussi',
      result: {
        existingDepositorsLinked: 2,
        newDepositorsCreated: 3,
        rowsSkipped: 0,
        invitationsSent: 3,
        notificationsSent: 2,
      },
    };

    it('calls import API and shows result', async () => {
      vi.mocked(billetwebApi.previewImport).mockResolvedValue(mockPreviewResponse);
      vi.mocked(billetwebApi.importFile).mockResolvedValue(mockImportResponse);

      renderWithProviders(<BilletwebImportModal {...defaultProps} />);

      const file = new File(['csv content'], 'billetweb.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', { value: [file], writable: false });
      fireEvent.change(input);

      await userEvent.click(screen.getByText(/previsualiser/i));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^importer$/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /^importer$/i }));

      await waitFor(() => {
        expect(billetwebApi.importFile).toHaveBeenCalledWith(
          'test-edition-id',
          file,
          expect.objectContaining({ sendEmails: true })
        );
      });

      await waitFor(() => {
        // "Import reussi" appears in multiple places, check for the main heading
        expect(screen.getByText('Import reussi !')).toBeInTheDocument();
      });
    });

    it('calls onImportSuccess callback after successful import', async () => {
      vi.mocked(billetwebApi.previewImport).mockResolvedValue(mockPreviewResponse);
      vi.mocked(billetwebApi.importFile).mockResolvedValue(mockImportResponse);

      const onImportSuccess = vi.fn();
      renderWithProviders(
        <BilletwebImportModal {...defaultProps} onImportSuccess={onImportSuccess} />
      );

      const file = new File(['csv content'], 'billetweb.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', { value: [file], writable: false });
      fireEvent.change(input);

      await userEvent.click(screen.getByText(/previsualiser/i));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^importer$/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /^importer$/i }));

      await waitFor(() => {
        expect(onImportSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Modal interactions', () => {
    it('calls onClose when cancel is clicked', async () => {
      const onClose = vi.fn();
      renderWithProviders(<BilletwebImportModal {...defaultProps} onClose={onClose} />);

      await userEvent.click(screen.getByText('Annuler'));

      expect(onClose).toHaveBeenCalled();
    });
  });
});
