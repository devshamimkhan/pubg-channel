'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import FaviconSync from './FaviconSync';

export default function SessionWrapper({ children, initialFaviconHref }) {
  return (
    <SessionProvider>
      <FaviconSync initialHref={initialFaviconHref} />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            border: '2px solid #000',
            borderRadius: '12px',
            background: '#111',
            color: '#fff',
            boxShadow: '6px 6px 0 #000',
            fontFamily: 'var(--font-rajdhani), sans-serif',
            fontWeight: 600,
          },
          success: {
            iconTheme: {
              primary: '#00c853',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {children}
    </SessionProvider>
  );
}
