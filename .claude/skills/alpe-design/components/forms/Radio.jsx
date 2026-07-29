import React from 'react';

/** Groupe de boutons radio — un seul choix, pastille bleue pleine. */
export function Radio({ name, options = [], value, onChange, legend, inline = false, disabled = false, style }) {
  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', ...style }}>
      {legend ? <legend style={{ padding: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--text-strong)' }}>{legend}</legend> : null}
      <div style={{ display: 'flex', flexDirection: inline ? 'row' : 'column', gap: inline ? 'var(--space-6)' : 'var(--space-3)' }}>
        {options.map((o) => {
          const v = typeof o === 'string' ? o : o.value;
          const l = typeof o === 'string' ? o : o.label;
          const on = value === v;
          return (
            <label key={v} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1 }}>
              <input type="radio" name={name} value={v} checked={on} disabled={disabled} onChange={() => onChange && onChange(v)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
              <span aria-hidden="true" style={{ width: 22, height: 22, flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid ' + (on ? 'var(--brand-primary)' : 'var(--border-strong)'), borderRadius: '50%', background: 'var(--white)',
                transition: 'border-color var(--duration-fast) var(--ease-out)' }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: on ? 'var(--brand-primary)' : 'transparent', transition: 'background var(--duration-fast) var(--ease-out)' }} />
              </span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-strong)' }}>{l}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
