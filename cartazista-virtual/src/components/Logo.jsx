import React from 'react';

export default function Logo({ collapsed }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', userSelect: 'none' }}>
      <svg width={collapsed ? "32" : "38"} height={collapsed ? "32" : "38"} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Moldura quadrada principal (Design Quadrado) */}
        <rect x="6" y="6" width="88" height="88" stroke="var(--accent-yellow)" strokeWidth="10" fill="var(--bg-darkest)" />
        {/* Etiqueta de preço interna */}
        <polygon points="25,25 75,25 75,55 50,75 25,55" fill="var(--accent-red)" />
        {/* Estrela de oferta / Brilho */}
        <polygon points="50,30 55,42 68,42 58,50 62,62 50,54 38,62 42,50 32,42 45,42" fill="var(--accent-yellow)" />
      </svg>
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.1' }}>
          <span style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Cartazista
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent-yellow)', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: '0.1rem' }}>
            Virtual
          </span>
        </div>
      )}
    </div>
  );
}
