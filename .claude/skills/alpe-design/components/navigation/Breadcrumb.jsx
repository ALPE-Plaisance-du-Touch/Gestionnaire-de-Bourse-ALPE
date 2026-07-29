import React from 'react';

/** Fil d'Ariane — reprend la hiérarchie du menu du site. */
export function Breadcrumb({ items = [], style, ...rest }) {
  return (
    <nav aria-label="Fil d'Ariane" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', fontSize: 'var(--text-2xs)', ...style }} {...rest}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        const label = typeof it === 'string' ? it : it.label;
        const href = typeof it === 'string' ? undefined : it.href;
        return (
          <React.Fragment key={label}>
            {href && !last
              ? <a href={href} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>{label}</a>
              : <span style={{ color: last ? 'var(--text-strong)' : 'var(--text-muted)', fontWeight: last ? 700 : 600 }} aria-current={last ? 'page' : undefined}>{label}</span>}
            {!last ? <i className="fa-solid fa-chevron-right" aria-hidden="true" style={{ fontSize: 8, color: 'var(--text-subtle)' }} /> : null}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
