"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import SplashSpinner from '@/components/SplashSpinner';

const SplashPage = () => (
  <div className="container">
    <SplashSpinner />
    {/* ... */}
  </div>
);

export default SplashPage;