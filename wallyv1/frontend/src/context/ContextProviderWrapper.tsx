'use client';
import React, { ReactNode } from 'react';
import ContextProvider from '@/context';

export default function ContextProviderWrapper({ children }: { children: ReactNode }) {
    
  // You can pass cookies here if needed for SSR
  return ContextProvider({ children, cookies: null });
}
