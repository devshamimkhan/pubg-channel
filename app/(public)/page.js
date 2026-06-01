import { connectDB } from '@/lib/db/mongoose';
import '@/lib/db/models/Channel';
import SiteSettings from '@/lib/db/models/SiteSettings';
import HomepageClient from '@/components/home/HomepageClient';
import { createSeoMetadata } from '@/lib/seo-metadata';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function serialize(value) {
  return value ? JSON.parse(JSON.stringify(value)) : null;
}

async function readHomepageSettings() {
  try {
    await connectDB();
    const settings = await SiteSettings.findOne().populate('featuredChannels').lean();
    return serialize(settings);
  } catch (error) {
    console.error('Homepage settings load failed:', error);
    return null;
  }
}

export async function generateMetadata() {
  const resolvedSettings = await readHomepageSettings();

  return createSeoMetadata(resolvedSettings, {
    pageTitle: resolvedSettings?.siteName || 'PUBG UC Store BD',
    pageDescription:
      resolvedSettings?.seo?.metaDescription ||
      resolvedSettings?.siteDescription ||
      'Official PUBG UC Store Bangladesh. Buy UC cheap & fast.',
    canonicalUrl: '/',
  });
}

export default async function Homepage() {
  const settings = await readHomepageSettings();

  return <HomepageClient settings={settings} />;
}
