import { Rajdhani, Exo_2 } from 'next/font/google';
import './globals.css';
import SessionWrapper from '@/components/layouts/SessionWrapper';
import { getSeoMetadata, getSiteSettingsSnapshot } from '@/lib/seo-metadata';

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
});

const exo2 = Exo_2({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-exo2',
  display: 'swap',
});

export async function generateMetadata() {
  return getSeoMetadata();
}

async function getSiteMetadata() {
  return getSiteSettingsSnapshot();
}

export default async function RootLayout({ children }) {
  const settings = await getSiteMetadata();
  const faviconHref = settings?.favicon ? settings.favicon : '/favicon.ico';

  return (
    <html
      lang="en"
      className={`${rajdhani.variable} ${exo2.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <SessionWrapper initialFaviconHref={faviconHref}>{children}</SessionWrapper>
      </body>
    </html>
  );
}
