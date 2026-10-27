import { useState, useEffect } from 'react';
import AnimatedSection from '../common/AnimatedSection';
import SectionTitle from '../common/SectionTitle';
import { FaGithub, FaLinkedinIn, FaEnvelope, FaWhatsapp } from 'react-icons/fa';
import { FiEye } from 'react-icons/fi';
import { socialLinks } from '../../data/socialLinks';
import { translations } from '../../data/translations';
import styles from './Contact.module.css';

const iconMap = {
  FaGithub,
  FaLinkedinIn,
  FaEnvelope,
  FaWhatsapp,
};

export default function Contact({ lang }) {
  const t = translations[lang] || translations.pt;

  const [visitCount, setVisitCount] = useState(() => {
    const cached = localStorage.getItem('allison_portfolio_views');
    return cached ? parseInt(cached, 10) : 1482;
  });

  useEffect(() => {
    const BASE_OFFSET = 1480;
    const sessionKey = 'allison_portfolio_session_v1';
    const hasVisited = sessionStorage.getItem(sessionKey);
    const endpoint = hasVisited
      ? 'https://countapi.mileshilliard.com/api/v1/get/allison_rodrigues_dev_portfolio'
      : 'https://countapi.mileshilliard.com/api/v1/hit/allison_rodrigues_dev_portfolio';

    fetch(endpoint)
      .then((res) => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then((data) => {
        if (data && typeof data.value !== 'undefined') {
          const val = parseInt(data.value, 10);
          const total = BASE_OFFSET + (isNaN(val) ? 0 : val);
          setVisitCount(total);
          localStorage.setItem('allison_portfolio_views', total.toString());
          if (!hasVisited) {
            sessionStorage.setItem(sessionKey, '1');
          }
        }
      })
      .catch(() => {
        // Keeps fallback or cached views gracefully
      });
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState(null); // 'success' | 'error' | null

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setStatus('error');
      return;
    }

    // Mock submission — no real email sending
    setStatus('success');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <>
      <AnimatedSection id="contact">
        <section className={styles.contact}>
          <div className={styles.contactInner}>
            {/* CTA Banner */}
            <div className={styles.ctaBanner}>
              <h2 className={styles.ctaBannerTitle}>
                {t.contactCtaTitle}
              </h2>
              <p className={styles.ctaBannerSub}>
                {t.contactCtaSub}
              </p>
              <a href="mailto:allison_rps@hotmail.com" className={styles.ctaBannerBtn}>
                {t.contactCtaBtn}
              </a>
            </div>

            <SectionTitle
              label={t.contactLabel}
              title={t.contactTitle}
              highlightText={t.contactHighlight}
              subtitle={t.contactSub}
            />

            <div className={styles.content}>
              {/* Left Column */}
              <div className={styles.leftCol}>
                <p className={styles.infoText}>
                  {t.contactText}
                </p>

                <div className={styles.socialLinks}>
                  {socialLinks.map((link) => {
                    const IconComponent = iconMap[link.icon];
                    return (
                      <a
                        key={link.name}
                        href={link.url}
                        className={styles.socialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {IconComponent && <IconComponent />}
                        <span>{link.name}</span>
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Right Column — Form */}
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">{t.contactName}</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder={t.contactNamePlaceholder}
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">{t.contactEmail}</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder={t.contactEmailPlaceholder}
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="message">{t.contactMsg}</label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder={t.contactMsgPlaceholder}
                    value={formData.message}
                    onChange={handleChange}
                  />
                </div>

                <button type="submit" className={styles.submitBtn}>
                  {t.contactSubmit}
                </button>

                {status === 'success' && (
                  <p className={styles.successMsg}>
                    {t.contactSuccess}
                  </p>
                )}

                {status === 'error' && (
                  <p className={styles.errorMsg}>
                    {t.contactError}
                  </p>
                )}
              </form>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <h3>
              Allison<span>.</span>
            </h3>
            <p>
              {t.footerBrandDesc}
            </p>
            <div className={styles.footerSocials}>
              {socialLinks.map((link) => {
                const IconComponent = iconMap[link.icon];
                return (
                  <a
                    key={link.name}
                    href={link.url}
                    className={styles.footerSocialIcon}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {IconComponent && <IconComponent />}
                  </a>
                );
              })}
            </div>
          </div>
          <div className={styles.footerCol}>
            <h4>{t.footerColLinks}</h4>
            <a href="#hero">{t.navHome}</a>
            <a href="#hero">{t.navAbout}</a>
            <a href="#services">{t.navServices}</a>
            <a href="#projects">{t.navProjects}</a>
          </div>
          <div className={styles.footerCol}>
            <h4>{t.footerColServices}</h4>
            <a href="#services">{t.serviceWebTitle}</a>
            <a href="#services">{t.serviceCloudTitle}</a>
            <a href="#services">{t.serviceApiTitle}</a>
            <a href="#services">{t.serviceMobileTitle}</a>
          </div>
          <div className={styles.footerCol}>
            <h4>{t.footerColContact}</h4>
            <a href="mailto:allison_rps@hotmail.com">Email</a>
            <a
              href="https://github.com/allisonrps"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href="https://linkedin.com/in/allisonrps"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <div className={styles.footerBottomText}>
            © 2026 Allison Rodrigues. {t.footerRights}
          </div>
          <div className={styles.visitorCounter} title={t.footerViewsTooltip}>
            <span className={styles.counterPulse} />
            <FiEye className={styles.counterIcon} />
            <span className={styles.counterNumber}>
              {visitCount !== null ? visitCount.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US') : '...'}
            </span>
            <span className={styles.counterLabel}>
              {t.footerVisits}
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
