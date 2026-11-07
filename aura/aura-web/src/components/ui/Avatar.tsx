import './Avatar.css';

interface AvatarProps { src?: string | null; name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; shape?: 'circle' | 'square'; }

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export function getAbsoluteAvatarUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const cleanApiOrigin = rawApiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${cleanApiOrigin}${cleanPath}`;
}

export default function Avatar({ src, name, size = 'md', shape = 'circle' }: AvatarProps) {
  const resolvedSrc = getAbsoluteAvatarUrl(src);
  return (
    <div className={`avatar avatar-${size} avatar-${shape}`}>
      {resolvedSrc ? <img src={resolvedSrc} alt={name} className="avatar-img" /> :
        <span className="avatar-initials">{getInitials(name)}</span>}
    </div>
  );
}
