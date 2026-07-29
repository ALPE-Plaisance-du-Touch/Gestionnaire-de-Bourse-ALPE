import * as React from 'react';

/** Fil d'Ariane des pages internes du site. */
export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items?: Array<string | { label: string; href?: string }>;
}
export function Breadcrumb(props: BreadcrumbProps): JSX.Element;
