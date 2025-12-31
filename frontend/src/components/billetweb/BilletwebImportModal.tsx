import { useState, useCallback, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { billetwebApi } from '@/api';
import type {
  BilletwebPreviewResponse,
  BilletwebImportResponse,
} from '@/types';
import { BilletwebPreviewTable } from './BilletwebPreviewTable';
import { BilletwebImportResult } from './BilletwebImportResult';

interface BilletwebImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  editionId: string;
  editionName: string;
  onImportSuccess?: () => void;
}

type Step = 'upload' | 'preview' | 'importing' | 'result';

export function BilletwebImportModal({
  isOpen,
  onClose,
  editionId,
  editionName,
  onImportSuccess,
}: BilletwebImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<BilletwebPreviewResponse | null>(null);
  const [importResult, setImportResult] = useState<BilletwebImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [ignoreErrors, setIgnoreErrors] = useState(false);
  const [sendEmails, setSendEmails] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setImportResult(null);
    setError(null);
    setIsLoading(false);
    setIgnoreErrors(false);
    setSendEmails(true);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Type de fichier invalide. Seuls les fichiers .csv sont acceptes.');
        return;
      }
      // Validate file size (5 MB max)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Fichier trop volumineux. Taille maximum : 5 Mo.');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.csv')) {
        setError('Type de fichier invalide. Seuls les fichiers .csv sont acceptes.');
        return;
      }
      if (droppedFile.size > 5 * 1024 * 1024) {
        setError('Fichier trop volumineux. Taille maximum : 5 Mo.');
        return;
      }
      setFile(droppedFile);
      setError(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handlePreview = useCallback(async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await billetwebApi.previewImport(editionId, file);
      setPreview(result);
      setStep('preview');
    } catch (err: any) {
      console.error('Preview error:', err.response?.data);
      setError(err.response?.data?.detail || 'Erreur lors de la previsualisation');
    } finally {
      setIsLoading(false);
    }
  }, [editionId, file]);

  const handleImport = useCallback(async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setStep('importing');

    try {
      const result = await billetwebApi.importFile(editionId, file, {
        ignoreErrors,
        sendEmails,
      });
      setImportResult(result);
      setStep('result');
      onImportSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de l'import");
      setStep('preview');
    } finally {
      setIsLoading(false);
    }
  }, [editionId, file, ignoreErrors, sendEmails, onImportSuccess]);

  const handleNewImport = useCallback(() => {
    resetState();
  }, [resetState]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Importer les inscriptions Billetweb - ${editionName}`}
      size="xl"
    >
      {step === 'upload' && (
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Instructions</h4>
            <p className="text-sm text-blue-700 mb-2">
              Exportez le fichier depuis Billetweb et importez-le tel quel.
              Seuls les billets payes et valides seront traites.
            </p>
            <p className="text-sm text-blue-600">
              <strong>Colonnes requises :</strong> Nom, Prenom, Email, Seance, Tarif, Paye, Valide, Telephone, Code postal, Ville
            </p>
          </div>

          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              file
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {file ? (
              <div className="space-y-2">
                <svg
                  className="mx-auto h-12 w-12 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} Ko
                </p>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Supprimer
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-sm text-gray-600">
                  Glissez-deposez votre fichier ici, ou{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    parcourez
                  </button>
                </p>
                <p className="text-xs text-gray-500">
                  Fichiers CSV (.csv) - Max 5 Mo
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button
              onClick={handlePreview}
              disabled={!file}
              isLoading={isLoading}
            >
              Previsualiser
            </Button>
          </div>
        </div>
      )}

      {step === 'preview' && preview && (
        <div className="space-y-6">
          <BilletwebPreviewTable preview={preview} />

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Options */}
          {preview.canImport && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-gray-700">Options d'import</h4>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sendEmails}
                  onChange={(e) => setSendEmails(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Envoyer les emails d'invitation et de notification
                </span>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('upload')}>
              Retour
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              {preview.canImport ? (
                <Button onClick={handleImport} isLoading={isLoading}>
                  Importer
                </Button>
              ) : (
                <Button disabled>
                  Import impossible (erreurs)
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="py-12 text-center">
          <svg
            className="animate-spin mx-auto h-12 w-12 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="mt-4 text-gray-600">Import en cours...</p>
          <p className="text-sm text-gray-500">
            Envoi des invitations et notifications par email
          </p>
        </div>
      )}

      {step === 'result' && importResult && (
        <div className="space-y-6">
          <BilletwebImportResult result={importResult} />

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleNewImport}>
              Nouvel import
            </Button>
            <Button onClick={handleClose}>
              Fermer
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
