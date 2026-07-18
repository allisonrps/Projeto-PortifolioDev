const Logo = () => {
  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Ir para o topo"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            fontWeight: 800,
            color: 'var(--bg-primary)',
            letterSpacing: '0.5px',
            lineHeight: 1,
          }}
        >
          AR
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span
          style={{
            fontFamily: 'var(--font-main)',
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--white)',
            lineHeight: 1,
          }}
        >
          Allison
        </span>
        <span
          style={{
            fontFamily: 'var(--font-main)',
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--accent)',
            lineHeight: 1,
          }}
        >
          .
        </span>
      </div>
    </div>
  );
};

export default Logo;
