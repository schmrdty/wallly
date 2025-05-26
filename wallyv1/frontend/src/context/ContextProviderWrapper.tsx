'use client';
import React from 'react';
import ContextProvider from '@/context';

export default function ContextProviderWrapper({ cookies, children }: { cookies: string | null, children: React.ReactNode }) {
  return ContextProvider({ cookies, children });
}
