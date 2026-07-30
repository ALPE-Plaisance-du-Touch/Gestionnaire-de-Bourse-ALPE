import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { Button, Input } from '@/components/ui';
import { Card } from '@/components/ui/Card';
import { ApiException } from '@/api/client';
import { AuthHeader } from '@/components/auth/AuthHeader';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen flex items-center justify-center bg-cream py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <AuthHeader subtitle="Connexion à votre compte" />

        <Card variant="elevated" padding="lg">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {successMessage && !error && (
              <div className="bg-info-soft border border-primary/40 text-primary-strong px-4 py-3 rounded-xl text-sm" role="status">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="bg-error-soft border border-error/40 text-error-dark px-4 py-3 rounded-xl text-sm" role="alert">
                {error}
              </div>
            )}

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

            <div className="flex items-center justify-between">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-strong hover:text-primary-strong font-medium transition-colors"
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
        </Card>

        <p className="text-center text-sm text-bark-muted">
          Vous avez reçu une invitation ?{' '}
          <Link
            to="/activate"
            className="text-primary-strong hover:text-primary-strong font-medium transition-colors"
          >
            Activer mon compte
          </Link>
        </p>
      </div>
    </div>
  );
}
