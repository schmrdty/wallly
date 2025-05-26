import React from 'react';
import type { AppProps } from 'next/app';
import WagmiProviders from '@/context';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return WagmiProviders({
    cookies: pageProps.cookies || null,
    children: <Component {...pageProps} />,
  });
}

export default MyApp;