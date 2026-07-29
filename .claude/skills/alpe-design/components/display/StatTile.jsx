import React from 'react';

/** Chiffre clé — la preuve d'échelle de l'association. Baloo 2, très grand. */
export function StatTile({ value, label, sublabel, tone = 'blue', align = 'left', style, ...rest }) {
  const fg = tone === 'orange' ? 'var(--brand-secondary)' : tone === 'inverse' ? 'var(--white)' : 'var(--brand-primary)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: align, ...style }} {...rest}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-extrabold)', fontSize: 'var(--text-4xl)', lineHeight: 'var(--leading-tight)', color: fg, whiteSpace: 'nowrap' }}>{value}</span>
      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)', color: tone === 'inverse' ? 'rgba(255,255,255,.92)' : 'var(--text-strong)' }}>{label}</span>
      {sublabel ? <span style={{ fontSize: 'var(--text-2xs)', color: tone === 'inverse' ? 'rgba(255,255,255,.7)' : 'var(--text-muted)' }}>{sublabel}</span> : null}
    </div>
  );
}
