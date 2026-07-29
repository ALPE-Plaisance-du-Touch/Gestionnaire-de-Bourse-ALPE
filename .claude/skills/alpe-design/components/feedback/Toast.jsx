import React from 'react';

const alpeToastTones = {
  success: { fg: 'var(--success-fg)', icon: 'fa-solid fa-circle-check' },
  info: { fg: 'var(--info-fg)', icon: 'fa-solid fa-circle-info' },
  danger: { fg: 'var(--danger-fg)', icon: 'fa-solid fa-circle-exclamation' },
};

/** Notification brève — carte blanche, filet coloré à gauche, ombre lg. */
export function Toast({ tone = 'success', title, message, onClose, style, ...rest }) {
  const t = alpeToastTones[tone] || alpeToastTones.success;
  return (
    <div role="status" style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', minWidth: 300, maxWidth: 420,
      padding: 'var(--space-4)', background: 'var(--surface-card)', borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-subtle)', ...style }} {...rest}>
      <i className={t.icon} aria-hidden="true" style={{ color: t.fg, fontSize: 16, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        {title ? <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-strong)' }}>{title}</div> : null}
        {message ? <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', marginTop: 2 }}>{message}</div> : null}
      </div>
      {onClose ? <button onClick={onClose} aria-label="Fermer" style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--text-subtle)', fontSize: 13 }}><i className="fa-solid fa-xmark" aria-hidden="true" /></button> : null}
    </div>
  );
}
