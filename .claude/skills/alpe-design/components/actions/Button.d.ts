import * as React from 'react';

/**
 * Bouton d'action ALPE : pilule, Nunito 700, ombre douce sur les variantes pleines.
 * Libellé court à l'impératif ou à l'infinitif (« Adhérez », « En savoir plus »).
 *
 * @startingPoint section="Actions" subtitle="Boutons pilule ALPE, 5 variantes" viewport="700x200"
 */
export interface ButtonProps extends React.HTMLAttributes<HTMLElement> {
  /** primary = bleu (défaut) · secondary = orange, réservé à l'action principale d'une page · outline / ghost = actions calmes · inverse = sur aplat bleu */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'inverse';
  size?: 'sm' | 'md' | 'lg';
  /** Classe Font Awesome, ex. "fa-solid fa-arrow-right" */
  icon?: string;
  iconRight?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Rend un <a> au lieu d'un <button> */
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  children?: React.ReactNode;
}
export function Button(props: ButtonProps): JSX.Element;
