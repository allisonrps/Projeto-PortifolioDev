import { useState, useEffect, useCallback } from 'react';
import Logo from './Logo';
import styles from './Header.module.css';

const NAV_ITEMS = [
  { label: 'Home', sectionId: 'hero' },
  { label: 'Sobre', sectionId: 'about' },
  { label: 'Serviços', sectionId: 'services' },
  { label: 'Projetos', sectionId: 'projects' },
  { label: 'Estudos', sectionId: 'studies' },
  { label: 'Contato', sectionId: 'contact' },
];

export default function Header() {
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY + 120;
    for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
      const section = document.getElementById(NAV_ITEMS[i].sectionId);
      if (section && section.offsetTop <= scrollY) {
        setActiveSection(NAV_ITEMS[i].sectionId);
        return;
      }
    }
    setActiveSection('hero');
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollToSection = (sectionId) => {
    if (sectionId === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        window.scrollTo({
          top: el.getBoundingClientRect().top + window.scrollY - 72,
          behavior: 'smooth',
        });
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Logo />

        <nav className={styles.nav} aria-label="Navegação principal">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.sectionId}
              className={`${styles.navLink} ${activeSection === item.sectionId ? styles.navLinkActive : ''}`}
              onClick={() => scrollToSection(item.sectionId)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button className={styles.ctaButton} onClick={() => scrollToSection('contact')} type="button">
          Fale Comigo
        </button>

        <button
          className={`${styles.mobileToggle} ${mobileMenuOpen ? styles.mobileToggleOpen : ''}`}
          onClick={() => setMobileMenuOpen((p) => !p)}
          type="button"
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          <span /><span /><span />
        </button>
      </div>

      <nav className={`${styles.mobileNav} ${mobileMenuOpen ? styles.mobileNavOpen : ''}`}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.sectionId}
            className={`${styles.mobileNavLink} ${activeSection === item.sectionId ? styles.mobileNavLinkActive : ''}`}
            onClick={() => scrollToSection(item.sectionId)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
