import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BilletwebImportResult } from './BilletwebImportResult';
import type { BilletwebImportResponse } from '@/types';

describe('BilletwebImportResult', () => {
  const successResult: BilletwebImportResponse = {
    success: true,
    message: 'Import termine avec succes',
    result: {
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
      existingDepositorsLinked: 0,
      newDepositorsCreated: 0,
      rowsSkipped: 0,
      invitationsSent: 0,
      notificationsSent: 0,
    },
  };

  describe('Success state', () => {
    it('displays success message', () => {
      render(<BilletwebImportResult result={successResult} />);

      expect(screen.getByText('Import reussi !')).toBeInTheDocument();
      expect(screen.getByText('Import termine avec succes')).toBeInTheDocument();
    });

    it('displays all statistics', () => {
      render(<BilletwebImportResult result={successResult} />);

      // Check by finding within context
      const deposantsSection = screen.getByText('Deposants associes').parentElement;
      expect(deposantsSection).toHaveTextContent('5');

      const nouveauxSection = screen.getByText('Nouveaux comptes').parentElement;
      expect(nouveauxSection).toHaveTextContent('10');

      const ignoreesSection = screen.getByText('Lignes ignorees').parentElement;
      expect(ignoreesSection).toHaveTextContent('2');
    });

    it('displays labels correctly', () => {
      render(<BilletwebImportResult result={successResult} />);

      expect(screen.getByText('Deposants associes')).toBeInTheDocument();
      expect(screen.getByText('Nouveaux comptes')).toBeInTheDocument();
      expect(screen.getByText('Lignes ignorees')).toBeInTheDocument();
      expect(screen.getByText('Invitations envoyees')).toBeInTheDocument();
      expect(screen.getByText('Notifications envoyees')).toBeInTheDocument();
    });

    it('displays invitations and notifications', () => {
      render(<BilletwebImportResult result={successResult} />);

      // Find the values in context
      const invitationsSection = screen.getByText('Invitations envoyees').parentElement;
      expect(invitationsSection).toHaveTextContent('10');

      const notificationsSection = screen.getByText('Notifications envoyees').parentElement;
      expect(notificationsSection).toHaveTextContent('5');
    });

    it('displays next steps', () => {
      render(<BilletwebImportResult result={successResult} />);

      expect(screen.getByText('Prochaines etapes')).toBeInTheDocument();
      expect(screen.getByText(/nouveaux deposants recevront un email/i)).toBeInTheDocument();
      expect(screen.getByText(/deposants existants recevront une notification/i)).toBeInTheDocument();
      expect(screen.getByText(/consulter la liste des deposants/i)).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('displays error message', () => {
      render(<BilletwebImportResult result={errorResult} />);

      expect(screen.getByText(/erreur lors de l'import/i)).toBeInTheDocument();
      expect(screen.getByText('Une erreur est survenue lors de l\'import')).toBeInTheDocument();
    });

    it('does not display statistics on error', () => {
      render(<BilletwebImportResult result={errorResult} />);

      expect(screen.queryByText('Resultat de l\'import')).not.toBeInTheDocument();
      expect(screen.queryByText('Deposants associes')).not.toBeInTheDocument();
    });

    it('does not display next steps on error', () => {
      render(<BilletwebImportResult result={errorResult} />);

      expect(screen.queryByText('Prochaines etapes')).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles zero values correctly', () => {
      const zeroResult: BilletwebImportResponse = {
        success: true,
        message: 'Aucun deposant a importer',
        result: {
          existingDepositorsLinked: 0,
          newDepositorsCreated: 0,
          rowsSkipped: 0,
          invitationsSent: 0,
          notificationsSent: 0,
        },
      };

      render(<BilletwebImportResult result={zeroResult} />);

      expect(screen.getByText('Import reussi !')).toBeInTheDocument();
      // Multiple 0 values will be present
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThan(0);
    });
  });
});
