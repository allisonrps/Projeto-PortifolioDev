import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './Preloader.module.css';

export default function Preloader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth progress simulation from 0 to 100
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Random increments to make it feel organic
        const increment = Math.floor(Math.random() * 8) + 4;
        return Math.min(prev + increment, 100);
      });
    }, 60);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className={styles.preloaderContainer}
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.05,
        filter: 'blur(10px)',
        transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] }
      }}
    >
      <div className={styles.preloaderInner}>
        {/* Glowing HUD Tech Ring */}
        <div className={styles.spinnerWrapper}>
          <div className={styles.hudRingOuter} />
          <div className={styles.hudRingInner} />
          <div className={styles.hudDot} />
        </div>

        {/* Brand / Logo */}
        <div className={styles.brandContainer}>
          <motion.h1
            className={styles.brandName}
            initial={{ letterSpacing: '0.1em', opacity: 0 }}
            animate={{ letterSpacing: '0.3em', opacity: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            ALLISON SILVA
          </motion.h1>
          <motion.span
            className={styles.brandSub}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            SYSTEM CORE INITIALIZED
          </motion.span>
        </div>

        {/* Progress Display */}
        <div className={styles.progressArea}>
          <div className={styles.progressBarWrapper}>
            <motion.div
              className={styles.progressBar}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className={styles.progressText}>
            <span>BOOTING SYSTEM...</span>
            <span className={styles.percentage}>{progress}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
