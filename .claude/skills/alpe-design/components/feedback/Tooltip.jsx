import React, { useState } from 'react';

/** Infobulle — bleu profond, apparition en fondu. Texte court uniquement. */
export function Tooltip({ label, placement = 'top', children, style, ...rest }) {
  const [show, setShow] = useState(false);
  const pos = placement === 'bottom'
    ? { top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' }
    : { bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' };
  return (
    <span style={{ position: 'relative', display: 'inline-flex', ...style }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)} onBlur={() => setShow(false)} {...rest}>
      {children}
      <span role="tooltip" style={{ position: 'absolute', ...pos, whiteSpace: 'nowrap', pointerEvents: 'none',
        padding: '6px 10px', background: 'var(--surface-inverse)', color: 'var(--white)',
        borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-2xs)', fontWeight: 600,
        opacity: show ? 1 : 0, transition: 'opacity var(--duration-fast) var(--ease-out)', zIndex: 10 }}>{label}</span>
    </span>
  );
}
