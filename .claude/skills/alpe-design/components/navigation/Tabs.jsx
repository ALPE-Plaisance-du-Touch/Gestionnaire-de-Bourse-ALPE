import React, { useState } from 'react';

/** Onglets ALPE — pilules pleines pour l'onglet actif. */
export function Tabs({ items = [], value, onChange, style, ...rest }) {
  const [internal, setInternal] = useState(items.length ? (typeof items[0] === 'string' ? items[0] : items[0].value) : null);
  const current = value !== undefined ? value : internal;
  const pick = (v) => { setInternal(v); if (onChange) onChange(v); };
  return (
    <div role="tablist" style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', ...style }} {...rest}>
      {items.map((it) => {
        const v = typeof it === 'string' ? it : it.value;
        const l = typeof it === 'string' ? it : it.label;
        const on = current === v;
        return (
          <button key={v} role="tab" aria-selected={on} onClick={() => pick(v)}
            style={{ height: 'var(--control-height-sm)', padding: '0 18px', border: 0, cursor: 'pointer',
              borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)',
              background: on ? 'var(--brand-primary)' : 'var(--grey-50)', color: on ? 'var(--text-on-brand)' : 'var(--blue-700)',
              transition: 'background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)' }}>
            {l}
          </button>
        );
      })}
    </div>
  );
}
