import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost';
  children: ReactNode;
}) {
  return (
    <button type="button" className={`btn btn-${variant} ${className}`} {...rest}>
      {children}
    </button>
  );
}
