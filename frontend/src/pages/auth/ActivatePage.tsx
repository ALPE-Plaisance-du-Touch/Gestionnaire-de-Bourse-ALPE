import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { Button, Input } from '@/components/ui';
import { ApiException, apiClient } from '@/api/client';
import { useConfig } from '@/hooks';

interface TokenValidationResult {
  valid: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
  expiresAt?: string;
  error?: string;
  message?: string;
}

type TokenStatus = 'loading' | 'valid' | 'invalid' | 'expired' | 'already_activated';

export function ActivatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activateAccount, isLoading } = useAuth();
  const { config } = useConfig();

  // Token validation state
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('loading');
  const [tokenError, setTokenError] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Get token from URL query params
  const token = searchParams.get('token') || '';

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setTokenStatus('invalid');
        setTokenError("Lien d'activation invalide. Veuillez utiliser le lien reçu par email.");
        return;
      }

      try {
        const response = await apiClient.get<TokenValidationResult>(
          `/v1/auth/validate-token/${token}`
        );
        const data = response.data;

        if (data.valid) {
          setTokenStatus('valid');
          setUserEmail(data.email || '');
          // Pre-fill form with user data
          if (data.firstName) setFirstName(data.firstName);
          if (data.lastName) setLastName(data.lastName);
        } else {
          // Handle specific error types
          switch (data.error) {
            case 'TOKEN_EXPIRED':
              setTokenStatus('expired');
              break;
            case 'ALREADY_ACTIVATED':
              setTokenStatus('already_activated');
              break;
            default:
              setTokenStatus('invalid');
          }
          setTokenError(data.message || "Ce lien d'invitation n'est pas valide.");
        }
      } catch (err) {
        setTokenStatus('invalid');
        setTokenError("Impossible de vérifier le lien d'activation. Veuillez réessayer.");
      }
    }

    validateToken();
  }, [token]);

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

    // Validate terms acceptance
    if (!acceptTerms) {
      setError('Vous devez accepter les conditions générales');
      return;
    }

    try {
      await activateAccount({
        token,
        password,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        phone: phone || undefined,
        accept_terms: acceptTerms,
      });
      navigate('/login', {
        state: { message: 'Votre compte a été activé avec succès. Vous pouvez maintenant vous connecter.' },
      });
    } catch (err) {
      if (err instanceof ApiException) {
        // Handle specific errors
        if (err.status === 400) {
          const detail = err.message.toLowerCase();
          if (detail.includes('expired')) {
            setTokenStatus('expired');
            setTokenError("Ce lien d'invitation a expiré.");
          } else if (detail.includes('already activated')) {
            setTokenStatus('already_activated');
            setTokenError('Ce compte a déjà été activé. Utilisez la page de connexion.');
          } else if (detail.includes('invalid')) {
            setTokenStatus('invalid');
            setTokenError("Ce lien d'invitation n'est pas valide.");
          } else {
            setError(err.message);
          }
        } else {
          setError(err.message);
        }
      } else {
        setError('Une erreur inattendue est survenue. Veuillez réessayer.');
      }
    }
  };

  // Loading state
  if (tokenStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification du lien d'activation...</p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (tokenStatus === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Lien invalide</h1>
          <p className="text-gray-600 mb-6">{tokenError}</p>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Besoin d'aide ? Contactez le support :
            </p>
            <a
              href={`mailto:${config.supportEmail}`}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              {config.supportEmail}
            </a>
            <div className="pt-4">
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Token expired
  if (tokenStatus === 'expired') {
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
            Les liens d'activation sont valides pendant 7 jours.
          </p>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Pour recevoir une nouvelle invitation, contactez le support :
            </p>
            <a
              href={`mailto:${config.supportEmail}`}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              {config.supportEmail}
            </a>
            <div className="pt-4">
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Already activated
  if (tokenStatus === 'already_activated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Compte déjà activé</h1>
          <p className="text-gray-600 mb-6">
            Ce compte a déjà été activé. Vous pouvez vous connecter avec votre email et mot de passe.
          </p>
          <div className="space-y-4">
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Se connecter
            </Link>
            <p className="text-sm text-gray-500 pt-4">
              Mot de passe oublié ?{' '}
              <Link to="/forgot-password" className="text-blue-600 hover:text-blue-500">
                Réinitialiser
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Valid token - show activation form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">
            Bourse ALPE
          </h1>
          <h2 className="mt-2 text-center text-xl text-gray-600">
            Activation de votre compte
          </h2>
          {userEmail && (
            <p className="mt-2 text-center text-sm text-gray-500">
              Compte : <span className="font-medium">{userEmail}</span>
            </p>
          )}
          <p className="mt-2 text-center text-sm text-gray-500">
            Complétez vos informations et choisissez votre mot de passe
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
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prénom"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jean"
                autoComplete="given-name"
              />

              <Input
                label="Nom"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dupont"
                autoComplete="family-name"
              />
            </div>

            <Input
              label="Téléphone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78"
              autoComplete="tel"
            />

            <div className="border-t border-gray-200 pt-4">
              <Input
                label="Mot de passe"
                type="password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Votre mot de passe"
                required
                autoComplete="new-password"
              />
              {passwordError && (
                <p className="mt-1 text-sm text-amber-600">{passwordError}</p>
              )}

              <div className="mt-4">
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
            </div>

            <div className="flex items-start pt-4">
              <input
                id="accept-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded mt-0.5"
                required
              />
              <label htmlFor="accept-terms" className="ml-2 text-sm text-gray-700">
                J'accepte le{' '}
                <a
                  href="/reglement-deposant"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-500"
                >
                  règlement des déposants
                </a>{' '}
                et les conditions générales d'utilisation
              </label>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !password || !confirmPassword || !acceptTerms || !!passwordError}
          >
            {isLoading ? 'Activation...' : 'Activer mon compte'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Vous avez déjà un compte ?{' '}
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
