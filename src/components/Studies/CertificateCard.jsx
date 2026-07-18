import Badge from '../common/Badge';
import { FiExternalLink } from 'react-icons/fi';
import styles from './Studies.module.css';

const statusMap = {
  concluido: { text: 'Concluído', variant: 'success' },
  'em-andamento': { text: 'Em andamento', variant: 'warning' },
};

/**
 * Individual certificate card with name, issuer, year, status badge
 * and an optional verification link.
 *
 * @param {object}  props
 * @param {object}  props.certificate
 * @param {string}  props.certificate.name
 * @param {string}  props.certificate.issuer
 * @param {number}  props.certificate.year
 * @param {'concluido'|'em-andamento'} props.certificate.status
 * @param {string}  [props.certificate.verifyUrl]
 */
export default function CertificateCard({ certificate }) {
  const { name, issuer, year, status, verifyUrl } = certificate;
  const badge = statusMap[status] || statusMap.concluido;

  return (
    <div className={styles.certCard}>
      <h4 className={styles.certName}>{name}</h4>

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
  );
}
