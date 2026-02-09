interface PasswordStrengthIndicatorProps {
  password: string;
}

const CRITERIA = [
  { label: 'Au moins 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Au moins une lettre', test: (p: string) => /[A-Za-z]/.test(p) },
  { label: 'Au moins un chiffre', test: (p: string) => /\d/.test(p) },
  { label: 'Au moins un caractere special (@$!%*#?&)', test: (p: string) => /[@$!%*#?&]/.test(p) },
] as const;

function getStrength(score: number): { label: string; color: string; barColor: string; segments: number } {
  if (score <= 1) return { label: 'Faible', color: 'text-red-600', barColor: 'bg-red-500', segments: 1 };
  if (score <= 3) return { label: 'Moyen', color: 'text-amber-600', barColor: 'bg-amber-500', segments: 2 };
  return { label: 'Fort', color: 'text-green-600', barColor: 'bg-green-500', segments: 3 };
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const results = CRITERIA.map((c) => c.test(password));
  const score = results.filter(Boolean).length;
  const strength = getStrength(score);

  return (
    <div className="mt-2 space-y-2" aria-live="polite">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[1, 2, 3].map((segment) => (
            <div
              key={segment}
              className={`h-1.5 flex-1 rounded-full ${
                segment <= strength.segments ? strength.barColor : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${strength.color}`}>
          {strength.label}
        </span>
      </div>

      {/* Criteria checklist */}
      <ul className="space-y-0.5">
        {CRITERIA.map((criterion, i) => (
          <li
            key={i}
            className={`text-xs flex items-center gap-1.5 ${
              results[i] ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            {results[i] ? (
              <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {criterion.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
