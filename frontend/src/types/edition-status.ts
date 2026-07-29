import type { EditionStatus } from './edition';

/**
 * Single source of truth for how an edition status is displayed.
 *
 * This table used to be duplicated in EditionsListPage and EditionDetailPage, and the
 * two copies had drifted: the same status rendered in different colours, and one said
 * "Clôturé" while the other said "Clôturée".
 *
 * One distinct style per lifecycle step — registrations_open and closed once shared a
 * style, as did deposit and sale, which made opposite states look identical. Every
 * pairing below clears AA at small text sizes.
 */
export const EDITION_STATUS_DISPLAY: Record<
  EditionStatus,
  { label: string; className: string }
> = {
  draft: { label: 'Brouillon', className: 'bg-cream-dark text-bark' },
  registrations_open: {
    label: 'Inscriptions ouvertes',
    className: 'bg-info-soft text-primary-strong',
  },
  deposit: { label: 'Dépôt', className: 'bg-warning-soft text-warning-strong' },
  sale: { label: 'Vente', className: 'bg-success-soft text-success-strong' },
  settlement: { label: 'Bilan', className: 'bg-warning-deep text-warning-strong' },
  closed: {
    label: 'Clôturée',
    className: 'bg-white border border-sand text-bark-light',
  },
  archived: { label: 'Archivé', className: 'bg-cream-dark text-bark-muted' },
};
