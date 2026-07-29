import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted';
type BadgeSize = 'sm' | 'md';

interface StatusBadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  dot?: boolean;
  children: ReactNode;
}

// Badge text is small, so every pairing has to clear 4.5:1 — the previous
// translucent fills sat between 3.06 and 3.92. Opaque -soft backgrounds with
// -strong text reach 4.86 to 7.99.
// `success` no longer borrows the primary colour: that read as green only while
// the primary itself was green.
const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-cream-dark text-bark-light',
  success: 'bg-success-soft text-success-strong',
  warning: 'bg-warning-soft text-warning-strong',
  error: 'bg-error-soft text-error-dark',
  info: 'bg-info-soft text-primary-strong',
  muted: 'bg-white border border-sand text-bark-light',
};

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-bark-muted',
  success: 'bg-success',
  warning: 'bg-secondary',
  error: 'bg-error',
  info: 'bg-primary',
  muted: 'bg-bark-muted',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export function StatusBadge({
  variant = 'default',
  size = 'sm',
  icon,
  dot = false,
  children,
}: StatusBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-semibold rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles[variant]}`}
          aria-hidden="true"
        />
      )}
      {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
