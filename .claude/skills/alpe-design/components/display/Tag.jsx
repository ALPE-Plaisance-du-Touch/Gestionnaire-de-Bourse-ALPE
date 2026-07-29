import React from 'react';

/** Étiquette de catégorie — cliquable ou supprimable, casse normale (≠ Badge). */
export function Tag({ children, active = false, onClick, onRemove, style, ...rest }) {
  return (
    <span onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px',
      background: active ? 'var(--brand-primary)' : 'var(--white)', color: active ? 'var(--text-on-brand)' : 'var(--blue-700)',
      border: '1px solid ' + (active ? 'var(--brand-primary)' : 'var(--border-default)'), borderRadius: 'var(--radius-pill)',
      fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out)', ...style }} {...rest}>
      {children}
      {onRemove ? <i className="fa-solid fa-xmark" aria-hidden="true" onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ cursor: 'pointer', opacity: 0.6, fontSize: 11 }} /> : null}
    </span>
  );
}
