import type { ReactNode, HTMLAttributes } from 'react';
import './Card.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  hoverable?: boolean;
  accentColor?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  children: ReactNode;
}

export default function Card({ variant = 'default', hoverable = false, accentColor, children, className = '', ...props }: CardProps) {
  return (
    <div className={`card card-${variant} ${hoverable ? 'card-hoverable' : ''} ${accentColor ? `card-accent-${accentColor}` : ''} ${className}`} {...props}>
      {children}
    </div>
  );
}
