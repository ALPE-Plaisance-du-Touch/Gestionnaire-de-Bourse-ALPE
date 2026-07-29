import * as React from 'react';

/** Groupe radio — choix unique et exclusif (type d'adhésion, jour de créneau). */
export interface RadioProps {
  name: string;
  options?: Array<string | { value: string; label: string }>;
  value?: string;
  onChange?: (value: string) => void;
  legend?: string;
  inline?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}
export function Radio(props: RadioProps): JSX.Element;
