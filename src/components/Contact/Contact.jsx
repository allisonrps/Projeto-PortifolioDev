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

function Contact() {
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
    <AnimatedSection id="contact">
      <section className={styles.contact}>
        <div className={styles.contactInner}>
          <SectionTitle
            title="Contato"
            subtitle="Vamos conversar? Entre em contato comigo"
          />

          <div className={styles.content}>
            {/* Left Column */}
            <div className={styles.leftCol}>
              <p className={styles.infoText}>
                Estou sempre aberto a novas oportunidades, colaborações e conversas
                sobre tecnologia. Se você tem um projeto em mente, uma proposta ou
                simplesmente quer trocar uma ideia, ficarei feliz em ouvir!
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
                  Por favor, preencha todos os campos antes de enviar.
                </p>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            © 2026 Allison Rodrigues — Feito com <span>💜</span> e React
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}

export default Contact;
