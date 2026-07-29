import * as React from 'react';

/** Bouton circulaire à icône seule (réseaux sociaux, fermeture de modale, navigation de carrousel). */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Classe Font Awesome 6, ex. "fa-brands fa-facebook-f" */
  icon: string;
  /** Obligatoire : sert d'aria-label et de title */
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}
export function IconButton(props: IconButtonProps): JSX.Element;
