import type { ReactNode } from 'react';
import './Badge.css';

interface BadgeProps { variant?: 'success' | 'danger' | 'warning' | 'info' | 'primary' | 'secondary'; children: ReactNode; }

export default function Badge({ variant = 'primary', children }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
