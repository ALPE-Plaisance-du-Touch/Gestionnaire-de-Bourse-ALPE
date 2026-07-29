import React from 'react';

const alpeBadgeTones = {
  blue: { bg: 'var(--surface-brand-soft)', fg: 'var(--blue-700)' },
  orange: { bg: 'var(--surface-secondary-soft)', fg: 'var(--orange-700)' },
  yellow: { bg: 'var(--yellow-300)', fg: 'var(--grey-800)' },
  neutral: { bg: 'var(--grey-100)', fg: 'var(--grey-700)' },
  success: { bg: 'var(--success-bg)', fg: 'var(--success-fg)' },
  warning: { bg: 'var(--warning-bg)', fg: 'var(--warning-fg)' },
  danger: { bg: 'var(--danger-bg)', fg: 'var(--danger-fg)' },
  solid: { bg: 'var(--brand-primary)', fg: 'var(--text-on-brand)' },
};

/** Pastille d'état — statut d'un événement, niveau scolaire, mention « Complet ». */
export function Badge({ children, tone = 'blue', icon, style, ...rest }) {
  const t = alpeBadgeTones[tone] || alpeBadgeTones.blue;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
      background: t.bg, color: t.fg, borderRadius: 'var(--radius-pill)',
      fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', lineHeight: 1.4, ...style }} {...rest}>
      {icon ? <i className={icon} aria-hidden="true" /> : null}{children}
    </span>
  );
}
