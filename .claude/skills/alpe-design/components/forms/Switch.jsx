import React from 'react';

/** Interrupteur — pour un réglage à effet immédiat, pas pour un formulaire à valider. */
export function Switch({ label, checked = false, onChange, disabled = false, id, style }) {
  const fieldId = id || 'alpe-switch-' + String(label).replace(/\s+/g, '-').toLowerCase();
  return (
    <label htmlFor={fieldId} style={{ display: 'inline-flex', gap: 'var(--space-3)', alignItems: 'center', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1, ...style }}>
      <input id={fieldId} type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange && onChange(e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
      <span aria-hidden="true" style={{ width: 44, height: 26, flex: '0 0 auto', padding: 3, borderRadius: 'var(--radius-pill)',
        background: checked ? 'var(--brand-primary)' : 'var(--grey-300)', transition: 'background var(--duration-base) var(--ease-out)' }}>
        <span style={{ display: 'block', width: 20, height: 20, borderRadius: '50%', background: 'var(--white)', boxShadow: 'var(--shadow-xs)',
          transform: checked ? 'translateX(18px)' : 'none', transition: 'transform var(--duration-base) var(--ease-out)' }} />
      </span>
      {label ? <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-strong)' }}>{label}</span> : null}
    </label>
  );
}
