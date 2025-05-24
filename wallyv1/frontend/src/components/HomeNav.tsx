import React from 'react';
import Link from 'next/link';

export const HomeNav: React.FC = () => (
  <nav>
    <Link href="/Instructions">Instructions</Link>
    <Link href="/Share">Share</Link>
    <Link href="/Feedback">Feedback</Link>
  </nav>
);
