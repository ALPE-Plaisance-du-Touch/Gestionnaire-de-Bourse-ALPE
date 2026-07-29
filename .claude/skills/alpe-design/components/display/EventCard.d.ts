import * as React from 'react';

/**
 * Carte d'événement ALPE (bourse aux vêtements, forum des métiers, nocturne, réunion).
 * L'image est une photo réelle de l'événement ; en son absence, la zone reste
 * volontairement vide avec la mention « Photo de l'événement ».
 *
 * @startingPoint section="Contenu" subtitle="Carte d'événement avec date et lieu" viewport="700x400"
 */
export interface EventCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  /** Ex. « 18 & 19 avril 2026 » */
  dateLabel?: string;
  /** Ex. « 9h à 18h » */
  timeLabel?: string;
  /** Ex. « Espace Monestié » */
  place?: string;
  /** 1–2 phrases maximum */
  excerpt?: string;
  /** URL de la photo de l'événement */
  image?: string;
  /** Ex. « Complet » */
  badge?: string;
  badgeTone?: 'blue' | 'warning';
  href?: string;
  cta?: string;
}
export function EventCard(props: EventCardProps): JSX.Element;
