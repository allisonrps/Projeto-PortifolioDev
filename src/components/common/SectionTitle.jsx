import styles from './common.module.css';

/**
 * Section heading with label, title and optional subtitle.
 * Follows the reference design with small uppercase label + dot + large heading.
 */
export default function SectionTitle({ label, title, highlightText, subtitle, centered = false }) {
  return (
    <div className={styles.sectionTitle} style={centered ? { textAlign: 'center' } : {}}>
      {label && (
        <div className={styles.label}>
          <span className={styles.labelDot} />
          {label}
        </div>
      )}
      <h2>
        {title}{' '}
        {highlightText && <span className="highlight" style={{ color: 'var(--accent)' }}>{highlightText}</span>}
      </h2>
      {subtitle && <p style={centered ? { margin: '12px auto 0' } : {}}>{subtitle}</p>}
    </div>
  );
}
