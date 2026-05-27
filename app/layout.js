import { Rajdhani, Exo_2 } from 'next/font/google';
import { connectDB } from '@/lib/db/mongoose';
import SiteSettings from '@/lib/db/models/SiteSettings';
import './globals.css';
import SessionWrapper from '@/components/layouts/SessionWrapper';

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

const DEFAULT_TITLE = 'PUBG UC Store BD – Official Channel';
const DEFAULT_DESCRIPTION = 'Official PUBG UC Store Bangladesh. Buy UC cheap & fast. WhatsApp Channel, Royal Pass, Flash Sales & more.';

async function getSiteMetadata() {
  try {
    await connectDB();
    const settings = await SiteSettings.findOne().lean();

    return settings ? JSON.parse(JSON.stringify(settings)) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata() {
  const settings = await getSiteMetadata();
  const title = settings?.siteName || DEFAULT_TITLE;
  const description = settings?.siteDescription || DEFAULT_DESCRIPTION;
  const favicon = settings?.favicon || '/favicon.ico';

  return {
    title,
    description,
    icons: {
      icon: favicon,
      shortcut: favicon,
    },
  };
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${rajdhani.variable} ${exo2.variable}`}
      suppressHydrationWarning
    >
      <body>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}
