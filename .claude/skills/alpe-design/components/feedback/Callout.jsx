import React from 'react';

const alpeCalloutTones = {
  info: { bg: 'var(--info-bg)', fg: 'var(--info-fg)', icon: 'fa-solid fa-circle-info' },
  warning: { bg: 'var(--warning-bg)', fg: 'var(--warning-fg)', icon: 'fa-solid fa-triangle-exclamation' },
  success: { bg: 'var(--success-bg)', fg: 'var(--success-fg)', icon: 'fa-solid fa-circle-check' },
  danger: { bg: 'var(--danger-bg)', fg: 'var(--danger-fg)', icon: 'fa-solid fa-circle-exclamation' },
};

/** Encart d'information dans le corps d'une page (créneaux complets, changement de salle). */
export function Callout({ tone = 'info', title, children, style, ...rest }) {
  const t = alpeCalloutTones[tone] || alpeCalloutTones.info;
  return (
    <div style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-5)', background: t.bg,
      borderRadius: 'var(--radius-lg)', border: '1px solid ' + t.bg, ...style }} {...rest}>
      <i className={t.icon} aria-hidden="true" style={{ color: t.fg, fontSize: 18, marginTop: 2 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {title ? <strong style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-base)', color: t.fg }}>{title}</strong> : null}
        <div style={{ fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-normal)', color: 'var(--text-body)' }}>{children}</div>
      </div>
    </div>
  );
}
