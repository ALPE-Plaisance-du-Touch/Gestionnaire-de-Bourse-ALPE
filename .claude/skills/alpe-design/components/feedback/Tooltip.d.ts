import * as React from 'react';

/** Infobulle sur un élément d'interface. Une poignée de mots, jamais une phrase entière. */
export interface TooltipProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string;
  placement?: 'top' | 'bottom';
  children?: React.ReactNode;
}
export function Tooltip(props: TooltipProps): JSX.Element;
