import { useState } from 'react';
import AnimatedSection from '../common/AnimatedSection';
import SectionTitle from '../common/SectionTitle';
import { FaGithub, FaLinkedinIn, FaEnvelope, FaWhatsapp } from 'react-icons/fa';
import { socialLinks } from '../../data/socialLinks';
import styles from './Contact.module.css';

const iconMap = {
  FaGithub,
  FaLinkedinIn,
  FaEnvelope,
  FaWhatsapp,
};

export default function Contact() {
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
                Tem um projeto em mente?
              </h2>
              <p className={styles.ctaBannerSub}>
                Vamos trabalhar juntos e construir algo incrível!
              </p>
              <a href="mailto:allison_rps@hotmail.com" className={styles.ctaBannerBtn}>
                Fale Comigo →
              </a>
            </div>

            <SectionTitle
              label="Contato"
              title="Entre em"
              highlightText="Contato."
              subtitle="Estou sempre aberto a novas oportunidades e conversas sobre tecnologia."
            />

            <div className={styles.content}>
              {/* Left Column */}
              <div className={styles.leftCol}>
                <p className={styles.infoText}>
                  Se você tem um projeto, proposta ou simplesmente quer trocar uma
                  ideia sobre tecnologia, ficarei feliz em ouvir!
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
                  <label htmlFor="name">Nome</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Seu nome"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="message">Mensagem</label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Sua mensagem..."
                    value={formData.message}
                    onChange={handleChange}
                  />
                </div>

                <button type="submit" className={styles.submitBtn}>
                  Enviar Mensagem
                </button>

                {status === 'success' && (
                  <p className={styles.successMsg}>
                    Mensagem enviada com sucesso! Entrarei em contato em breve.
                  </p>
                )}

                {status === 'error' && (
                  <p className={styles.errorMsg}>
                    Por favor, preencha todos os campos.
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
              Desenvolvedor de software criando soluções modernas e escaláveis que geram impacto real.
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
            <h4>Links</h4>
            <a href="#hero">Home</a>
            <a href="#about">Sobre</a>
            <a href="#services">Serviços</a>
            <a href="#projects">Projetos</a>
          </div>
          <div className={styles.footerCol}>
            <h4>Serviços</h4>
            <a href="#services">Web Development</a>
            <a href="#services">Cloud Architecture</a>
            <a href="#services">Backend & APIs</a>
            <a href="#services">Mobile Apps</a>
          </div>
          <div className={styles.footerCol}>
            <h4>Contato</h4>
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
          © 2026 Allison Rodrigues. Todos os direitos reservados. Feito com{' '}
          <span>💚</span> e React.
        </div>
      </footer>
    </>
  );
}
