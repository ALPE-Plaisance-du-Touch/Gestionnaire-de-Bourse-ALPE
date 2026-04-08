import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { configApi } from '@/api/config';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function AppSettingsPage() {
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['support-email'],
    queryFn: () => configApi.getSupportEmail(),
  });

  useEffect(() => {
    if (data) {
      setEmail(data.supportEmail);
    }
  }, [data]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(''), 5000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(() => setErrorMessage(''), 5000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  const saveMutation = useMutation({
    mutationFn: () => configApi.updateSupportEmail(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-email'] });
      setSuccessMessage('Email de contact mis à jour.');
    },
    onError: () => {
      setErrorMessage("Erreur lors de l'enregistrement. Vérifiez le format de l'email.");
    },
  });

  const canSave = email.trim() && email !== data?.supportEmail;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-bark-muted">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="mb-6 text-sm text-bark-muted">
        <Link to="/admin" className="hover:text-primary">Tableau de bord</Link>
        <span className="mx-2">/</span>
        <span className="text-bark">Paramètres</span>
      </nav>

      <h1 className="text-2xl font-bold text-bark mb-2">Paramètres généraux</h1>
      <p className="text-bark-light mb-8">
        Configurez les paramètres globaux de l'application.
      </p>

      {successMessage && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary/30 text-primary-dark rounded-lg text-sm">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 p-3 bg-error/10 border border-error/30 text-error rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <Input
          label="Email de contact"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="contact@example.com"
          hint="Cet email apparaît dans le pied de page de tous les emails envoyés par l'application."
        />

        {data?.source === 'default' && (
          <p className="text-xs text-accent-dark">
            Valeur par défaut (variable d'environnement). Enregistrez pour personnaliser.
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => saveMutation.mutate()}
            isLoading={saveMutation.isPending}
            disabled={!canSave}
          >
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}
