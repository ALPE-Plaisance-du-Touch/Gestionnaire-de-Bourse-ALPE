import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { Button, Input } from '@/components/ui';
import { ApiException } from '@/api/client';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Get redirect path and success message from location state
  const locationState = location.state as { from?: string; message?: string } | null;
  const from = locationState?.from || '/';
  const successMessage = locationState?.message || null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiException) {
        // For authentication errors (401), show a generic message for security
        if (err.status === 401) {
          setError('Identifiants incorrects. Vérifiez votre email et mot de passe.');
        } else if (err.status === 0) {
          setError('Impossible de contacter le serveur. Vérifiez votre connexion.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Une erreur inattendue est survenue. Veuillez réessayer.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">
            Bourse ALPE
          </h1>
          <h2 className="mt-2 text-center text-xl text-gray-600">
            Connexion à votre compte
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {successMessage && !error && (
            <div
              className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
              role="status"
            >
              {successMessage}
            </div>
          )}
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

            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center justify-between">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !email || !password}
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Vous avez reçu une invitation ?{' '}
          <Link
            to="/activate"
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Activer mon compte
          </Link>
        </p>
      </div>
    </div>
  );
}
