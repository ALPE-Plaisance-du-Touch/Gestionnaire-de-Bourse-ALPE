import * as React from 'react';

/** Interrupteur à effet immédiat (filtre d'affichage, préférence de notification). */
export interface SwitchProps {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  style?: React.CSSProperties;
}
export function Switch(props: SwitchProps): JSX.Element;
