'use client';
import React from 'react';
import Image from 'next/image';

export const SplashLogo = () => {
  return (
    <div className='logo-container'>
      <Image 
        src='/logo.png' 
        alt='Wally Logo' 
        width={120} 
        height={120} 
        priority
      />
    </div>
  );
};

export default SplashLogo;
