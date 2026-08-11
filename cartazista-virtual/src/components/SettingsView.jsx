import React from 'react';
import { FiTrash2 } from 'react-icons/fi';

export default function SettingsView({ globalSettings, setGlobalSettings }) {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGlobalSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClearData = () => {
    if (window.confirm('Deseja realmente redefinir todas as configurações para o padrão?')) {
      setGlobalSettings({
        storeName: 'MERCADO RODRIGUES',
        currency: 'R$',
        defaultPrinter: 'EPSON L3250',
        quality: 'standard',
        theme: 'obsidian'
      });
      alert('Configurações redefinidas com sucesso!');
    }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Configurações</h1>
        <p className="view-subtitle">Customize as preferências gerais do sistema e do seu estabelecimento comercial.</p>
      </div>

      <div className="settings-layout">
        {/* Dados do Estabelecimento */}
        <div className="square-card settings-card">
          <div className="controls-header">
            <h3>Dados da Loja</h3>
          </div>

          <div className="controls-form" style={{ marginTop: '1.25rem' }}>
            <div className="form-group">
              <label>Nome do Estabelecimento (Exibe nos cartazes)</label>
              <input 
                type="text" 
                name="storeName" 
                value={globalSettings.storeName} 
                onChange={handleInputChange} 
                className="square-input"
                placeholder="Ex: MERCADO PEG & PAG"
              />
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Símbolo Monetário</label>
              <select name="currency" value={globalSettings.currency} onChange={handleInputChange} className="square-select">
                <option value="R$">Real Brasileiro (R$)</option>
                <option value="$">Dólar Americano ($)</option>
                <option value="€">Euro (€)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preferências do App */}
        <div className="square-card settings-card">
          <div className="controls-header">
            <h3>Preferências</h3>
          </div>

          <div className="controls-form" style={{ marginTop: '1.25rem' }}>
            <div className="form-group">
              <label>Qualidade de Impressão Padrão</label>
              <select name="quality" value={globalSettings.quality} onChange={handleInputChange} className="square-select">
                <option value="draft">Rascunho Rápido (Economiza Tinta)</option>
                <option value="standard">Padrão (Recomendado)</option>
                <option value="high">Alta Resolução (Ideal para A3)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Tema de Interface</label>
              <select name="theme" value={globalSettings.theme} onChange={handleInputChange} className="square-select">
                <option value="obsidian">Escuro Obsidiana (Padrão)</option>
                <option value="high-contrast">Escuro Alto Contraste</option>
              </select>
            </div>

            <button className="square-btn btn-danger" onClick={handleClearData} style={{ marginTop: '1.5rem', alignSelf: 'flex-start' }}>
              <FiTrash2 size={16} /> Redefinir Dados
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .settings-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        @media (max-width: 1024px) {
          .settings-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
