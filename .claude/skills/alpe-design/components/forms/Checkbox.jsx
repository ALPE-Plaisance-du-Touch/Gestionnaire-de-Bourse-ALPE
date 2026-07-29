import React from 'react';

/** Case à cocher — carré arrondi, coche Font Awesome, remplissage bleu. */
export function Checkbox({ label, description, checked = false, onChange, disabled = false, id, style }) {
  const fieldId = id || 'alpe-check-' + String(label).replace(/\s+/g, '-').toLowerCase();
  return (
    <label htmlFor={fieldId} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1, ...style }}>
      <input id={fieldId} type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange && onChange(e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
      <span aria-hidden="true" style={{ flex: '0 0 auto', width: 22, height: 22, marginTop: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: checked ? 'var(--brand-primary)' : 'var(--white)', border: '2px solid ' + (checked ? 'var(--brand-primary)' : 'var(--border-strong)'),
        borderRadius: 'var(--radius-xs)', color: 'var(--white)', fontSize: 11,
        transition: 'background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out)' }}>
        {checked ? <i className="fa-solid fa-check" /> : null}
      </span>
      <span>
        <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-strong)' }}>{label}</span>
        {description ? <span style={{ display: 'block', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', marginTop: 2 }}>{description}</span> : null}
      </span>
    </label>
  );
}
