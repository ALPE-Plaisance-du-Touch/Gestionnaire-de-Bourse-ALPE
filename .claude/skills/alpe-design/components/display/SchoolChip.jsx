import React, { useState } from 'react';

const alpeSchoolLevels = {
  maternelle: { label: 'Maternelle', bg: 'var(--surface-secondary-soft)', fg: 'var(--orange-700)' },
  elementaire: { label: 'Élémentaire', bg: 'var(--surface-brand-soft)', fg: 'var(--blue-700)' },
  college: { label: 'Collège', bg: 'var(--yellow-300)', fg: 'var(--grey-800)' },
  lycee: { label: 'Lycée', bg: 'var(--grey-100)', fg: 'var(--grey-700)' },
};

/** Un des douze établissements couverts par ALPE. */
export function SchoolChip({ name, level = 'elementaire', city, href, style, ...rest }) {
  const [hover, setHover] = useState(false);
  const l = alpeSchoolLevels[level] || alpeSchoolLevels.elementaire;
  const Tag = href ? 'a' : 'div';
  return (
    <Tag href={href} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '10px 16px 10px 12px',
        background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-pill)',
        textDecoration: 'none', boxShadow: hover && href ? 'var(--shadow-md)' : 'var(--shadow-xs)',
        transform: hover && href ? 'translateY(-1px)' : 'none', cursor: href ? 'pointer' : 'default',
        transition: 'box-shadow var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out)', ...style }} {...rest}>
      <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: l.bg, color: l.fg, fontSize: 10, fontWeight: 800, letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase' }}>{l.label}</span>
      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)', color: 'var(--text-heading)' }}>{name}</span>
      {city ? <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>{city}</span> : null}
    </Tag>
  );
}
