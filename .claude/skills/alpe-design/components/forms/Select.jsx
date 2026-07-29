import React, { useState } from 'react';

/** Liste déroulante — même gabarit que Input, chevron Font Awesome. */
export function Select({ label, hint, error, options = [], placeholder, disabled = false, id, style, ...rest }) {
  const [focus, setFocus] = useState(false);
  const fieldId = id || 'alpe-select-' + (label || 'field').replace(/\s+/g, '-').toLowerCase();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', ...style }}>
      {label ? <label htmlFor={fieldId} style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--text-strong)' }}>{label}</label> : null}
      <div style={{ position: 'relative' }}>
        <select id={fieldId} disabled={disabled} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ width: '100%', height: 'var(--control-height-md)', padding: '0 40px 0 14px', appearance: 'none',
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-strong)',
            background: disabled ? 'var(--grey-50)' : 'var(--white)',
            border: '1px solid ' + (error ? 'var(--danger-fg)' : focus ? 'var(--brand-primary)' : 'var(--border-default)'),
            borderRadius: 'var(--radius-md)', boxShadow: focus ? 'var(--shadow-focus)' : 'none', outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer' }} {...rest}>
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((o) => { const v = typeof o === 'string' ? o : o.value; const l = typeof o === 'string' ? o : o.label; return <option key={v} value={v}>{l}</option>; })}
        </select>
        <i className="fa-solid fa-chevron-down" aria-hidden="true" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--blue-500)', fontSize: 12, pointerEvents: 'none' }} />
      </div>
      {error ? <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--danger-fg)', fontWeight: 'var(--weight-semibold)' }}>{error}</span>
        : hint ? <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>{hint}</span> : null}
    </div>
  );
}
