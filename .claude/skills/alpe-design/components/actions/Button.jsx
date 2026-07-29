import React, { useState } from 'react';

const alpeButtonPalette = {
  primary: { bg: 'var(--brand-primary)', hover: 'var(--brand-primary-hover)', active: 'var(--brand-primary-active)', fg: 'var(--text-on-brand)', border: 'transparent' },
  secondary: { bg: 'var(--brand-secondary)', hover: 'var(--brand-secondary-hover)', active: 'var(--brand-secondary-active)', fg: 'var(--text-on-brand)', border: 'transparent' },
  outline: { bg: 'transparent', hover: 'var(--surface-brand-soft)', active: 'var(--blue-100)', fg: 'var(--blue-600)', border: 'var(--brand-primary)' },
  ghost: { bg: 'transparent', hover: 'var(--surface-brand-soft)', active: 'var(--blue-100)', fg: 'var(--blue-600)', border: 'transparent' },
  inverse: { bg: 'var(--white)', hover: 'var(--blue-50)', active: 'var(--blue-100)', fg: 'var(--blue-700)', border: 'transparent' },
};

const alpeButtonSizes = {
  sm: { height: 'var(--control-height-sm)', padding: '0 16px', font: 'var(--text-xs)' },
  md: { height: 'var(--control-height-md)', padding: '0 24px', font: 'var(--text-sm)' },
  lg: { height: 'var(--control-height-lg)', padding: '0 32px', font: 'var(--text-base)' },
};

/** Bouton d'action ALPE — pilule, police Nunito 700. */
export function Button({ variant = 'primary', size = 'md', children, icon, iconRight, disabled = false, fullWidth = false, href, onClick, type = 'button', style, ...rest }) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const p = alpeButtonPalette[variant] || alpeButtonPalette.primary;
  const s = alpeButtonSizes[size] || alpeButtonSizes.md;
  const css = {
    display: fullWidth ? 'flex' : 'inline-flex', width: fullWidth ? '100%' : 'auto',
    alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)',
    height: s.height, padding: s.padding, fontSize: s.font,
    fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-bold)',
    lineHeight: 1, textDecoration: 'none', whiteSpace: 'nowrap',
    color: p.fg, background: disabled ? p.bg : press ? p.active : hover ? p.hover : p.bg,
    border: '2px solid ' + p.border, borderRadius: 'var(--control-radius)',
    boxShadow: variant === 'primary' || variant === 'secondary' ? 'var(--shadow-sm)' : 'none',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
    transform: press && !disabled ? 'scale(var(--press-scale))' : 'none',
    transition: 'background var(--duration-fast) var(--ease-out), transform var(--duration-instant) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)',
    ...style,
  };
  const handlers = disabled ? {} : {
    onMouseEnter: () => setHover(true), onMouseLeave: () => { setHover(false); setPress(false); },
    onMouseDown: () => setPress(true), onMouseUp: () => setPress(false), onClick,
  };
  const inner = (<>{icon ? <i className={icon} aria-hidden="true" /> : null}{children}{iconRight ? <i className={iconRight} aria-hidden="true" /> : null}</>);
  if (href && !disabled) return <a href={href} style={css} {...handlers} {...rest}>{inner}</a>;
  return <button type={type} disabled={disabled} style={css} {...handlers} {...rest}>{inner}</button>;
}
