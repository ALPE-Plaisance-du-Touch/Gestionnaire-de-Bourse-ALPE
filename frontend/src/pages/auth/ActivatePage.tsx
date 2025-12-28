import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { Button, Input } from '@/components/ui';
import { ApiException } from '@/api/client';

export function ActivatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activateAccount, isLoading } = useAuth();

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

    // Validate token
    if (!token) {
      setError("Lien d'activation invalide. Veuillez utiliser le lien reçu par email.");
      return;
    }

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
        if (err.code === 'INVALID_TOKEN') {
          setError("Le lien d'activation est invalide ou a expiré. Veuillez contacter l'association.");
        } else {
          setError(err.message);
        }
      } else {
        setError('Une erreur inattendue est survenue');
      }
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Lien invalide</h1>
          <p className="text-gray-600 mb-6">
            Ce lien d'activation n'est pas valide. Veuillez utiliser le lien reçu par email lors de votre invitation.
          </p>
          <Link to="/login" className="text-blue-600 hover:text-blue-500">
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

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
