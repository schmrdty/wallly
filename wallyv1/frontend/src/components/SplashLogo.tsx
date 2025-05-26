import React from 'react';
import Image from 'next/image';
import styles from '../../styles/Splash.module.css';

export const SplashLogo = () => {
  return (
    <div className={styles.logoContainer}>
      <Image 
        src="/logo.png" 
        alt="Wally Logo" 
        width={120} 
        height={120} 
        priority
      />
    </div>
  );
};
