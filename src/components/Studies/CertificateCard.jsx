import { FaShieldAlt, FaLanguage, FaMicrosoft } from 'react-icons/fa';
import { SiMongodb } from 'react-icons/si';
import styles from './Studies.module.css';

export default function CertificateCard({ certificate }) {
  const { name, issuer, image } = certificate;

  const renderPlaceholderIcon = () => {
    if (issuer.includes('MongoDB')) return <SiMongodb />;
    if (issuer.includes('Microsoft')) return <FaMicrosoft />;
    if (issuer.includes('TOEIC')) return <FaLanguage />;
    return <FaShieldAlt />;
  };

  return (
    <div className={styles.badgeSelector} data-tooltip={`${issuer} // ${name}`}>
      {/* Target crop brackets on hover */}
      <div className={`${styles.badgeCorner} ${styles.badgeTL}`} />
      <div className={`${styles.badgeCorner} ${styles.badgeTR}`} />
      <div className={`${styles.badgeCorner} ${styles.badgeBL}`} />
      <div className={`${styles.badgeCorner} ${styles.badgeBR}`} />

      <div className={styles.badgeImageWrapper}>
        {image ? (
          <img src={image} alt={name} className={styles.badgeImg} loading="lazy" />
        ) : (
          <div className={styles.badgePlaceholder}>
            {renderPlaceholderIcon()}
          </div>
        )}
      </div>
      <div className={styles.badgeGlow} />
    </div>
  );
}
