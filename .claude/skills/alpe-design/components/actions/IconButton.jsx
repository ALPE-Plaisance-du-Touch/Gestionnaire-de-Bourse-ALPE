import React, { useState } from 'react';

const alpeIconButtonSizes = { sm: 34, md: 42, lg: 52 };

/** Bouton icône seule — toujours accompagné d'un label accessible. */
export function IconButton({ icon, label, variant = 'ghost', size = 'md', disabled = false, onClick, style, ...rest }) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const d = alpeIconButtonSizes[size] || 42;
  const solid = variant === 'primary' || variant === 'secondary';
  const base = variant === 'secondary' ? 'var(--brand-secondary)' : variant === 'primary' ? 'var(--brand-primary)' : 'transparent';
  const hoverBg = solid ? (variant === 'secondary' ? 'var(--brand-secondary-hover)' : 'var(--brand-primary-hover)') : 'var(--surface-brand-soft)';
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)}
      style={{ width: d, height: d, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size === 'sm' ? 14 : size === 'lg' ? 20 : 16,
        color: solid ? 'var(--text-on-brand)' : 'var(--blue-600)',
        background: hover && !disabled ? hoverBg : base,
        border: variant === 'outline' ? '2px solid var(--brand-primary)' : '2px solid transparent',
        borderRadius: 'var(--radius-circle)', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1, transform: press ? 'scale(var(--press-scale))' : 'none',
        transition: 'background var(--duration-fast) var(--ease-out), transform var(--duration-instant) var(--ease-out)', ...style }} {...rest}>
      <i className={icon} aria-hidden="true" />
    </button>
  );
}
