import React from 'react';

export default function TemplatesView({ setActiveTab, setPosterData }) {
  const templates = [
    {
      id: 'varejo-estrela',
      title: 'Estrela de Oferta',
      description: 'Modelo tradicional do varejo com estrela amarela explosiva sobre fundo vermelho. Perfeito para supermercados.',
      theme: 'classic-red',
      font: 'impact',
      previewColors: ['#ff3344', '#ffe600']
    },
    {
      id: 'neon-glow',
      title: 'Neon Supermercado',
      description: 'Visual moderno com brilho neon sobre fundo escuro. Excelente para lojas de conveniência e eventos noturnos.',
      theme: 'neon-cyan',
      font: 'sans',
      previewColors: ['#0d0f19', '#00d2ff']
    },
    {
      id: 'chalkboard',
      title: 'Chalkboard Clássico',
      description: 'Estilo lousa de giz, ideal para hortifruti, padarias, empórios e adegas com toque rústico e artesanal.',
      theme: 'dark-gold',
      font: 'serif',
      previewColors: ['#1a1e1b', '#c5d86d']
    },
    {
      id: 'minimalist',
      title: 'Minimalista Bold',
      description: 'Tipografia robusta, design limpo e direto. Ideal para eletrodomésticos, eletrônicos e lojas de departamento.',
      theme: 'dark-gold',
      font: 'sans',
      previewColors: ['#ffffff', '#000000']
    }
  ];

  const handleSelectTemplate = (tpl) => {
    let sampleData = {
      title: 'Nome do Produto',
      subtitle: 'Descrição da Embalagem',
      regularPrice: '19,90',
      promoPrice: '14,99',
      unit: 'un',
      barcode: '7891000200030',
      extraInfo: 'Aviso legal e validade da oferta.',
      template: tpl.id,
      colorTheme: tpl.theme,
      fontFamily: tpl.font,
      showBarcode: true
    };

    if (tpl.id === 'varejo-estrela') {
      sampleData.title = 'Filé de Frango Seara';
      sampleData.subtitle = 'Bandeja Resfriada 1kg';
      sampleData.regularPrice = '18,90';
      sampleData.promoPrice = '12,98';
      sampleData.unit = 'kg';
      sampleData.colorTheme = 'classic-red';
    } else if (tpl.id === 'neon-glow') {
      sampleData.title = 'Energético Monster';
      sampleData.subtitle = 'Lata Original 473ml';
      sampleData.regularPrice = '10,99';
      sampleData.promoPrice = '7,49';
      sampleData.unit = 'un';
      sampleData.colorTheme = 'neon-cyan';
    } else if (tpl.id === 'chalkboard') {
      sampleData.title = 'Vinho Tinto Chileno';
      sampleData.subtitle = 'Garrafa Reserva 750ml';
      sampleData.regularPrice = '69,90';
      sampleData.promoPrice = '49,90';
      sampleData.unit = 'un';
      sampleData.colorTheme = 'dark-gold';
    } else if (tpl.id === 'minimalist') {
      sampleData.title = 'Smart TV 4K 55"';
      sampleData.subtitle = 'Resolução Crystal UHD HDR';
      sampleData.regularPrice = '2.499,00';
      sampleData.promoPrice = '1.999,00';
      sampleData.unit = 'un';
      sampleData.colorTheme = 'dark-gold';
    }

    setPosterData(sampleData);
    setActiveTab('criar');
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Modelos</h1>
        <p className="view-subtitle">Escolha um modelo de ponto de partida e edite com seus dados.</p>
      </div>

      <div className="templates-grid">
        {templates.map((tpl) => (
          <div key={tpl.id} className="square-card template-select-card">
            <div className="template-preview-bar">
              {tpl.previewColors.map((col, idx) => (
                <div key={idx} style={{ backgroundColor: col, flex: 1, height: '12px' }} />
              ))}
            </div>
            <div className="template-card-body">
              <h3>{tpl.title}</h3>
              <p>{tpl.description}</p>
              <button className="square-btn btn-active" onClick={() => handleSelectTemplate(tpl)}>
                Usar Modelo
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(265px, 1fr));
          gap: 1.5rem;
        }

        .template-select-card {
          padding: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: border-color var(--transition-fast);
        }

        .template-preview-bar {
          display: flex;
          border-bottom: var(--border);
        }

        .template-card-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          flex: 1;
        }

        .template-card-body h3 {
          font-size: 1.05rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--text-primary);
        }

        .template-card-body p {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.45;
          flex: 1;
        }

        .template-card-body button {
          width: 100%;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
