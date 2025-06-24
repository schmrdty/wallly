'use client';

export function DashboardNavigation() {
    const quickLinks = [
        { href: '/settings', title: 'Settings', description: 'Configure Wally', color: 'purple' },
        { href: '/terms', title: 'Terms', description: 'Terms & Conditions', color: 'gray' },
        { href: '/disclaimer', title: 'Disclaimer', description: 'Important notices', color: 'red' },
        { href: '/feedback', title: 'Feedback', description: 'Send feedback', color: 'blue' },
        { href: '/health', title: 'Health', description: 'System status', color: 'green' },
    ];

    const getColorClasses = (color: string) => {
        const colorMap = {
            purple: 'bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-200',
            gray: 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200',
            blue: 'bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-200',
            green: 'bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-200',
            red: 'bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-200',
        };
        return colorMap[color as keyof typeof colorMap] || colorMap.gray;
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Quick Links</h2>
            <div className="grid grid-cols-2 gap-4">
                {quickLinks.map((link) => (
                    <a
                        key={link.href}
                        href={link.href}
                        className={`p-4 rounded-lg text-center transition duration-200 block w-full h-full ${getColorClasses(link.color)}`}
                    >
                        <div className="font-semibold">{link.title}</div>
                        <div className="text-sm opacity-75">{link.description}</div>
                    </a>
                ))}
            </div>
        </div>
    );
}
