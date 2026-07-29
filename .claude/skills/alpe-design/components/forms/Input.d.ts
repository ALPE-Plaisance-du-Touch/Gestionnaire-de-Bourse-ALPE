import * as React from 'react';

/** Champ texte / e-mail / téléphone / zone de texte. Libellé au-dessus, jamais en placeholder seul. */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Aide sous le champ, ex. « Nous ne diffusons jamais votre adresse. » */
  hint?: string;
  /** Message d'erreur — remplace l'aide et colore la bordure */
  error?: string;
  /** Classe Font Awesome affichée à gauche */
  icon?: string;
  multiline?: boolean;
  rows?: number;
}
export function Input(props: InputProps): JSX.Element;
