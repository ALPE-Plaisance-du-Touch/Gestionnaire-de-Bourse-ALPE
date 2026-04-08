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

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-cream-dark text-bark-light',
  success: 'bg-primary/10 text-primary-dark',
  warning: 'bg-accent/15 text-accent-dark',
  error: 'bg-error/10 text-error',
  info: 'bg-secondary/10 text-secondary-dark',
  muted: 'bg-sand/50 text-bark-muted',
};

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-bark-muted',
  success: 'bg-primary',
  warning: 'bg-accent',
  error: 'bg-error',
  info: 'bg-secondary',
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
        font-medium rounded-lg
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
