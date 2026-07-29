import * as React from 'react';

/** Notification brève après une action (adhésion enregistrée, message envoyé). */
export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: 'success' | 'info' | 'danger';
  title?: string;
  message?: string;
  onClose?: () => void;
}
export function Toast(props: ToastProps): JSX.Element;
