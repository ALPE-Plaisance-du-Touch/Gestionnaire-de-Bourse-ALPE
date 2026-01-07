import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { BilletwebImportButton } from './BilletwebImportButton';
import type { Edition } from '@/types';

// Mock the BilletwebImportModal to avoid testing it again
vi.mock('./BilletwebImportModal', () => ({
  BilletwebImportModal: ({ isOpen, onClose, editionName }: any) =>
    isOpen ? (
      <div data-testid="billetweb-modal">
        <span>Modal for {editionName}</span>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

describe('BilletwebImportButton', () => {
  const configuredEdition: Edition = {
    id: 'test-id',
    name: 'Bourse Automne 2025',
    status: 'configured',
    startDatetime: '2025-11-05T09:00:00',
    endDatetime: '2025-11-06T18:00:00',
    createdAt: '2025-01-01T00:00:00',
  };

  const draftEdition: Edition = {
    ...configuredEdition,
    status: 'draft',
  };

  const closedEdition: Edition = {
    ...configuredEdition,
    status: 'closed',
  };

  describe('Visibility', () => {
    it('renders button for configured edition', () => {
      renderWithProviders(<BilletwebImportButton edition={configuredEdition} />);

      expect(screen.getByText(/importer les inscriptions billetweb/i)).toBeInTheDocument();
    });

    it('does not render for draft edition', () => {
      renderWithProviders(<BilletwebImportButton edition={draftEdition} />);

      expect(screen.queryByText(/importer les inscriptions billetweb/i)).not.toBeInTheDocument();
    });

    it('does not render for closed edition', () => {
      renderWithProviders(<BilletwebImportButton edition={closedEdition} />);

      expect(screen.queryByText(/importer les inscriptions billetweb/i)).not.toBeInTheDocument();
    });
  });

  describe('Import count display', () => {
    it('does not show count when zero', () => {
      renderWithProviders(<BilletwebImportButton edition={configuredEdition} importCount={0} />);

      // The button always says "inscriptions" but the count badge should not appear
      expect(screen.queryByText(/deja importee/i)).not.toBeInTheDocument();
    });

    it('shows singular count when one', () => {
      renderWithProviders(<BilletwebImportButton edition={configuredEdition} importCount={1} />);

      expect(screen.getByText(/1 inscription.*deja importee/i)).toBeInTheDocument();
    });

    it('shows plural count when multiple', () => {
      renderWithProviders(<BilletwebImportButton edition={configuredEdition} importCount={5} />);

      expect(screen.getByText(/5 inscription.*deja importee/i)).toBeInTheDocument();
    });
  });

  describe('Modal interaction', () => {
    it('opens modal when button clicked', async () => {
      renderWithProviders(<BilletwebImportButton edition={configuredEdition} />);

      expect(screen.queryByTestId('billetweb-modal')).not.toBeInTheDocument();

      await userEvent.click(screen.getByText(/importer les inscriptions billetweb/i));

      await waitFor(() => {
        expect(screen.getByTestId('billetweb-modal')).toBeInTheDocument();
      });

      expect(screen.getByText('Modal for Bourse Automne 2025')).toBeInTheDocument();
    });

    it('closes modal when close button clicked', async () => {
      renderWithProviders(<BilletwebImportButton edition={configuredEdition} />);

      await userEvent.click(screen.getByText(/importer les inscriptions billetweb/i));

      await waitFor(() => {
        expect(screen.getByTestId('billetweb-modal')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(screen.queryByTestId('billetweb-modal')).not.toBeInTheDocument();
      });
    });

    it('passes onImportSuccess callback to modal', async () => {
      const onImportSuccess = vi.fn();
      renderWithProviders(
        <BilletwebImportButton edition={configuredEdition} onImportSuccess={onImportSuccess} />
      );

      await userEvent.click(screen.getByText(/importer les inscriptions billetweb/i));

      await waitFor(() => {
        expect(screen.getByTestId('billetweb-modal')).toBeInTheDocument();
      });
    });
  });
});
