import React, { useState } from 'react';
import { FiPrinter, FiCheckCircle } from 'react-icons/fi';

export default function PrinterView() {
  const [margin, setMargin] = useState('none');
  const [orientation, setOrientation] = useState('portrait');
  const [multicopy, setMulticopy] = useState('1');

  const printJobs = [
    { id: 'JOB-412', name: 'Oferta Heineken Long Neck (A4)', qty: 5, time: '16:40', status: 'Concluído' },
    { id: 'JOB-411', name: 'Sabão Líquido Omo 1.6L (A4)', qty: 2, time: '16:32', status: 'Concluído' },
    { id: 'JOB-410', name: 'Detergente Ipê (Gôndola)', qty: 15, time: '15:15', status: 'Concluído' },
    { id: 'JOB-409', name: 'Arroz Prato Fino 5kg (A3)', qty: 1, time: '14:22', status: 'Concluído' },
  ];

  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Configurações de Impressora</h1>
        <p className="view-subtitle">Gerencie o layout das páginas impressas e visualize o histórico de impressão.</p>
      </div>

      <div className="printer-layout-grid">
        {/* Configurações de Layout */}
        <div className="square-card printer-settings-card">
          <div className="controls-header">
            <h3>Layout do Papel</h3>
          </div>

          <div className="controls-form" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label>Margem da Folha</label>
              <select value={margin} onChange={(e) => setMargin(e.target.value)} className="square-select">
                <option value="none">Sem Margem (Sangria Total - Recomendado)</option>
                <option value="thin">Margem Estreita (5mm)</option>
                <option value="thick">Margem Larga (15mm)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Orientação do Papel</label>
              <select value={orientation} onChange={(e) => setOrientation(e.target.value)} className="square-select">
                <option value="portrait">Retrato (Vertical - Padrão)</option>
                <option value="landscape">Paisagem (Horizontal)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Múltiplos por Página</label>
              <select value={multicopy} onChange={(e) => setMulticopy(e.target.value)} className="square-select">
                <option value="1">1 Cartaz por Página</option>
                <option value="2">2 Cartazes por Página (A5 em Folha A4)</option>
                <option value="4">4 Cartazes por Página (A6 em Folha A4)</option>
                <option value="8">8 Etiquetas por Página (Gôndola)</option>
              </select>
            </div>

            <div className="printer-status-box" style={{ borderLeft: '4px solid var(--accent-green)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-darkest)', padding: '1rem', marginTop: '1.5rem', border: 'var(--border)', borderLeft: '4px solid var(--accent-green)' }}>
              <div>
                <strong>Impressora Ativa</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '0.2rem' }}>EPSON L3250 Series (Rede)</p>
              </div>
              <span className="badge-promo" style={{ backgroundColor: 'var(--accent-green)', color: '#000000', fontWeight: 'bold' }}>ONLINE</span>
            </div>
          </div>
        </div>

        {/* Fila de Impressão (Queue) */}
        <div className="square-card printer-queue-card">
          <div className="controls-header">
            <h3>Histórico e Fila</h3>
          </div>

          <div className="jobs-list" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {printJobs.map((job) => (
              <div key={job.id} className="job-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', backgroundColor: 'var(--bg-darkest)', border: 'var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FiCheckCircle size={16} style={{ color: 'var(--accent-green)' }} />
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>{job.name}</strong>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                      ID: {job.id} | Qtd: {job.qty} cópias | {job.time}
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-green)' }}>Concluído</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .printer-layout-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        @media (max-width: 1024px) {
          .printer-layout-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
