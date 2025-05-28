'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

const DashboardUserInfoPage = () => {
  const router = useRouter();

  return (
    <div className="container" style={{ maxWidth: 600, margin: '40px auto', padding: 24 }}>
      <h1>User Info</h1>
      <p>This page will show detailed user information in the future.</p>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        style={{ marginTop: 24 }}
        onClick={() => router.push('/dashboard')}
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default DashboardUserInfoPage;
