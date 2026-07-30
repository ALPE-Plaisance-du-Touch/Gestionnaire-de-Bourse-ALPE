/**
 * Chart series colours.
 *
 * The ALPE design system defines no dataviz palette: three brand colours cannot
 * separate five categories, and the brand yellow is forbidden as a fill. These five
 * are drawn from the brand ramps and spread on lightness as much as on hue, which is
 * what keeps them apart for colourblind readers — under simulated protanopia the
 * closest pair sits at a distance of 96, against 44 for the ad-hoc Tailwind colours
 * they replace.
 *
 * Recharts takes plain values, not CSS classes, so these are duplicated from the
 * --color-chart-* tokens in index.css. Keep the two in step.
 */
export const CHART_COLORS = [
  '#033b53', // deep brand ink
  '#17aedb', // brand blue
  '#b95520', // deep brand orange
  '#c7ebf7', // pale brand blue
  '#f7a06c', // pale brand orange
] as const;

/** Single-series charts use the brand blue. */
export const CHART_PRIMARY = CHART_COLORS[1];

/** Comparison pairs read best with the two extremes of the ramp. */
export const CHART_PAIR = [CHART_COLORS[0], CHART_COLORS[2]] as const;
