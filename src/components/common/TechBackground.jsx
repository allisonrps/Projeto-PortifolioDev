import React from 'react';

/**
 * Technical and Cloud-themed decorative background elements.
 * Renders absolute-positioned SVGs (networks, code tags, databases, cloud nodes)
 * with extremely low opacity behind the content.
 */
export default function TechBackground() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* ── 1. Cloud Network Node (Top Right, near Hero) ── */}
      <svg
        style={{
          position: 'absolute',
          top: '80px',
          right: '5%',
          width: '450px',
          height: '450px',
          opacity: 0.035,
          color: 'var(--accent)',
        }}
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
      >
        {/* Nodes */}
        <circle cx="50" cy="20" r="2" fill="currentColor" />
        <circle cx="30" cy="45" r="2" fill="currentColor" />
        <circle cx="70" cy="45" r="2" fill="currentColor" />
        <circle cx="20" cy="70" r="2" fill="currentColor" />
        <circle cx="50" cy="70" r="2" fill="currentColor" />
        <circle cx="80" cy="70" r="2" fill="currentColor" />
        
        {/* Connections */}
        <line x1="50" y1="20" x2="30" y2="45" />
        <line x1="50" y1="20" x2="70" y2="45" />
        <line x1="30" y1="45" x2="20" y2="70" />
        <line x1="30" y1="45" x2="50" y2="70" />
        <line x1="70" y1="45" x2="50" y2="70" />
        <line x1="70" y1="45" x2="80" y2="70" />
        <line x1="20" y1="70" x2="50" y2="70" />
        <line x1="50" y1="70" x2="80" y2="70" />
        
        {/* Cloud outline surrounding nodes */}
        <path
          d="M 22 75 A 15 15 0 0 1 20 45 A 18 18 0 0 1 50 15 A 18 18 0 0 1 80 45 A 15 15 0 0 1 78 75 Z"
          strokeDasharray="2, 2"
        />
      </svg>

      {/* ── 2. Code HTML Brackets (Left, near About) ── */}
      <div
        style={{
          position: 'absolute',
          top: '750px',
          left: '2%',
          fontFamily: 'var(--font-mono)',
          fontSize: '220px',
          fontWeight: 800,
          color: 'var(--accent)',
          opacity: 0.02,
          userSelect: 'none',
        }}
      >
        &lt;/&gt;
      </div>

      {/* ── 3. Hexagonal Grid / Database Nodes (Right, near Services) ── */}
      <svg
        style={{
          position: 'absolute',
          top: '1400px',
          right: '2%',
          width: '350px',
          height: '350px',
          opacity: 0.03,
          color: 'var(--accent)',
        }}
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
      >
        {/* Isometric boxes/hexagons */}
        <polygon points="50,15 80,32.5 80,67.5 50,85 20,67.5 20,32.5" />
        <polygon points="50,15 50,85" />
        <polygon points="50,50 80,32.5" />
        <polygon points="50,50 20,32.5" />
        
        <polygon points="50,50 50,15" strokeDasharray="1,1" />
        <polygon points="50,50 80,67.5" strokeDasharray="1,1" />
        <polygon points="50,50 20,67.5" strokeDasharray="1,1" />
      </svg>

      {/* ── 4. Floating Curly Braces (Left, near Projects) ── */}
      <div
        style={{
          position: 'absolute',
          top: '2300px',
          left: '3%',
          fontFamily: 'var(--font-mono)',
          fontSize: '250px',
          fontWeight: 700,
          color: 'var(--accent)',
          opacity: 0.015,
          userSelect: 'none',
        }}
      >
        &#123; &#125;
      </div>

      {/* ── 5. Cloud Computing Architecture Nodes (Left, near Contact) ── */}
      <svg
        style={{
          position: 'absolute',
          bottom: '200px',
          left: '5%',
          width: '400px',
          height: '400px',
          opacity: 0.03,
          color: 'var(--accent)',
        }}
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
      >
        {/* Layers representation */}
        <path d="M 10 30 L 50 15 L 90 30 L 50 45 Z" />
        <path d="M 10 50 L 50 35 L 90 50 L 50 65 Z" />
        <path d="M 10 70 L 50 55 L 90 70 L 50 85 Z" />
        
        {/* Inter-layer connector lines */}
        <line x1="50" y1="15" x2="50" y2="55" strokeDasharray="1,2" />
        <line x1="10" y1="30" x2="10" y2="70" strokeDasharray="1,2" />
        <line x1="90" y1="30" x2="90" y2="70" strokeDasharray="1,2" />
      </svg>
    </div>
  );
}
