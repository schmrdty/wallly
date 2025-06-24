export default function manifest() {
    return {
        name: 'Wally the Wallet Watcher',
        short_name: 'Wally',
        description: 'Automate non-custodial wallet monitoring and transfers.',
        start_url: '/',
        display: 'standalone',
        background_color: '#181a20',
        theme_color: '#7c3aed',
        icons: [
            {
                src: '/icon-32.png',
                sizes: '32x32',
                type: 'image/png',
            },
            {
                src: '/icon-256.png',
                sizes: '256x256',
                type: 'image/png',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
