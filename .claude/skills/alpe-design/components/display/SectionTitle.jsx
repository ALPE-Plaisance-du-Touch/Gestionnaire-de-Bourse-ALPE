import React from 'react';

/** Titre de section — sur-titre optionnel, titre, chapeau, et le swoosh jaune en option. */
export function SectionTitle({ eyebrow, title, lead, align = 'left', swoosh = false, inverse = false, level = 2, style, ...rest }) {
  const Heading = 'h' + level;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', textAlign: align, alignItems: align === 'center' ? 'center' : 'flex-start', maxWidth: 'var(--container-narrow)', ...style }} {...rest}>
      {eyebrow ? <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: inverse ? 'var(--yellow-500)' : 'var(--brand-secondary)' }}>{eyebrow}</span> : null}
      <Heading style={{ margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-3xl)', lineHeight: 'var(--leading-snug)', color: inverse ? 'var(--white)' : 'var(--text-heading)', textWrap: 'pretty', position: 'relative', display: 'inline-block' }}>
        <span style={{ position: 'relative', zIndex: 1 }}>{title}</span>
        {swoosh ? <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 4, height: 10, background: 'var(--brand-accent)', borderRadius: 'var(--radius-pill)', zIndex: 0 }} /> : null}
      </Heading>
      {lead ? <p style={{ margin: 0, fontSize: 'var(--text-lg)', lineHeight: 'var(--leading-normal)', color: inverse ? 'rgba(255,255,255,.86)' : 'var(--text-body)', textWrap: 'pretty' }}>{lead}</p> : null}
    </div>
  );
}
