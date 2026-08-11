import React from 'react';
import { FiPlusSquare, FiFileText, FiPrinter, FiActivity, FiTag } from 'react-icons/fi';

export default function DashboardView({ setActiveTab }) {
  const stats = [
    { label: 'Cartazes Criados', value: '42', change: '+5 hoje', icon: FiFileText, color: 'var(--accent-yellow)' },
    { label: 'Impressos Hoje', value: '18', change: '80% da meta', icon: FiPrinter, color: 'var(--accent-green)' },
    { label: 'Modelos Salvos', value: '12', change: 'Personalizados', icon: FiTag, color: 'var(--accent-blue)' },
    { label: 'Status da Impressora', value: 'Pronta', change: 'LPT1 Online', icon: FiActivity, color: 'var(--accent-green)' },
  ];

  const quickActions = [
    { title: 'Criar Novo Cartaz', desc: 'Inicie com um layout em branco ou edite textos rapidamente', tab: 'criar', icon: FiPlusSquare, color: 'var(--accent-yellow)' },
    { title: 'Explorar Modelos', desc: 'Selecione entre diversos temas pré-configurados de ofertas', tab: 'modelos', icon: FiFileText, color: 'var(--accent-orange)' },
    { title: 'Formatos de Impressão', desc: 'Veja tamanhos disponíveis (A3, A4, A5, Gôndola)', tab: 'tamanhos', icon: FiPlusSquare, color: 'var(--accent-blue)' },
    { title: 'Configurar Impressora', desc: 'Ajuste margens e layouts de página para impressão', tab: 'impressora', icon: FiPrinter, color: 'var(--accent-green)' },
  ];

  const recentPosters = [
    { id: 1, title: 'Oferta Heineken Long Neck', size: 'A4', price: 'R$ 5,99', date: 'Há 10 min', template: 'Varejo Estrela' },
    { id: 2, title: 'Super Desconto Sabão Omo 1.6kg', size: 'A3', price: 'R$ 18,90', date: 'Há 1 hora', template: 'Promoção Vermelho' },
    { id: 3, title: 'Arroz Prato Fino 5kg Tipo 1', size: 'A4', price: 'R$ 24,95', date: 'Há 3 horas', template: 'Blackboard Clássico' },
    { id: 4, title: 'Detergente Ipê Fragrâncias 500ml', size: 'Gôndola', price: 'R$ 2,19', date: 'Ontem', template: 'Neon Minimalista' },
  ];

  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Dashboard</h1>
        <p className="view-subtitle">Bem-vindo ao Cartazista Virtual. Gerencie e crie seus cartazes de ofertas.</p>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-grid">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="square-card stat-card">
              <div className="stat-header">
                <span className="stat-label">{stat.label}</span>
                <Icon size={20} style={{ color: stat.color }} />
              </div>
              <div className="stat-value">{stat.value}</div>
              <span className="stat-change">{stat.change}</span>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Posters */}
      <div className="dashboard-section-grid">
        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2 className="section-title">Ações Rápidas</h2>
          <div className="actions-grid">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(action.tab)}
                  className="square-card action-card"
                  style={{ textAlign: 'left', width: '100%', cursor: 'pointer' }}
                >
                  <div className="action-icon-wrapper" style={{ borderLeft: `4px solid ${action.color}` }}>
                    <Icon size={24} style={{ color: action.color }} />
                  </div>
                  <div className="action-info">
                    <h3>{action.title}</h3>
                    <p>{action.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Posters */}
        <div className="dashboard-section">
          <h2 className="section-title">Cartazes Recentes</h2>
          <div className="recent-list">
            {recentPosters.map((poster) => (
              <div key={poster.id} className="square-card recent-item">
                <div className="recent-info">
                  <h4>{poster.title}</h4>
                  <div className="recent-meta">
                    <span className="meta-tag">{poster.size}</span>
                    <span className="meta-tag">{poster.template}</span>
                    <span className="meta-date">{poster.date}</span>
                  </div>
                </div>
                <div className="recent-price-badge">
                  {poster.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .view-container {
          padding: 2rem;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
        }

        .view-header {
          margin-bottom: 2rem;
        }

        .view-title {
          font-size: 2.25rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }

        .view-subtitle {
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-label {
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 900;
          font-family: var(--font-mono);
          color: var(--text-primary);
        }

        .stat-change {
          font-size: 0.7rem;
          color: var(--text-secondary);
          font-family: var(--font-mono);
        }

        .dashboard-section-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        @media (max-width: 1024px) {
          .dashboard-section-grid {
            grid-template-columns: 1fr;
          }
        }

        .dashboard-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .section-title {
          font-size: 1.15rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: var(--border);
          padding-bottom: 0.5rem;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .action-card {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.25rem;
          transition: border-color var(--transition-fast);
        }

        .action-icon-wrapper {
          padding-left: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-info h3 {
          font-size: 0.95rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          color: var(--text-primary);
        }

        .action-info p {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: 0.15rem;
        }

        .recent-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .recent-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
        }

        .recent-info {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .recent-info h4 {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .recent-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .meta-tag {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          background-color: var(--bg-elevated);
          padding: 0.15rem 0.4rem;
          font-family: var(--font-mono);
          color: var(--text-secondary);
        }

        .meta-date {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .recent-price-badge {
          background-color: var(--accent-red);
          color: var(--text-primary);
          padding: 0.4rem 0.6rem;
          font-weight: 900;
          font-family: var(--font-mono);
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
}
