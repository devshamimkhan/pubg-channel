import { connectDB } from '@/lib/db/mongoose';
import '@/lib/db/models/Channel';
import SiteSettings from '@/lib/db/models/SiteSettings';
import HomepageClient from '@/components/home/HomepageClient';

export default async function Homepage() {
  await connectDB();

  const settings = await SiteSettings.findOne().populate('featuredChannels').lean();

  return <HomepageClient settings={settings ? JSON.parse(JSON.stringify(settings)) : null} />;
}
