import * as React from 'react';

/**
 * Chiffre clé ALPE (170 familles, 10 000 articles, 90 exposants, 12 établissements).
 * Écrire le nombre au chiffre près, format français avec espace insécable fine.
 *
 * @startingPoint section="Contenu" subtitle="Bandeau de chiffres clés" viewport="700x200"
 */
export interface StatTileProps extends React.HTMLAttributes<HTMLDivElement> {
  value: React.ReactNode;
  label: string;
  sublabel?: string;
  /** inverse = sur aplat bleu */
  tone?: 'blue' | 'orange' | 'inverse';
  align?: 'left' | 'center';
}
export function StatTile(props: StatTileProps): JSX.Element;
