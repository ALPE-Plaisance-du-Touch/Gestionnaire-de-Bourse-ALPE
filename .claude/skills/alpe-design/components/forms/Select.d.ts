import * as React from 'react';

/** Liste déroulante (établissement, niveau de classe, créneau de dépôt). */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** Chaînes simples ou objets { value, label } */
  options?: Array<string | { value: string; label: string }>;
  placeholder?: string;
}
export function Select(props: SelectProps): JSX.Element;
