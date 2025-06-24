import '../lib/polyfills';
import { Providers } from './providers';
import { AuthGuard } from '@/components/AuthGuard';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const frameEmbed = {
  version: "next",
  imageUrl: "https://wally.schmidtiest.xyz/wally-preview.png",
  button: {
    title: "🛟 Start Watching",
    action: {
      type: "launch_frame",
      url: "https://wally.schmidtiest.xyz/",
      name: "Wally the Wallet Watcher",
      splashImageUrl: "https://wally.schmidtiest.xyz/wally-preview.png",
      splashBackgroundColor: "#000000" // Changed to black
    }
  }
};

export const metadata: Metadata = {
  title: 'Wally the Wallet Watcher',
  description: 'Automate non-custodial wallet monitoring and transfers.',
  manifest: '/manifest.json',
  keywords: ['wallet', 'automation', 'crypto', 'blockchain', 'DeFi', 'Ethereum', 'Base'],
  authors: [{ name: 'Wally Team' }],
  creator: 'Wally Team',
  publisher: 'Wally Team',
  metadataBase: new URL('https://wally.schmidtiest.xyz'),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'fc:frame': JSON.stringify(frameEmbed)
  },
  openGraph: {
    title: 'Wally the Wallet Watcher',
    description: 'Non-custodial wallet automation and monitoring',
    url: 'https://wally.schmidtiest.xyz',
    siteName: 'Wally',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Wally the Wallet Watcher',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wally the Wallet Watcher',
    description: 'Non-custodial wallet automation and monitoring',
    images: ['/opengraph-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#7c3aed' },
    { media: '(prefers-color-scheme: dark)', color: '#181a20' },
  ],
  colorScheme: 'light dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Suppress Lit dev mode warning in production
  if (typeof window !== 'undefined') {
    (window as any)['lit-dev-mode'] = false;
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href="https://wally.schmidtiest.xyz/" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Wally" />
        <meta name="application-name" content="Wally" />
        <meta name="msapplication-TileColor" content="#7c3aed" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <AuthGuard>
            {children}
          </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
