import type { ReactNode, ButtonHTMLAttributes } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export default function Button({ variant = 'primary', size = 'md', isLoading, icon, fullWidth, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`} disabled={disabled || isLoading} {...props}>
      {isLoading ? <span className="btn-spinner" /> : icon && <span className="btn-icon">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
}
