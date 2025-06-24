'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardContainer, { DashboardView } from '@/components/dashboard/DashboardContainer.tsx';

export default function DashboardPage() {
  const [initialView, setInitialView] = useState<DashboardView>('overview');
  const searchParams = useSearchParams();
  // Get initial view from URL params if provided
  useEffect(() => {
    const view = searchParams.get('view') as DashboardView;
    const validViews: Record<DashboardView, boolean> = {
      overview: true,
      transfers: true,
      automation: true,
      health: true,
      events: true,
      settings: true
    };
    if (view && validViews[view]) {
      setInitialView(view);
    }
  }, [searchParams]);
  return (
    <div className="dashboard-page min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white pondWater-font">
      <DashboardContainer initialView={initialView} />
    </div>
  );
}
