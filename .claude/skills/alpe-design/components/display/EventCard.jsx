import React, { useState } from 'react';

/** Carte événement — bourse, forum, nocturne. Date en capsule, image en haut, badge d'état. */
export function EventCard({ title, dateLabel, timeLabel, place, excerpt, image, badge, badgeTone = 'blue', href, cta = 'En savoir plus', style, ...rest }) {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--card-radius)', overflow: 'hidden',
        boxShadow: hover ? 'var(--card-shadow-hover)' : 'var(--card-shadow)', transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'box-shadow var(--duration-base) var(--ease-out), transform var(--duration-base) var(--ease-out)', ...style }} {...rest}>
      <div style={{ position: 'relative', height: 168, background: image ? 'var(--grey-100) center/cover no-repeat' : 'var(--surface-brand-soft)', backgroundImage: image ? 'url(' + image + ')' : undefined }}>
        {!image ? <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-300)', fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase' }}>Photo de l'événement</div> : null}
        {dateLabel ? <div style={{ position: 'absolute', top: 12, left: 12, background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: '6px 12px', boxShadow: 'var(--shadow-sm)', fontFamily: 'var(--font-heading)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-xs)', color: 'var(--brand-secondary)' }}>{dateLabel}</div> : null}
        {badge ? <div style={{ position: 'absolute', top: 12, right: 12 }}><span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 'var(--radius-pill)', background: badgeTone === 'warning' ? 'var(--warning-bg)' : 'var(--white)', color: badgeTone === 'warning' ? 'var(--warning-fg)' : 'var(--blue-700)', fontSize: 'var(--text-2xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>{badge}</span></div> : null}
      </div>
      <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1 }}>
        <h4 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-xl)', color: 'var(--text-heading)', textWrap: 'pretty' }}>{title}</h4>
        {(timeLabel || place) ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
          {timeLabel ? <span><i className="fa-solid fa-clock" aria-hidden="true" style={{ marginRight: 6, color: 'var(--blue-400)' }} />{timeLabel}</span> : null}
          {place ? <span><i className="fa-solid fa-location-dot" aria-hidden="true" style={{ marginRight: 6, color: 'var(--blue-400)' }} />{place}</span> : null}
        </div> : null}
        {excerpt ? <p style={{ margin: 0, fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-normal)', color: 'var(--text-body)' }}>{excerpt}</p> : null}
        {href ? <a href={href} style={{ marginTop: 'auto', paddingTop: 'var(--space-3)', fontSize: 'var(--text-sm)', fontWeight: 700, color: hover ? 'var(--text-link-hover)' : 'var(--text-link)', textDecoration: 'none' }}>{cta} →</a> : null}
      </div>
    </div>
  );
}
