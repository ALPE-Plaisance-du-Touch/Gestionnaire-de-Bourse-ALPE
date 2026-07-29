import React, { useState } from 'react';

/** Champ de saisie ALPE — libellé au-dessus, arrondi doux, anneau de focus bleu. */
export function Input({ label, hint, error, icon, type = 'text', multiline = false, rows = 4, required = false, disabled = false, id, style, ...rest }) {
  const [focus, setFocus] = useState(false);
  const fieldId = id || 'alpe-input-' + (label || type).replace(/\s+/g, '-').toLowerCase();
  const fieldStyle = {
    width: '100%', minHeight: multiline ? undefined : 'var(--control-height-md)',
    padding: multiline ? '12px 14px' : icon ? '0 14px 0 40px' : '0 14px',
    fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-strong)',
    background: disabled ? 'var(--grey-50)' : 'var(--white)',
    border: '1px solid ' + (error ? 'var(--danger-fg)' : focus ? 'var(--brand-primary)' : 'var(--border-default)'),
    borderRadius: multiline ? 'var(--radius-md)' : 'var(--radius-md)',
    boxShadow: focus ? 'var(--shadow-focus)' : 'none', outline: 'none',
    transition: 'border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)',
    resize: multiline ? 'vertical' : undefined, lineHeight: multiline ? 'var(--leading-normal)' : undefined,
  };
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', ...style }}>
      {label ? <label htmlFor={fieldId} style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--text-strong)', fontFamily: 'var(--font-body)' }}>{label}{required ? <span style={{ color: 'var(--brand-secondary)' }}> *</span> : null}</label> : null}
      <div style={{ position: 'relative' }}>
        {icon && !multiline ? <i className={icon} aria-hidden="true" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', fontSize: 14 }} /> : null}
        <Tag id={fieldId} type={multiline ? undefined : type} rows={multiline ? rows : undefined} disabled={disabled} required={required}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} style={fieldStyle} {...rest} />
      </div>
      {error ? <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--danger-fg)', fontWeight: 'var(--weight-semibold)' }}>{error}</span>
        : hint ? <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>{hint}</span> : null}
    </div>
  );
}
