"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-center p-8">
      <h1 className="text-5xl font-bold text-red-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        Sorry, the page you are looking for does not exist or an error occurred.
        <br />
        Please check the URL or return to a safe page. You may have been signed
        out.
      </p>
      <div className="flex gap-4">
        <Link href="/">
          <span className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
            Go Home
          </span>
        </Link>
        <Link href="/dashboard">
          <span className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition">
            Dashboard
          </span>
        </Link>
      </div>
    </div>
  );
}
