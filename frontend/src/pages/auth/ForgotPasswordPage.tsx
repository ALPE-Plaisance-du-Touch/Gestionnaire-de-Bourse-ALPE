import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { apiClient, ApiException } from '@/api/client';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await apiClient.post('/v1/auth/password/reset-request', { email });
      setIsSubmitted(true);
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.status === 0) {
          setError('Impossible de contacter le serveur. Vérifiez votre connexion.');
        } else {
          // API always returns success to prevent email enumeration
          setIsSubmitted(true);
        }
      } else {
        setError('Une erreur inattendue est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Email envoyé</h1>
          <p className="text-gray-600 mb-2">
            Si un compte existe avec l'adresse <span className="font-medium">{email}</span>,
            vous recevrez un email avec un lien pour réinitialiser votre mot de passe.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Le lien est valide pendant 24 heures.
          </p>
          <div className="space-y-4">
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">
            Bourse ALPE
          </h1>
          <h2 className="mt-2 text-center text-xl text-gray-600">
            Mot de passe oublié
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Entrez votre adresse email pour recevoir un lien de réinitialisation.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Adresse email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.fr"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !email}
          >
            {isLoading ? 'Envoi en cours...' : 'Envoyer le lien'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
