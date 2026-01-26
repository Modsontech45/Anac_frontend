import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  footer?: ReactNode;
  noPadding?: boolean;
}

const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  noPadding = false,
  className = '',
  ...props
}: CardProps) => {
  return (
    <div
      className={`bg-windows-surface rounded-windows-lg shadow-windows border border-windows-border overflow-hidden ${className}`}
      {...props}
    >
      {(title || headerAction) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-windows-border">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-windows-text">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-windows-textSecondary mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-4'}>{children}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-windows-border bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
