import React from 'react';
import { IconButton } from '../actions/IconButton.jsx';

/** Modale ALPE — voile bleu profond, carte blanche, ombre xl. Aucun flou d'arrière-plan. */
export function Dialog({ open = true, title, children, footer, onClose, width = 520, style, ...rest }) {
  if (!open) return null;
  return (
    <div role="presentation" onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-6)', background: 'rgba(3, 59, 83, 0.55)' }}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: width, background: 'var(--surface-card)', borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)', overflow: 'hidden', ...style }} {...rest}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)', padding: 'var(--space-6) var(--space-6) var(--space-3)' }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-2xl)', color: 'var(--text-heading)' }}>{title}</h3>
          {onClose ? <IconButton icon="fa-solid fa-xmark" label="Fermer" size="sm" onClick={onClose} /> : null}
        </div>
        <div style={{ padding: '0 var(--space-6) var(--space-6)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-normal)', color: 'var(--text-body)' }}>{children}</div>
        {footer ? <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', padding: 'var(--space-4) var(--space-6)', background: 'var(--surface-muted)', borderTop: '1px solid var(--border-subtle)' }}>{footer}</div> : null}
      </div>
    </div>
  );
}
