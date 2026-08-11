import React, { useState, useEffect } from 'react';
import { FiPrinter, FiRotateCcw } from 'react-icons/fi';

export default function CreateView({ posterData, setPosterData, globalSettings }) {
  // Inicialização do estado local para o cartaz editado
  const [localPoster, setLocalPoster] = useState(posterData || {
    title: 'Cerveja Heineken',
    subtitle: 'Long Neck Especial 330ml',
    regularPrice: '8,49',
    promoPrice: '5,99',
    unit: 'un',
    barcode: '7891991000853',
    extraInfo: 'Beba com moderação. Oferta válida até acabar o estoque.',
    template: 'varejo-estrela',
    colorTheme: 'classic-red', // classic-red, classic-yellow, neon-cyan, dark-gold
    fontSizeTitle: 'medium',
    showBarcode: true,
    fontFamily: 'impact' // impact, sans, serif, mono
  });

  useEffect(() => {
    if (posterData) {
      setLocalPoster(posterData);
    }
  }, [posterData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newVal = type === 'checkbox' ? checked : value;
    const updated = { ...localPoster, [name]: newVal };
    setLocalPoster(updated);
    if (setPosterData) setPosterData(updated);
  };

  const handleReset = () => {
    const defaults = {
      title: 'Sabão Líquido Omo',
      subtitle: 'Proteção Completa Lavagem Perfeita 1.6L',
      regularPrice: '24,90',
      promoPrice: '17,99',
      unit: 'un',
      barcode: '7891022100456',
      extraInfo: 'Mantenha fora do alcance de crianças. Imagens ilustrativas.',
      template: 'varejo-estrela',
      colorTheme: 'classic-red',
      fontSizeTitle: 'medium',
      showBarcode: true,
      fontFamily: 'impact'
    };
    setLocalPoster(defaults);
    if (setPosterData) setPosterData(defaults);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderPosterContent = () => {
    const { title, subtitle, regularPrice, promoPrice, unit, barcode, extraInfo, template, colorTheme, fontFamily } = localPoster;
    
    // Divide preço para renderização gigante (Inteiro e Decimal)
    const priceParts = promoPrice.split(',');
    const integerPart = priceParts[0] || '0';
    const decimalPart = priceParts[1] || '00';

    return (
      <div className={`printable-poster template-${template} theme-${colorTheme} font-${fontFamily}`}>
        {/* Gráfico de estrela/explosão do modelo varejo */}
        {template === 'varejo-estrela' && (
          <div className="starburst-graphic">
            <svg viewBox="0 0 100 100" className="star-svg">
              <polygon points="50,0 60,35 95,20 70,50 100,60 65,70 80,95 50,80 20,95 35,70 0,60 30,50 5,20 40,35" fill="var(--star-color)" />
            </svg>
            <div className="star-text">
              <span>SÓ</span>
              <span className="star-highlight">HOJE!</span>
            </div>
          </div>
        )}

        <div className="poster-header-section">
          {globalSettings?.storeName && <div className="store-tag">{globalSettings.storeName}</div>}
          <h1 className="poster-title">{title || 'NOME DO PRODUTO'}</h1>
          <p className="poster-subtitle">{subtitle || 'Subtítulo / Descrição da Embalagem'}</p>
        </div>

        <div className="poster-price-section">
          {regularPrice && (
            <div className="regular-price-box">
              De: <span className="crossed">R$ {regularPrice}</span>
            </div>
          )}
          
          <div className="promo-price-box">
            <span className="price-currency">R$</span>
            <span className="price-integer">{integerPart}</span>
            <div className="price-sub-box">
              <span className="price-decimal">,{decimalPart}</span>
              <span className="price-unit">/{unit}</span>
            </div>
          </div>
        </div>

        <div className="poster-footer-section">
          {localPoster.showBarcode && barcode && (
            <div className="barcode-simulator">
              <div className="barcode-lines">
                {[...Array(24)].map((_, i) => (
                  <div key={i} className="barcode-bar" style={{ width: i % 3 === 0 ? '3px' : i % 5 === 0 ? '1px' : '2px', marginRight: i % 4 === 0 ? '2px' : '1px' }}></div>
                ))}
              </div>
              <span className="barcode-number">{barcode}</span>
            </div>
          )}
          <p className="poster-extra">{extraInfo || 'Informações legais ou data de validade.'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="view-container">
      <div className="view-header no-print">
        <h1 className="view-title">Criar Cartaz</h1>
        <p className="view-subtitle">Ajuste os campos para atualizar a etiqueta promocional instantaneamente.</p>
      </div>

      <div className="editor-layout">
        {/* Painel de Controle (Esquerda) */}
        <div className="square-card controls-panel no-print">
          <div className="controls-header">
            <h3>Painel de Edição</h3>
            <button className="square-btn btn-danger" onClick={handleReset} title="Reiniciar Formulário">
              <FiRotateCcw size={14} /> Limpar
            </button>
          </div>

          <div className="controls-form">
            <div className="form-group">
              <label>Nome do Produto</label>
              <input 
                type="text" 
                name="title" 
                value={localPoster.title} 
                onChange={handleInputChange} 
                className="square-input"
                placeholder="Ex: Cerveja Heineken"
                maxLength={40}
              />
            </div>

            <div className="form-group">
              <label>Descrição / Embalagem</label>
              <input 
                type="text" 
                name="subtitle" 
                value={localPoster.subtitle} 
                onChange={handleInputChange} 
                className="square-input"
                placeholder="Ex: Long Neck 330ml"
                maxLength={60}
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Preço Regular (Crossed)</label>
                <input 
                  type="text" 
                  name="regularPrice" 
                  value={localPoster.regularPrice} 
                  onChange={handleInputChange} 
                  className="square-input"
                  placeholder="Ex: 8,49"
                />
              </div>

              <div className="form-group">
                <label>Preço de Oferta</label>
                <input 
                  type="text" 
                  name="promoPrice" 
                  value={localPoster.promoPrice} 
                  onChange={handleInputChange} 
                  className="square-input font-bold"
                  placeholder="Ex: 5,99"
                  style={{ borderColor: 'var(--accent-yellow)', fontWeight: 'bold' }}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Unidade</label>
                <select 
                  name="unit" 
                  value={localPoster.unit} 
                  onChange={handleInputChange} 
                  className="square-select"
                >
                  <option value="un">Unidade (un)</option>
                  <option value="kg">Quilo (kg)</option>
                  <option value="L">Litro (L)</option>
                  <option value="g">Grama (g)</option>
                  <option value="cx">Caixa (cx)</option>
                  <option value="fd">Fardo (fd)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Código de Barras</label>
                <input 
                  type="text" 
                  name="barcode" 
                  value={localPoster.barcode} 
                  onChange={handleInputChange} 
                  className="square-input"
                  placeholder="Ex: 789123..."
                />
              </div>
            </div>

            <div className="form-group-checkbox">
              <input 
                type="checkbox" 
                id="showBarcode"
                name="showBarcode" 
                checked={localPoster.showBarcode} 
                onChange={handleInputChange} 
              />
              <label htmlFor="showBarcode">Exibir Código de Barras</label>
            </div>

            <div className="form-group">
              <label>Observação de Rodapé</label>
              <textarea 
                name="extraInfo" 
                value={localPoster.extraInfo} 
                onChange={handleInputChange} 
                className="square-input"
                rows={2}
                placeholder="Validade, restrições ou avisos..."
              />
            </div>

            <hr className="divider" />

            <div className="form-row-2">
              <div className="form-group">
                <label>Modelo Visual</label>
                <select 
                  name="template" 
                  value={localPoster.template} 
                  onChange={handleInputChange} 
                  className="square-select"
                >
                  <option value="varejo-estrela">Estrela de Oferta</option>
                  <option value="neon-glow">Neon Supermercado</option>
                  <option value="chalkboard">Chalkboard Clássico</option>
                  <option value="minimalist">Minimalista Bold</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tema de Cores</label>
                <select 
                  name="colorTheme" 
                  value={localPoster.colorTheme} 
                  onChange={handleInputChange} 
                  className="square-select"
                >
                  <option value="classic-red">Vermelho Varejo</option>
                  <option value="classic-yellow">Amarelo Promoção</option>
                  <option value="neon-cyan">Ciano Neon</option>
                  <option value="dark-gold">Preto / Dourado</option>
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Tipo de Fonte</label>
                <select 
                  name="fontFamily" 
                  value={localPoster.fontFamily} 
                  onChange={handleInputChange} 
                  className="square-select"
                >
                  <option value="impact">Impact Varejo</option>
                  <option value="sans">Sans-serif Bold</option>
                  <option value="serif">Serif Retrô</option>
                  <option value="mono">Mono Técnica</option>
                </select>
              </div>
            </div>

            <button className="square-btn btn-active" onClick={handlePrint} style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
              <FiPrinter size={16} /> Imprimir Cartaz
            </button>
          </div>
        </div>

        {/* Prévia do Cartaz (Direita) */}
        <div className="preview-panel">
          <div className="preview-header no-print">
            <h3>Visualização</h3>
            <span className="badge-promo">Tempo Real</span>
          </div>

          <div className="preview-container-box">
            {renderPosterContent()}
          </div>
        </div>
      </div>

      {/* Área oculta para impressão nativa do navegador */}
      <div className="print-area">
        {renderPosterContent()}
      </div>

      <style>{`
        .editor-layout {
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 2rem;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .editor-layout {
            grid-template-columns: 1fr;
          }
        }

        .controls-panel {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .controls-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: var(--border);
          padding-bottom: 0.75rem;
        }

        .controls-header h3 {
          font-size: 1.1rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .controls-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .form-group label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-secondary);
          letter-spacing: 0.05em;
        }

        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group-checkbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--text-secondary);
          user-select: none;
          cursor: pointer;
        }

        .form-group-checkbox input {
          cursor: pointer;
        }

        .divider {
          border: none;
          border-top: var(--border);
          margin: 0.5rem 0;
        }

        .preview-panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .preview-header h3 {
          font-size: 1.1rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .preview-container-box {
          background-color: #272730;
          border: var(--border);
          padding: 3rem;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 600px;
          position: relative;
          overflow: hidden;
        }

        @media (max-width: 600px) {
          .preview-container-box {
            padding: 1rem;
            min-height: 400px;
          }
        }

        /* Cartaz de Impressão */
        .printable-poster {
          width: 100%;
          max-width: 420px;
          aspect-ratio: 1 / 1.414;
          background-color: #ffffff;
          color: #000000;
          position: relative;
          padding: 2.5rem 2rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border: 10px solid #000000;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          user-select: none;
          overflow: hidden;
        }

        /* Estilos de Fontes */
        .font-impact { font-family: 'Impact', 'Arial Black', sans-serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-serif { font-family: 'Georgia', serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }

        /* Estilos de Temas */
        .theme-classic-red {
          border-color: #ff3344;
          --star-color: #ffe600;
          --primary-color: #ff3344;
        }
        .theme-classic-yellow {
          border-color: #ffe600;
          --star-color: #ff3344;
          --primary-color: #000000;
          background-color: #fffdf0;
        }
        .theme-neon-cyan {
          border-color: #00d2ff;
          --star-color: #00e676;
          --primary-color: #008ba3;
          background-color: #f6ffff;
        }
        .theme-dark-gold {
          border-color: #1a1a1a;
          --star-color: #d4af37;
          --primary-color: #1a1a1a;
          background-color: #fafafa;
        }

        /* Estrela Explosiva */
        .starburst-graphic {
          position: absolute;
          top: -10px;
          right: -10px;
          width: 140px;
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }

        .star-svg {
          position: absolute;
          width: 100%;
          height: 100%;
          transform: rotate(15deg);
          filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.15));
        }

        .star-text {
          position: relative;
          color: #000000;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-weight: 900;
          line-height: 0.9;
          transform: rotate(-10deg);
        }

        .star-text span:first-child {
          font-size: 0.9rem;
        }

        .star-highlight {
          font-size: 1.4rem;
          color: #ff3344;
          text-shadow: 1.5px 1.5px 0px #ffffff;
        }

        .theme-classic-yellow .star-highlight {
          color: #ffe600;
          text-shadow: 1.5px 1.5px 0px #000000;
        }

        /* Template Neon Glow */
        .template-neon-glow {
          background-color: #0d0f19;
          border-color: #00d2ff;
          color: #ffffff;
        }
        .template-neon-glow .poster-title { color: #ffffff; text-shadow: 0 0 10px #00d2ff; }
        .template-neon-glow .price-integer { color: #ff3344; text-shadow: 0 0 10px #ff3344; }
        .template-neon-glow .price-decimal { color: #ffe600; text-shadow: 0 0 10px #ffe600; }
        .template-neon-glow .regular-price-box { color: #a1a1aa; }
        .template-neon-glow .poster-subtitle { color: #a1a1aa; }
        .template-neon-glow .poster-extra { color: #71717a; }

        /* Template Chalkboard */
        .template-chalkboard {
          background-color: #1a1e1b;
          border-color: #c5d86d;
          border-width: 8px;
          border-style: double;
          color: #ffffff;
        }
        .template-chalkboard .poster-title { color: #ffffff; font-family: 'Georgia', serif; }
        .template-chalkboard .promo-price-box { color: #ffe600; }
        .template-chalkboard .regular-price-box { color: #a1a1aa; }
        .template-chalkboard .poster-subtitle { color: #c5d86d; }
        .template-chalkboard .poster-extra { color: #71717a; }

        /* Template Minimalist */
        .template-minimalist {
          border-width: 5px;
          border-color: #000000;
        }

        /* Seções do Cartaz */
        .store-tag {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-bottom: 2px solid #000000;
          padding-bottom: 0.25rem;
          display: inline-block;
          margin-bottom: 1.25rem;
          color: var(--primary-color);
        }

        .template-neon-glow .store-tag {
          color: #00d2ff;
          border-color: #00d2ff;
        }
        .template-chalkboard .store-tag {
          color: #c5d86d;
          border-color: #c5d86d;
        }

        .poster-title {
          font-size: 2.25rem;
          font-weight: 900;
          text-transform: uppercase;
          line-height: 1.1;
          word-break: break-word;
          color: var(--primary-color);
        }

        .poster-subtitle {
          font-size: 1.1rem;
          font-weight: 700;
          color: #52525b;
          margin-top: 0.35rem;
        }

        .poster-price-section {
          margin: 1.5rem 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .regular-price-box {
          font-size: 0.95rem;
          font-weight: 700;
          color: #52525b;
          margin-bottom: 0.25rem;
        }

        .crossed {
          text-decoration: line-through;
          color: #ff3344;
        }

        .promo-price-box {
          display: flex;
          align-items: flex-start;
          font-weight: 950;
          line-height: 0.85;
          color: #ff3344;
        }
        
        .theme-classic-yellow .promo-price-box {
          color: #000000;
        }

        .price-currency {
          font-size: 2.2rem;
          margin-top: 0.5rem;
          margin-right: 0.1rem;
        }

        .price-integer {
          font-size: 8rem;
          letter-spacing: -0.06em;
        }

        .price-sub-box {
          display: flex;
          flex-direction: column;
          margin-top: 0.5rem;
        }

        .price-decimal {
          font-size: 3.2rem;
          font-weight: 900;
          line-height: 1;
        }

        .price-unit {
          font-size: 1.1rem;
          font-weight: 700;
          color: #52525b;
          align-self: flex-start;
          margin-top: 0.25rem;
        }

        .template-neon-glow .price-unit { color: #a1a1aa; }
        .template-chalkboard .price-unit { color: #c5d86d; }

        .poster-footer-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .barcode-simulator {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .barcode-lines {
          display: flex;
          height: 32px;
          background-color: #000000;
          padding: 2px 8px;
        }

        .template-neon-glow .barcode-lines {
          background-color: #ffffff;
        }

        .barcode-bar {
          background-color: #ffffff;
          height: 100%;
        }

        .template-neon-glow .barcode-bar {
          background-color: #000000;
        }

        .barcode-number {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: #52525b;
          margin-top: 0.15rem;
        }

        .template-neon-glow .barcode-number { color: #a1a1aa; }

        .poster-extra {
          font-size: 0.7rem;
          color: #71717a;
          text-align: center;
          line-height: 1.3;
        }
      `}</style>
    </div>
  );
}
