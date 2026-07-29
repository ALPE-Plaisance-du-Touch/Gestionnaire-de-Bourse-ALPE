import * as React from 'react';

/** Établissement scolaire couvert par ALPE, avec sa pastille de niveau. Douze au total. */
export interface SchoolChipProps extends React.HTMLAttributes<HTMLElement> {
  name: string;
  level?: 'maternelle' | 'elementaire' | 'college' | 'lycee';
  /** Seulement si hors Plaisance du Touch (La Salvetat, Tournefeuille) */
  city?: string;
  href?: string;
}
export function SchoolChip(props: SchoolChipProps): JSX.Element;
