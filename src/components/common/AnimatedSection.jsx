import { motion } from 'framer-motion';

/**
 * Wrapper component that animates its children into view
 * with a fade-in + slide-up effect when scrolled into the viewport.
 *
 * @param {object}  props
 * @param {React.ReactNode} props.children
 * @param {string}  [props.className]
 * @param {string}  [props.id]
 * @param {number}  [props.delay=0] - Animation delay in seconds
 */
export default function AnimatedSection({ children, className, id, delay = 0 }) {
  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
    >
      {children}
    </motion.section>
  );
}
