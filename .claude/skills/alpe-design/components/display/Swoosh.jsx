import React from 'react';

/** Le trait jaune du logo, isolé comme ornement. Une seule occurrence par support. */
export function Swoosh({ color = 'var(--brand-accent)', thickness = 9, width = '100%', height = 90, flip = false, style, ...rest }) {
  return (
    <svg viewBox="0 0 620 90" preserveAspectRatio="none" aria-hidden="true" focusable="false"
      style={{ width, height, display: 'block', transform: flip ? 'scaleY(-1)' : 'none', ...style }} {...rest}>
      <path d="M4 78 C 150 22 420 6 616 12" fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round" />
    </svg>
  );
}
