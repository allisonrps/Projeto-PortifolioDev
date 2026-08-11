import React, { useState, useEffect } from 'react';
import { 
  FiLayout, 
  FiPlusSquare, 
  FiFileText, 
  FiMaximize2, 
  FiPrinter, 
  FiSettings, 
  FiChevronLeft, 
  FiChevronRight,
  FiMenu
} from 'react-icons/fi';
import Logo from './Logo';

export default function Sidebar({ activeTab, setActiveTab }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Colapsa automaticamente em telas médias, esconde no mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } else if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiLayout },
    { id: 'criar', label: 'Criar', icon: FiPlusSquare },
    { id: 'modelos', label: 'Modelos', icon: FiFileText },
    { id: 'tamanhos', label: 'Tamanhos', icon: FiMaximize2 },
    { id: 'impressora', label: 'Impressora', icon: FiPrinter },
    { id: 'configuracoes', label: 'Configurações', icon: FiSettings },
  ];

  const handleTabClick = (id) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Top Header para Mobile (Visível apenas em telas menores) */}
      <div className="mobile-header no-print">
        <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
          <FiMenu size={20} />
        </button>
        <Logo collapsed={true} />
        <div style={{ width: 36 }}></div>
      </div>

      {/* Backdrop escuro para fechar a gaveta mobile */}
      {mobileOpen && (
        <div className="sidebar-backdrop no-print" onClick={() => setMobileOpen(false)}></div>
      )}

      {/* Componente Sidebar Principal */}
      <aside className={`sidebar-container no-print ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Logo collapsed={collapsed} />
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : ''}
              >
                <Icon size={18} className="nav-icon" />
                {!collapsed && <span className="nav-label">{item.label}</span>}
                {isActive && <div className="nav-active-bar"></div>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && (
            <p className="version-tag">CARTAZISTA VIRTUAL v1.0</p>
          )}
        </div>
      </aside>

      <style>{`
        .mobile-header {
          display: none;
          height: 60px;
          background-color: var(--bg-darkest);
          border-bottom: var(--border);
          align-items: center;
          justify-content: space-between;
          padding: 0 1rem;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
        }

        .mobile-menu-btn {
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          border: var(--border);
          background: var(--bg-card);
        }

        .mobile-menu-btn:hover {
          border-color: var(--accent-yellow);
          color: var(--accent-yellow);
        }

        .sidebar-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.85);
          z-index: 98;
        }

        .sidebar-container {
          width: 250px;
          height: 100vh;
          background-color: var(--bg-darkest);
          display: flex;
          flex-direction: column;
          z-index: 99;
          transition: width var(--transition-normal);
          flex-shrink: 0;
        }

        .sidebar-container.collapsed {
          width: 76px;
        }

        .sidebar-header {
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.25rem;
          border-bottom: var(--border);
          position: relative;
        }

        .sidebar-container.collapsed .sidebar-header {
          justify-content: center;
          padding: 0;
        }

        .collapse-btn {
          background-color: var(--bg-card);
          border: var(--border);
          color: var(--text-secondary);
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-fast);
        }

        .collapse-btn:hover {
          color: var(--accent-yellow);
          border-color: var(--accent-yellow);
        }

        .sidebar-container.collapsed .collapse-btn {
          position: absolute;
          right: -13px;
          top: 22px;
          z-index: 10;
        }

        .sidebar-nav {
          padding: 1.5rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .sidebar-container.collapsed .sidebar-nav {
          padding: 1.5rem 0.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          padding: 0.85rem 1rem;
          color: var(--text-secondary);
          transition: var(--transition-fast);
          border: var(--border-width) solid transparent;
          position: relative;
          text-align: left;
          width: 100%;
        }

        .sidebar-container.collapsed .nav-item {
          justify-content: center;
          padding: 0.85rem 0;
        }

        .nav-item:hover {
          color: var(--text-primary);
          background-color: var(--bg-card);
          border-color: var(--border-color);
        }

        .nav-item.active {
          color: var(--text-on-accent);
          background-color: var(--accent-yellow);
          border-color: var(--accent-yellow);
          font-weight: 700;
        }

        .nav-icon {
          flex-shrink: 0;
        }

        .nav-label {
          margin-left: 0.75rem;
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .nav-active-bar {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background-color: var(--accent-red);
        }

        .sidebar-footer {
          padding: 1rem;
          border-top: var(--border);
          text-align: center;
        }

        .version-tag {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        @media (max-width: 767px) {
          .mobile-header {
            display: flex;
          }

          .sidebar-container {
            position: fixed;
            top: 60px;
            left: -100%;
            height: calc(100vh - 60px);
            width: 250px !important;
            transition: left var(--transition-normal);
          }

          .sidebar-container.mobile-open {
            left: 0;
          }

          .sidebar-container.collapsed .collapse-btn {
            display: none;
          }

          .main-content {
            border-left: none;
          }
        }
      `}</style>
    </>
  );
}
