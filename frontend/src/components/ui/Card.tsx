import type { HTMLAttributes, ReactNode } from 'react';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'accent';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  children: ReactNode;
}

// The design system marks a highlighted card with a 4px rule along the TOP edge —
// a coloured border on a single side is explicitly ruled out.
const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white border border-sand shadow-soft',
  elevated: 'bg-white shadow-md',
  outlined: 'bg-white border-2 border-sand',
  accent: 'bg-white border-t-4 border-t-primary border border-sand shadow-soft',
};

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  variant = 'default',
  padding = 'md',
  hover = false,
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`
        rounded-2xl
        transition-all duration-200
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${hover ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-bark">{title}</h3>
        {subtitle && (
          <p className="text-sm text-bark-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="ml-4 shrink-0">{action}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  detail?: string;
}

export function StatCard({ label, value, icon, detail }: StatCardProps) {
  return (
    <Card variant="default" padding="md">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-bark-muted">{label}</p>
          <p className="text-2xl font-bold text-bark mt-0.5">{value}</p>
          {detail && (
            <p className="text-xs text-bark-muted mt-1">{detail}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
