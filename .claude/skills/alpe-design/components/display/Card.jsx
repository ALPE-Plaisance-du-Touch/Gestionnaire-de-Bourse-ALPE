import React, { useState } from 'react';

/** Carte ALPE — blanc, rayon 18px, ombre douce. Filet supérieur coloré pour un temps fort. */
export function Card({ children, accent, interactive = false, padding = 'var(--space-6)', muted = false, style, onClick, ...rest }) {
  const [hover, setHover] = useState(false);
  const accentColor = accent === 'orange' ? 'var(--brand-secondary)' : accent === 'yellow' ? 'var(--brand-accent)' : 'var(--brand-primary)';
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: muted ? 'var(--surface-card-muted)' : 'var(--surface-card)',
        border: '1px solid var(--border-subtle)', borderTop: accent ? '4px solid ' + accentColor : '1px solid var(--border-subtle)',
        borderRadius: 'var(--card-radius)', padding, overflow: 'hidden',
        boxShadow: interactive && hover ? 'var(--card-shadow-hover)' : 'var(--card-shadow)',
        transform: interactive && hover ? 'translateY(-2px)' : 'none',
        cursor: interactive ? 'pointer' : 'default',
        transition: 'box-shadow var(--duration-base) var(--ease-out), transform var(--duration-base) var(--ease-out)', ...style }} {...rest}>
      {children}
    </div>
  );
}
