import * as React from 'react';

/**
 * Conteneur de contenu générique. Jamais de fond saturé : un temps fort se signale
 * par le filet supérieur `accent`, pas par un aplat de couleur.
 *
 * @startingPoint section="Contenu" subtitle="Carte ALPE, filet d'accent et survol" viewport="700x260"
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Filet supérieur de 4px */
  accent?: 'blue' | 'orange' | 'yellow';
  /** Active l'ombre + translation -2px au survol */
  interactive?: boolean;
  /** Padding interne, défaut var(--space-6) */
  padding?: string;
  /** Fond gris très clair au lieu du blanc */
  muted?: boolean;
  children?: React.ReactNode;
}
export function Card(props: CardProps): JSX.Element;
