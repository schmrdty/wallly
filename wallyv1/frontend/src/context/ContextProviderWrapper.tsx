'use client';
import React, { ReactNode } from 'react';
import ContextProvider from './index.js';

export default function ContextProviderWrapper({ children }: { children: ReactNode }) {
    return <ContextProvider cookies={null}>{children}</ContextProvider>;
}
