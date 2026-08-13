import { useState, useEffect, useCallback } from 'react';
import Logo from './Logo';
import styles from './Header.module.css';

const NAV_ITEMS = [
  { sectionId: 'hero' },
  { sectionId: 'services' },
  { sectionId: 'projects' },
  { sectionId: 'studies' },
  { sectionId: 'contact' },
];

const navLabels = {
  pt: { hero: 'Home', services: 'Serviços', projects: 'Projetos', studies: 'Estudos', contact: 'Contato' },
  en: { hero: 'Home', services: 'Services', projects: 'Projects', studies: 'Studies', contact: 'Contact' }
};

const ctaLabels = {
  pt: 'Fale Comigo',
  en: 'Contact Me'
};

export default function Header({ lang, setLang }) {
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
              {navLabels[lang][item.sectionId]}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Language Selector Toggle */}
          <div className={styles.langToggleWrapper}>
            <button
              className={`${styles.langBtn} ${lang === 'pt' ? styles.langBtnActive : ''}`}
              onClick={() => setLang('pt')}
              title="Português"
              type="button"
            >
              🇧🇷 <span className={styles.langLabel}>PT</span>
            </button>
            <button
              className={`${styles.langBtn} ${lang === 'en' ? styles.langBtnActive : ''}`}
              onClick={() => setLang('en')}
              title="English"
              type="button"
            >
              🇺🇸 <span className={styles.langLabel}>EN</span>
            </button>
          </div>

          <button className={styles.ctaButton} onClick={() => scrollToSection('contact')} type="button">
            {ctaLabels[lang]}
          </button>
        </div>

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
            {navLabels[lang][item.sectionId]}
          </button>
        ))}
      </nav>
    </header>
  );
}
