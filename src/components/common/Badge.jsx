import styles from './common.module.css';

const variantClass = {
  default: styles.badgeDefault,
  success: styles.badgeSuccess,
  warning: styles.badgeWarning,
  info: styles.badgeInfo,
};

/**
 * Compact badge with optional icon and color variant.
 *
 * @param {object}  props
 * @param {string}  props.text
 * @param {'default'|'success'|'warning'|'info'} [props.variant='default']
 * @param {React.ComponentType} [props.icon] - React Icon component (e.g. from react-icons)
 */
export default function Badge({ text, variant = 'default', icon: Icon }) {
  return (
    <span className={`${styles.badge} ${variantClass[variant] || variantClass.default}`}>
      {Icon && <Icon />}
      {text}
    </span>
  );
}
