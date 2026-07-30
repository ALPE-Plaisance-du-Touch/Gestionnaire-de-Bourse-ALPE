import logoAlpe from '@/assets/logo/logo-alpe-v2-complet.png';

interface AuthHeaderProps {
  subtitle: string;
  /** Optional line of guidance under the subtitle. */
  hint?: string;
}

/**
 * Header for the authentication screens: the ALPE logo above a one-line subtitle.
 *
 * The four auth pages each rendered "Bourse ALPE" as plain text. This is the only
 * part of the app an adherent sees before signing in, so it carries the real logo.
 *
 * The yellow curve under the logo is the brand's swoosh — its single ornament. The
 * design system allows it once per surface, and this is where it belongs.
 */
export function AuthHeader({ subtitle, hint }: AuthHeaderProps) {
  return (
    <div className="text-center">
      {/* The logo is the page's h1: replacing the old text heading with a bare image
          would have left these screens without a level-1 heading.

          PNG rather than the SVG: an SVG loaded through <img> is an isolated document
          with no access to the page's fonts, so the "ALPE" lettering fell back to a
          system face instead of Grandstander. The design system flags exactly this. */}
      <h1>
        <img
          src={logoAlpe}
          alt="Bourse ALPE — Association Locale de Parents d'Élèves, Plaisance du Touch"
          className="mx-auto h-24 w-auto"
        />
      </h1>
      <svg
        className="mx-auto mt-2 h-3 w-40"
        viewBox="0 0 160 12"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2 8C30 2 60 10 80 6s50-8 78-2"
          stroke="var(--color-swoosh)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
      <p className="mt-4 text-lg text-bark-light">{subtitle}</p>
      {hint && <p className="mt-2 text-sm text-bark-light">{hint}</p>}
    </div>
  );
}
