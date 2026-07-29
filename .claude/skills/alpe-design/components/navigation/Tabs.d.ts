import * as React from 'react';

/** Onglets en pilules — filtrage d'une liste (actualités par action, établissements par niveau). */
export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: Array<string | { value: string; label: string }>;
  /** Contrôlé si fourni */
  value?: string;
  onChange?: (value: string) => void;
}
export function Tabs(props: TabsProps): JSX.Element;
