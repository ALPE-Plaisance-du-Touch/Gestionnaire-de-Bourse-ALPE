import * as React from 'react';

/** Case à cocher (consentement RGPD, engagement bénévole, options de dépôt). */
export interface CheckboxProps {
  label: React.ReactNode;
  /** Deuxième ligne discrète sous le libellé */
  description?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  style?: React.CSSProperties;
}
export function Checkbox(props: CheckboxProps): JSX.Element;
