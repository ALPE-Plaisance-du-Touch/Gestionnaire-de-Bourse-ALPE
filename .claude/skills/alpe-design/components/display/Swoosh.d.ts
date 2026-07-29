import * as React from 'react';

/**
 * Courbe jaune reprise du logo — seul ornement graphique de la marque.
 * À poser derrière un titre, en séparateur de section ou en pied d'affiche.
 * Une seule occurrence par support.
 */
export interface SwooshProps extends React.SVGAttributes<SVGElement> {
  color?: string;
  /** Épaisseur du trait, 8–10 px en usage écran */
  thickness?: number;
  width?: string | number;
  height?: string | number;
  /** Inverse la courbure */
  flip?: boolean;
}
export function Swoosh(props: SwooshProps): JSX.Element;
