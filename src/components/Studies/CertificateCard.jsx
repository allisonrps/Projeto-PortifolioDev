import Badge from '../common/Badge';
import { FiExternalLink } from 'react-icons/fi';
import { FaShieldAlt } from 'react-icons/fa';
import { SiMongodb } from 'react-icons/si';
import styles from './Studies.module.css';

const statusMap = {
  concluido: { text: 'Concluído', variant: 'success' },
  'em-andamento': { text: 'Em andamento', variant: 'warning' },
};

export default function CertificateCard({ certificate }) {
  const { name, issuer, year, status, verifyUrl, image } = certificate;
  const badge = statusMap[status] || statusMap.concluido;

  return (
    <div className={styles.certCard}>
      {/* Badge/Seal Image */}
      <div className={styles.certBadgeWrapper}>
        {image ? (
          <img src={image} alt={name} className={styles.certBadgeImg} loading="lazy" />
        ) : (
          <div className={styles.certBadgePlaceholder}>
            {issuer.includes('MongoDB') ? <SiMongodb /> : <FaShieldAlt />}
          </div>
        )}
      </div>

      <h4 className={styles.certName}>{name}</h4>

      <div style={{ marginTop: 'auto' }}>
        <span className={styles.certIssuer}>{issuer}</span>
        <span className={styles.certYear}> · {year}</span>

        <div className={styles.certStatus}>
          <Badge text={badge.text} variant={badge.variant} />
        </div>

        {verifyUrl && (
          <a
            href={verifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.certLink}
          >
            Verificar <FiExternalLink />
          </a>
        )}
      </div>
    </div>
  );
}
