import * as React from 'react';

/** Pastille d'état en capitales (« COMPLET », « NOUVEAU », « MATERNELLE »). Libellé de 1–2 mots. */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'blue' | 'orange' | 'yellow' | 'neutral' | 'success' | 'warning' | 'danger' | 'solid';
  /** Classe Font Awesome */
  icon?: string;
  children?: React.ReactNode;
}
export function Badge(props: BadgeProps): JSX.Element;
