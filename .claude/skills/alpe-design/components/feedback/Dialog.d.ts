import * as React from 'react';

/** Modale — confirmation d'adhésion, détail d'un créneau, formulaire court. Voile bleu profond, sans flou. */
export interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  title?: string;
  /** Actions en pied, généralement deux Button */
  footer?: React.ReactNode;
  onClose?: () => void;
  width?: number;
  children?: React.ReactNode;
}
export function Dialog(props: DialogProps): JSX.Element | null;
