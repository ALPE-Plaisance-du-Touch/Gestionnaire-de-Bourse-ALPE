import * as React from 'react';

/** Étiquette de filtre ou de catégorie, en casse normale. Pour un statut, utiliser `Badge`. */
export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  active?: boolean;
  onRemove?: () => void;
  children?: React.ReactNode;
}
export function Tag(props: TagProps): JSX.Element;
