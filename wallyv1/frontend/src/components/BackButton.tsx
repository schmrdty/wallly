'use client';

import { useRouter } from 'next/navigation';

interface BackButtonProps {
    href?: string;
    className?: string;
    children?: React.ReactNode;
}

export default function BackButton({ href, className = '', children }: BackButtonProps) {
    const router = useRouter();

    const handleClick = () => {
        if (href) {
            router.push(href);
        } else {
            router.back();
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 ${className}`}
        >
            <span>←</span>
            {children || 'Back'}
        </button>
    );
}
