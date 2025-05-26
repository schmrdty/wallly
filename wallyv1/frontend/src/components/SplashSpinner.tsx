import React from 'react';
import styles from '../../styles/Splash.module.css';

export default function SplashSpinner() {
  return (
    <div>
      <img src="/splash.png" alt="Splash" width={200} height={200} />
      <div className={styles.spinnerContainer}>
        <div className={styles.spinner}></div>
      </div>
    </div>
  );
}
