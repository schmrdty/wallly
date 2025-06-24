import React from 'react';
import Link from 'next/link';

export const HomeNav: React.FC = () => (
  <nav>
    <Link href='/instructions'>Instructions</Link>
    <Link href='/feedback'>Feedback</Link>
  </nav>
);
