import React from 'react';

export default function SizesView() {
  const sizes = [
    { name: 'A3 (Grande)', dimensions: '297 x 420 mm', ratio: '1:1.41', desc: 'Ideal para vitrines, fachadas e painéis de parede principais de ofertas.', paper: 'Couché 170g ou Sulfite Grosso', widthRatio: 70, heightRatio: 100 },
    { name: 'A4 (Padrão)', dimensions: '210 x 297 mm', ratio: '1:1.41', desc: 'O tamanho mais versátil. Excelente para ilhas de produtos, pontas de gôndola e balcões.', paper: 'Sulfite 90g ou Couché 120g', widthRatio: 60, heightRatio: 85 },
    { name: 'A5 (Pequeno)', dimensions: '148 x 210 mm', ratio: '1:1.41', desc: 'Recomendado para cestos de ofertas, prateleiras altas e displays de balcão compactos.', paper: 'Sulfite Padrão 75g', widthRatio: 50, heightRatio: 70 },
    { name: 'Faixa de Gôndola', dimensions: '100 x 30 mm', ratio: '3.3:1', desc: 'Etiquetas horizontais compridas para inserção direta nas canaletas plásticas das prateleiras.', paper: 'Papel Cartão Fino', widthRatio: 100, heightRatio: 30 },
    { name: 'Etiqueta Quadrada', dimensions: '100 x 100 mm', ratio: '1:1', desc: 'Perfeito para caixas de feira, pilhas de hortifrúti ou caixas organizadoras de empilhamento.', paper: 'Adesivo Quadrado Fosco', widthRatio: 70, heightRatio: 70 },
  ];

  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Tamanhos de Cartaz</h1>
        <p className="view-subtitle">Veja as proporções e especificações técnicas de cada formato suportado pelo sistema.</p>
      </div>

      <div className="sizes-grid">
        {sizes.map((sz, idx) => (
          <div key={idx} className="square-card size-card">
            <div className="size-preview-container">
              <div 
                className="size-preview-box" 
                style={{ 
                  width: `${sz.widthRatio}px`, 
                  height: `${sz.heightRatio}px`,
                  backgroundColor: 'var(--accent-yellow)',
                  border: '2px solid var(--text-on-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6rem',
                  fontWeight: '900',
                  color: 'var(--text-on-accent)',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {sz.name.split(' ')[0]}
              </div>
            </div>
            <div className="size-info">
              <h3>{sz.name}</h3>
              <p className="size-dim font-bold">{sz.dimensions}</p>
              <p className="size-desc">{sz.desc}</p>
              <div className="size-meta">
                <span>Papel Sugerido:</span> <strong>{sz.paper}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .sizes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .size-card {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          align-items: center;
          text-align: center;
          padding: 2rem 1.5rem;
        }

        .size-preview-container {
          height: 130px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          background-color: var(--bg-darkest);
          border: var(--border);
        }

        .size-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
        }

        .size-info h3 {
          font-size: 1.05rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .size-dim {
          font-family: var(--font-mono);
          color: var(--accent-yellow);
          font-size: 0.85rem;
        }

        .size-desc {
          font-size: 0.78rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .size-meta {
          margin-top: 0.5rem;
          font-size: 0.72rem;
          color: var(--text-muted);
          border-top: 1px solid var(--border-color);
          padding-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}
