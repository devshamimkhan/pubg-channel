'use client';
import { SessionProvider } from 'next-auth/react';
import FaviconSync from './FaviconSync';

export default function SessionWrapper({ children }) {
  return (
    <SessionProvider>
      <FaviconSync />
      {children}
    </SessionProvider>
  );
}