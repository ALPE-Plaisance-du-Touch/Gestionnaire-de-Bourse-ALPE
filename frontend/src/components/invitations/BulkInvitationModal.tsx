import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationsApi } from '@/api';
import { Button, Modal } from '@/components/ui';
import type { InvitationCreateRequest, BulkInvitationResult, ListType } from '@/types';

interface ParsedInvitation extends InvitationCreateRequest {
  lineNumber: number;
  error?: string;
}

interface BulkInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function parseCSV(content: string): ParsedInvitation[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  const results: ParsedInvitation[] = [];

  // Skip header if present
  const startIndex = lines[0]?.toLowerCase().includes('email') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(/[,;]/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
    const [email, firstName, lastName, listTypeRaw] = parts;

    const invitation: ParsedInvitation = {
      lineNumber: i + 1,
      email: email || '',
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      listType: 'standard',
    };

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      invitation.error = 'Email invalide';
    }

    // Parse list type
    if (listTypeRaw) {
      const normalizedType = listTypeRaw.toLowerCase().replace(/\s+/g, '_');
      if (['standard', 'list_1000', 'list_2000', '1000', '2000'].includes(normalizedType)) {
        if (normalizedType === '1000') invitation.listType = 'list_1000';
        else if (normalizedType === '2000') invitation.listType = 'list_2000';
        else invitation.listType = normalizedType as ListType;
      }
    }

    results.push(invitation);
  }

  return results;
}

const LIST_TYPE_LABELS: Record<ListType, string> = {
  standard: 'Standard',
  list_1000: 'Liste 1000',
  list_2000: 'Liste 2000',
};

export function BulkInvitationModal({ isOpen, onClose }: BulkInvitationModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [parsedData, setParsedData] = useState<ParsedInvitation[]>([]);
  const [result, setResult] = useState<BulkInvitationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const bulkMutation = useMutation({
    mutationFn: invitationsApi.createBulkInvitations,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      setResult(data);
      setStep('result');
    },
    onError: () => {
      setError('Une erreur est survenue lors de l\'envoi des invitations.');
    },
  });

  const resetModal = () => {
    setStep('upload');
    setParsedData([]);
    setResult(null);
    setError(null);
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleFile = useCallback((file: File) => {
    setError(null);

    if (!file.name.endsWith('.csv') && !file.type.includes('csv')) {
      setError('Veuillez sélectionner un fichier CSV.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseCSV(content);

      if (parsed.length === 0) {
        setError('Le fichier est vide ou ne contient pas de données valides.');
        return;
      }

      setParsedData(parsed);
      setStep('preview');
    };
    reader.onerror = () => {
      setError('Erreur lors de la lecture du fichier.');
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const validInvitations = parsedData.filter((inv) => !inv.error);
  const invalidInvitations = parsedData.filter((inv) => inv.error);

  const handleSubmit = () => {
    if (validInvitations.length === 0) return;

    const invitations = validInvitations.map(({ email, firstName, lastName, listType }) => ({
      email,
      firstName,
      lastName,
      listType,
    }));

    bulkMutation.mutate(invitations);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invitations en masse" size="lg">
      {step === 'upload' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Importez un fichier CSV contenant les déposants à inviter.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <p className="font-medium text-gray-700 mb-2">Format attendu :</p>
            <code className="text-xs bg-gray-200 px-2 py-1 rounded block">
              email,prenom,nom,type_liste
            </code>
            <p className="text-gray-500 mt-2">
              Types de liste : <code>standard</code>, <code>list_1000</code>, <code>list_2000</code>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              Glissez-déposez votre fichier CSV ici
            </p>
            <p className="text-xs text-gray-500 mt-1">ou</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileInput}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              Parcourir...
            </label>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
              {validInvitations.length} valide{validInvitations.length > 1 ? 's' : ''}
            </span>
            {invalidInvitations.length > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full">
                {invalidInvitations.length} erreur{invalidInvitations.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {invalidInvitations.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-medium text-red-800 mb-2">
                Lignes avec erreurs (seront ignorées) :
              </p>
              <ul className="text-xs text-red-700 space-y-1">
                {invalidInvitations.slice(0, 5).map((inv) => (
                  <li key={inv.lineNumber}>
                    Ligne {inv.lineNumber}: {inv.email || '(vide)'} - {inv.error}
                  </li>
                ))}
                {invalidInvitations.length > 5 && (
                  <li>... et {invalidInvitations.length - 5} autre(s)</li>
                )}
              </ul>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Prénom
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Nom
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {validInvitations.slice(0, 20).map((inv, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2">{inv.email}</td>
                    <td className="px-3 py-2 text-gray-500">{inv.firstName || '-'}</td>
                    <td className="px-3 py-2 text-gray-500">{inv.lastName || '-'}</td>
                    <td className="px-3 py-2 text-gray-500">
                      {LIST_TYPE_LABELS[inv.listType || 'standard']}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {validInvitations.length > 20 && (
              <p className="text-center text-xs text-gray-500 py-2">
                ... et {validInvitations.length - 20} autre(s)
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={resetModal}>
              Changer de fichier
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={validInvitations.length === 0 || bulkMutation.isPending}
                isLoading={bulkMutation.isPending}
              >
                Envoyer {validInvitations.length} invitation
                {validInvitations.length > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 'result' && result && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Import terminé !</p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-gray-900">{result.total}</p>
              <p className="text-sm text-gray-500">Total traité</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-green-600">{result.created}</p>
              <p className="text-sm text-gray-500">Créées</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-yellow-600">{result.duplicates}</p>
              <p className="text-sm text-gray-500">Doublons</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-medium text-red-800 mb-2">Erreurs :</p>
              <ul className="text-xs text-red-700 space-y-1">
                {result.errors.slice(0, 5).map((err, idx) => (
                  <li key={idx}>
                    {err.email}: {err.error}
                  </li>
                ))}
                {result.errors.length > 5 && (
                  <li>... et {result.errors.length - 5} autre(s)</li>
                )}
              </ul>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleClose}>Fermer</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
