import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationsApi, ApiException } from '@/api';
import { Button, Input, Modal, Select } from '@/components/ui';
import type { DepositorLookup, ListType } from '@/types';

const LIST_TYPE_OPTIONS = [
  { value: 'standard', label: 'Standard (100-600)' },
  { value: 'list_1000', label: 'Liste 1000 (membres ALPE)' },
  { value: 'list_2000', label: 'Liste 2000 (famille/amis)' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface InvitationCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InvitationCreateModal({ isOpen, onClose }: InvitationCreateModalProps) {
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [listType, setListType] = useState<ListType>('standard');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lookup, setLookup] = useState<DepositorLookup | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createMutation = useMutation({
    mutationFn: invitationsApi.createInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      setSuccess(true);
      setError(null);
    },
    onError: (err) => {
      if (err instanceof ApiException) {
        if (err.status === 409) {
          setError('Une invitation existe déjà pour cet email. Utilisez "Relancer" depuis la liste.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Une erreur inattendue est survenue. Veuillez réessayer.');
      }
    },
  });

  // Debounced depositor lookup
  const debouncedLookup = useCallback((emailValue: string) => {
    if (lookupTimerRef.current) {
      clearTimeout(lookupTimerRef.current);
    }
    setLookup(null);

    if (!emailValue || !EMAIL_REGEX.test(emailValue)) {
      setIsLookingUp(false);
      return;
    }

    setIsLookingUp(true);
    lookupTimerRef.current = setTimeout(async () => {
      const result = await invitationsApi.lookupDepositor(emailValue);
      setLookup(result);
      setIsLookingUp(false);
    }, 500);
  }, []);

  useEffect(() => {
    return () => {
      if (lookupTimerRef.current) {
        clearTimeout(lookupTimerRef.current);
      }
    };
  }, []);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    debouncedLookup(value);
  };

  const handlePrefill = () => {
    if (!lookup?.found) return;
    if (lookup.firstName) setFirstName(lookup.firstName);
    if (lookup.lastName) setLastName(lookup.lastName);
    if (lookup.preferredListType) setListType(lookup.preferredListType as ListType);
  };

  const resetForm = () => {
    setEmail('');
    setFirstName('');
    setLastName('');
    setListType('standard');
    setError(null);
    setSuccess(false);
    setLookup(null);
    setIsLookingUp(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic email validation
    if (!email || !EMAIL_REGEX.test(email)) {
      setError('Veuillez saisir une adresse email valide.');
      return;
    }

    createMutation.mutate({
      email,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      listType,
    });
  };

  const handleCreateAnother = () => {
    resetForm();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nouvelle invitation" size="md">
      {success ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Invitation envoyée avec succès !</p>
            <p className="text-sm mt-1">
              Un email d'invitation a été envoyé à <strong>{email}</strong>.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Fermer
            </Button>
            <Button onClick={handleCreateAnother}>Créer une autre invitation</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Input
            label="Adresse email"
            type="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="deposant@example.com"
            required
            autoFocus
          />

          {/* Depositor lookup result */}
          {isLookingUp && (
            <p className="text-xs text-gray-400">Recherche du deposant...</p>
          )}
          {lookup?.found && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
              <div className="flex items-center justify-between">
                <span>
                  Deposant existant : <strong>{lookup.firstName} {lookup.lastName}</strong>
                  {lookup.participationCount ? ` (${lookup.participationCount} participation${lookup.participationCount > 1 ? 's' : ''})` : ''}
                </span>
                <button
                  type="button"
                  onClick={handlePrefill}
                  className="text-xs font-medium text-green-800 underline hover:text-green-900"
                >
                  Pre-remplir
                </button>
              </div>
              {lookup.lastEditionName && (
                <p className="text-xs mt-0.5 text-green-600">
                  Derniere participation : {lookup.lastEditionName}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jean"
            />
            <Input
              label="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Dupont"
            />
          </div>

          <Select
            label="Type de liste"
            options={LIST_TYPE_OPTIONS}
            value={listType}
            onChange={(e) => setListType(e.target.value as ListType)}
          />

          <p className="text-sm text-gray-500">
            L'invitation sera valide pendant 7 jours. Le déposant recevra un email avec un lien
            pour activer son compte.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !email}
              isLoading={createMutation.isPending}
            >
              Envoyer l'invitation
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
