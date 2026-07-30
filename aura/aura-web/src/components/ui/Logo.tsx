import './Logo.css';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  href?: string;
  target?: string;
}

export default function Logo({
  size = 'md',
  className = '',
  href = 'https://aura-teacher.vercel.app',
  target = '_self'
}: LogoProps) {
  const content = (
    <div className={`aura-logo-wrapper logo-size-${size} ${className}`} title="Aura Teacher Platform">
      <div className="aura-logo-gradient-img" />
    </div>
  );

  if (href) {
    return (
      <a href={href} className="aura-logo-link" target={target}>
        {content}
      </a>
    );
  }

  return content;
}
