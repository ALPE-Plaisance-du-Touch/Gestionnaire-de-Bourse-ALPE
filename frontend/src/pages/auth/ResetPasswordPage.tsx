import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { apiClient, ApiException } from '@/api/client';
import { useConfig } from '@/hooks';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { config } = useConfig();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const token = searchParams.get('token') || '';

  const validatePassword = (pwd: string): boolean => {
    // Min 8 chars, at least one letter, one number, one special char
    const pattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return pattern.test(pwd);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value && !validatePassword(value)) {
      setPasswordError(
        'Le mot de passe doit contenir au moins 8 caractères, une lettre, un chiffre et un caractère spécial (@$!%*#?&)'
      );
    } else {
      setPasswordError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password match
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    // Validate password strength
    if (!validatePassword(password)) {
      setError('Le mot de passe ne respecte pas les critères de sécurité');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/v1/auth/password/reset', { token, password });
      navigate('/login', {
        state: { message: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.' },
      });
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.status === 0) {
          setError('Impossible de contacter le serveur. Vérifiez votre connexion.');
        } else if (err.status === 400) {
          const detail = err.message.toLowerCase();
          if (detail.includes('expired')) {
            setTokenError('Ce lien de réinitialisation a expiré. Veuillez refaire une demande.');
          } else if (detail.includes('invalid')) {
            setTokenError('Ce lien de réinitialisation n\'est pas valide.');
          } else {
            setError(err.message);
          }
        } else {
          setError(err.message);
        }
      } else {
        setError('Une erreur inattendue est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // No token provided
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Lien invalide</h1>
          <p className="text-gray-600 mb-6">
            Ce lien de réinitialisation n'est pas valide. Veuillez utiliser le lien reçu par email.
          </p>
          <div className="space-y-4">
            <Link
              to="/forgot-password"
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Demander un nouveau lien
            </Link>
            <div className="pt-4">
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Token error (expired or invalid)
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-6">
            <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Lien expiré</h1>
          <p className="text-gray-600 mb-2">{tokenError}</p>
          <p className="text-sm text-gray-500 mb-6">
            Les liens de réinitialisation sont valides pendant 24 heures.
          </p>
          <div className="space-y-4">
            <Link
              to="/forgot-password"
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Demander un nouveau lien
            </Link>
            <p className="text-sm text-gray-500 pt-4">
              Besoin d'aide ? Contactez le support :
            </p>
            <a
              href={`mailto:${config.supportEmail}`}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              {config.supportEmail}
            </a>
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
            Nouveau mot de passe
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Choisissez un nouveau mot de passe pour votre compte.
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
              label="Nouveau mot de passe"
              type="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="Votre nouveau mot de passe"
              required
              autoComplete="new-password"
              autoFocus
            />
            {passwordError && (
              <p className="mt-1 text-sm text-amber-600">{passwordError}</p>
            )}

            <Input
              label="Confirmer le mot de passe"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmez votre mot de passe"
              required
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !password || !confirmPassword || !!passwordError}
          >
            {isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
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
