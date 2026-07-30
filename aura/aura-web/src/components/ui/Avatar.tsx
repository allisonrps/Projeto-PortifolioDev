import './Avatar.css';

interface AvatarProps { src?: string | null; name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; shape?: 'circle' | 'square'; }

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function Avatar({ src, name, size = 'md', shape = 'circle' }: AvatarProps) {
  return (
    <div className={`avatar avatar-${size} avatar-${shape}`}>
      {src ? <img src={src} alt={name} className="avatar-img" /> :
        <span className="avatar-initials">{getInitials(name)}</span>}
    </div>
  );
}
