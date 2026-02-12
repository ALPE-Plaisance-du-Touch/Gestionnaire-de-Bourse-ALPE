import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BilletwebImportResult } from './BilletwebImportResult';
import type { BilletwebImportResponse } from '@/types';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('BilletwebImportResult', () => {
  const editionId = 'test-edition-123';

  const successResult: BilletwebImportResponse = {
    success: true,
    message: 'Import terminé avec succès',
    result: {
      importLogId: 'log-123',
      existingDepositorsLinked: 5,
      newDepositorsCreated: 10,
      rowsSkipped: 2,
      invitationsSent: 10,
      notificationsSent: 5,
    },
  };

  const errorResult: BilletwebImportResponse = {
    success: false,
    message: 'Une erreur est survenue lors de l\'import',
    result: {
      importLogId: '',
      existingDepositorsLinked: 0,
      newDepositorsCreated: 0,
      rowsSkipped: 0,
      invitationsSent: 0,
      notificationsSent: 0,
    },
  };

  describe('Success state', () => {
    it('displays success message', () => {
      renderWithRouter(<BilletwebImportResult result={successResult} editionId={editionId} />);

      expect(screen.getByText('Import réussi !')).toBeInTheDocument();
      expect(screen.getByText('Import terminé avec succès')).toBeInTheDocument();
    });

    it('displays all statistics', () => {
      renderWithRouter(<BilletwebImportResult result={successResult} editionId={editionId} />);

      // Check by finding within context
      const deposantsSection = screen.getByText('Déposants associés').parentElement;
      expect(deposantsSection).toHaveTextContent('5');

      const nouveauxSection = screen.getByText('Nouveaux comptes').parentElement;
      expect(nouveauxSection).toHaveTextContent('10');

      const ignoreesSection = screen.getByText('Lignes ignorées').parentElement;
      expect(ignoreesSection).toHaveTextContent('2');
    });

    it('displays labels correctly', () => {
      renderWithRouter(<BilletwebImportResult result={successResult} editionId={editionId} />);

      expect(screen.getByText('Déposants associés')).toBeInTheDocument();
      expect(screen.getByText('Nouveaux comptes')).toBeInTheDocument();
      expect(screen.getByText('Lignes ignorées')).toBeInTheDocument();
      expect(screen.getByText('Invitations envoyées')).toBeInTheDocument();
      expect(screen.getByText('Notifications envoyées')).toBeInTheDocument();
    });

    it('displays invitations and notifications', () => {
      renderWithRouter(<BilletwebImportResult result={successResult} editionId={editionId} />);

      // Find the values in context
      const invitationsSection = screen.getByText('Invitations envoyées').parentElement;
      expect(invitationsSection).toHaveTextContent('10');

      const notificationsSection = screen.getByText('Notifications envoyées').parentElement;
      expect(notificationsSection).toHaveTextContent('5');
    });

    it('displays next steps', () => {
      renderWithRouter(<BilletwebImportResult result={successResult} editionId={editionId} />);

      expect(screen.getByText('Prochaines étapes')).toBeInTheDocument();
      expect(screen.getByText(/nouveaux déposants recevront un email/i)).toBeInTheDocument();
      expect(screen.getByText(/déposants existants recevront une notification/i)).toBeInTheDocument();
      expect(screen.getByText(/consulter la liste des déposants/i)).toBeInTheDocument();
    });

    it('displays link to depositors list', () => {
      renderWithRouter(<BilletwebImportResult result={successResult} editionId={editionId} />);

      const link = screen.getByRole('link', { name: /voir la liste des déposants/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', `/editions/${editionId}/depositors`);
    });
  });

  describe('Error state', () => {
    it('displays error message', () => {
      renderWithRouter(<BilletwebImportResult result={errorResult} editionId={editionId} />);

      expect(screen.getByText(/erreur lors de l'import/i)).toBeInTheDocument();
      expect(screen.getByText('Une erreur est survenue lors de l\'import')).toBeInTheDocument();
    });

    it('does not display statistics on error', () => {
      renderWithRouter(<BilletwebImportResult result={errorResult} editionId={editionId} />);

      expect(screen.queryByText('Résultat de l\'import')).not.toBeInTheDocument();
      expect(screen.queryByText('Déposants associés')).not.toBeInTheDocument();
    });

    it('does not display next steps on error', () => {
      renderWithRouter(<BilletwebImportResult result={errorResult} editionId={editionId} />);

      expect(screen.queryByText('Prochaines étapes')).not.toBeInTheDocument();
    });

    it('does not display link to depositors list on error', () => {
      renderWithRouter(<BilletwebImportResult result={errorResult} editionId={editionId} />);

      expect(screen.queryByRole('link', { name: /voir la liste des déposants/i })).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles zero values correctly', () => {
      const zeroResult: BilletwebImportResponse = {
        success: true,
        message: 'Aucun déposant à importer',
        result: {
          importLogId: 'log-456',
          existingDepositorsLinked: 0,
          newDepositorsCreated: 0,
          rowsSkipped: 0,
          invitationsSent: 0,
          notificationsSent: 0,
        },
      };

      renderWithRouter(<BilletwebImportResult result={zeroResult} editionId={editionId} />);

      expect(screen.getByText('Import réussi !')).toBeInTheDocument();
      // Multiple 0 values will be present
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThan(0);
    });
  });
});
