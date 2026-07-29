import * as React from 'react';

/** En-tête de section : sur-titre en capitales orange, titre en phrase case, chapeau d'une phrase. */
export interface SectionTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Sur-titre en capitales, 1–3 mots */
  eyebrow?: string;
  title: React.ReactNode;
  /** Chapeau : une seule phrase */
  lead?: string;
  align?: 'left' | 'center';
  /** Soulignement jaune derrière le titre — une seule fois par page */
  swoosh?: boolean;
  /** Sur aplat bleu */
  inverse?: boolean;
  level?: 1 | 2 | 3;
}
export function SectionTitle(props: SectionTitleProps): JSX.Element;
