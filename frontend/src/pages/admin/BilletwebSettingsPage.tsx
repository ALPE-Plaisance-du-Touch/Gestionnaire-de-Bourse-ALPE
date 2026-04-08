import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { billetwebApiSettings } from '@/api/billetweb-api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function BilletwebSettingsPage() {
  const queryClient = useQueryClient();

  const [user, setUser] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ['billetweb-settings'],
    queryFn: () => billetwebApiSettings.getConfig(),
  });

  // Populate form when config is loaded
  useEffect(() => {
    if (config?.configured && config.user) {
      setUser(config.user);
    }
  }, [config]);

  // Auto-dismiss messages
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
    mutationFn: () => billetwebApiSettings.saveConfig({ user, api_key: apiKey }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billetweb-settings'] });
      setSuccessMessage('Identifiants enregistrés avec succès.');
      setApiKey('');
      setTestResult(null);
    },
    onError: () => {
      setErrorMessage("Erreur lors de l'enregistrement des identifiants.");
    },
  });

  const testMutation = useMutation({
    mutationFn: () => billetwebApiSettings.testConnection(),
    onSuccess: (data) => {
      setTestResult(data);
    },
    onError: () => {
      setTestResult({ success: false, message: 'Erreur réseau lors du test.' });
    },
  });

  const canSave = user.trim() && apiKey.trim();
  const canTest = config?.configured;

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
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-bark-muted">
        <Link to="/admin" className="hover:text-primary">Tableau de bord</Link>
        <span className="mx-2">/</span>
        <span className="text-bark">Configuration Billetweb</span>
      </nav>

      <h1 className="text-2xl font-bold text-bark mb-2">Configuration API Billetweb</h1>
      <p className="text-bark-light mb-8">
        Configurez les identifiants de l'API Billetweb pour synchroniser automatiquement les événements, créneaux et inscriptions.
      </p>

      {/* Status */}
      <div className="mb-6 p-4 rounded-lg border bg-white">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${config?.configured ? 'bg-primary' : 'bg-sand'}`} />
          <span className="font-medium text-bark">
            {config?.configured ? 'API configurée' : 'API non configurée'}
          </span>
        </div>
        {config?.configured && config.user && (
          <div className="mt-2 text-sm text-bark-muted">
            Utilisateur : <span className="font-mono">{config.user}</span>
            {config.apiKeyMasked && (
              <> &mdash; Clé : <span className="font-mono">{config.apiKeyMasked}</span></>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
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

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <Input
          label="Identifiant utilisateur"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          placeholder="Votre identifiant Billetweb (ex: 158210)"
          required
        />

        <div>
          <Input
            label="Clé API"
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={config?.configured ? 'Laisser vide pour conserver la clé actuelle' : 'Votre clé API Billetweb'}
            required={!config?.configured}
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="mt-1 text-xs text-primary hover:text-primary-dark"
          >
            {showKey ? 'Masquer' : 'Afficher'} la clé
          </button>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => saveMutation.mutate()}
            isLoading={saveMutation.isPending}
            disabled={!canSave && !config?.configured}
          >
            Enregistrer
          </Button>

          <Button
            variant="outline"
            onClick={() => testMutation.mutate()}
            isLoading={testMutation.isPending}
            disabled={!canTest}
          >
            Tester la connexion
          </Button>
        </div>

        {/* Test result */}
        {testResult && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            testResult.success
              ? 'bg-primary/10 border border-primary/30 text-primary-dark'
              : 'bg-error/10 border border-error/30 text-error'
          }`}>
            {testResult.success ? 'Connexion réussie' : `Erreur : ${testResult.message}`}
          </div>
        )}
      </div>
    </div>
  );
}
