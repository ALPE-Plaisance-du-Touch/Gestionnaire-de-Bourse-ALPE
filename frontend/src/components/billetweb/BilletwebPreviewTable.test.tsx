import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BilletwebPreviewTable } from './BilletwebPreviewTable';
import type { BilletwebPreviewResponse } from '@/types';

describe('BilletwebPreviewTable', () => {
  const basePreview: BilletwebPreviewResponse = {
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

  describe('Statistics display', () => {
    it('displays all statistics correctly', () => {
      render(<BilletwebPreviewTable preview={basePreview} />);

      // Check by finding within context (to avoid conflicts with duplicate values)
      const totalSection = screen.getByText('Total lignes').parentElement;
      expect(totalSection).toHaveTextContent('10');

      const unpaidSection = screen.getByText('Non payés/invalides').parentElement;
      expect(unpaidSection).toHaveTextContent('2');

      const toProcessSection = screen.getByText('À traiter').parentElement;
      expect(toProcessSection).toHaveTextContent('8');

      const existingSection = screen.getByText('Déposants existants').parentElement;
      expect(existingSection).toHaveTextContent('3');

      const newSection = screen.getByText('Nouveaux déposants').parentElement;
      expect(newSection).toHaveTextContent('5');
    });

    it('displays labels correctly', () => {
      render(<BilletwebPreviewTable preview={basePreview} />);

      expect(screen.getByText('Total lignes')).toBeInTheDocument();
      expect(screen.getByText('Non payés/invalides')).toBeInTheDocument();
      expect(screen.getByText('À traiter')).toBeInTheDocument();
      expect(screen.getByText('Erreurs')).toBeInTheDocument();
      expect(screen.getByText('Déposants existants')).toBeInTheDocument();
      expect(screen.getByText('Nouveaux déposants')).toBeInTheDocument();
      expect(screen.getByText('Doublons dans fichier')).toBeInTheDocument();
      expect(screen.getByText('Déjà inscrits')).toBeInTheDocument();
    });
  });

  describe('Can import status', () => {
    it('shows success message when can import', () => {
      render(<BilletwebPreviewTable preview={basePreview} />);

      expect(screen.getByText('Prêt à importer')).toBeInTheDocument();
      expect(screen.getByText(/3 déposant.*existant.*seront associés/i)).toBeInTheDocument();
      expect(screen.getByText(/5 invitation.*seront envoyées/i)).toBeInTheDocument();
    });

    it('shows error message when cannot import', () => {
      const previewWithErrors: BilletwebPreviewResponse = {
        ...basePreview,
        canImport: false,
        errors: [
          {
            rowNumber: 3,
            email: 'invalid@',
            errorType: 'invalid_email',
            errorMessage: 'Email invalide',
            fieldName: 'email',
            fieldValue: 'invalid@',
          },
        ],
        stats: {
          ...basePreview.stats,
          errorsCount: 1,
        },
      };

      render(<BilletwebPreviewTable preview={previewWithErrors} />);

      expect(screen.getByText('Import impossible')).toBeInTheDocument();
      expect(screen.getByText(/corrigez les erreurs/i)).toBeInTheDocument();
    });
  });

  describe('Errors display', () => {
    it('does not show errors section when no errors', () => {
      render(<BilletwebPreviewTable preview={basePreview} />);

      expect(screen.queryByText('Erreurs bloquantes')).not.toBeInTheDocument();
    });

    it('shows errors table when there are errors', () => {
      const previewWithErrors: BilletwebPreviewResponse = {
        ...basePreview,
        canImport: false,
        errors: [
          {
            rowNumber: 3,
            email: 'bad@email',
            errorType: 'invalid_email',
            errorMessage: 'Format email invalide',
            fieldName: 'email',
            fieldValue: 'bad@email',
          },
          {
            rowNumber: 5,
            email: 'test@example.com',
            errorType: 'invalid_phone',
            errorMessage: 'Numero de telephone invalide',
            fieldName: 'phone',
            fieldValue: '123',
          },
        ],
        stats: {
          ...basePreview.stats,
          errorsCount: 2,
        },
      };

      render(<BilletwebPreviewTable preview={previewWithErrors} />);

      expect(screen.getByText('Erreurs bloquantes (2)')).toBeInTheDocument();
      // Find row numbers in error table rows
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // Header + data rows
      expect(screen.getByText('bad@email')).toBeInTheDocument();
      expect(screen.getByText('Format email invalide')).toBeInTheDocument();
      expect(screen.getByText('Numero de telephone invalide')).toBeInTheDocument();
    });

    it('shows dash for missing email in errors', () => {
      const previewWithErrors: BilletwebPreviewResponse = {
        ...basePreview,
        canImport: false,
        errors: [
          {
            rowNumber: 2,
            email: null,
            errorType: 'missing_field',
            errorMessage: 'Email manquant',
            fieldName: 'email',
            fieldValue: null,
          },
        ],
        stats: {
          ...basePreview.stats,
          errorsCount: 1,
        },
      };

      render(<BilletwebPreviewTable preview={previewWithErrors} />);

      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('Warnings display', () => {
    it('does not show warnings section when no warnings', () => {
      render(<BilletwebPreviewTable preview={basePreview} />);

      expect(screen.queryByText('Avertissements')).not.toBeInTheDocument();
    });

    it('shows warnings when present', () => {
      const previewWithWarnings: BilletwebPreviewResponse = {
        ...basePreview,
        warnings: [
          '2 doublons detectes dans le fichier',
          'Certains emails sont deja inscrits',
        ],
      };

      render(<BilletwebPreviewTable preview={previewWithWarnings} />);

      expect(screen.getByText('Avertissements')).toBeInTheDocument();
      expect(screen.getByText('2 doublons detectes dans le fichier')).toBeInTheDocument();
      expect(screen.getByText('Certains emails sont deja inscrits')).toBeInTheDocument();
    });
  });
});
