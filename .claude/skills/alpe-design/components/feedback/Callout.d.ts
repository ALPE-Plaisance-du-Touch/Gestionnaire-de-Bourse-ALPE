import * as React from 'react';

/** Encart d'information en flux de page. Pour ALPE, c'est le pendant du « ⚠️ » utilisé dans les annonces. */
export interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: 'info' | 'warning' | 'success' | 'danger';
  title?: string;
  children?: React.ReactNode;
}
export function Callout(props: CalloutProps): JSX.Element;
