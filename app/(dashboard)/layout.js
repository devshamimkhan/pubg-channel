import { connectDB } from '@/lib/db/mongoose';
import Channel from '@/lib/db/models/Channel';
import User from '@/lib/db/models/User';
import ChannelLayoutClient from '@/components/channel/ChannelLayoutClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardLayout({ children }) {
  await connectDB();
  
  // Fetch channels from database
  const channels = await Channel.find().lean();
  const onlineCutoff = new Date(Date.now() - 2 * 60 * 1000);
  const channelsWithStats = await Promise.all(
    channels.map(async (c) => {
      const followerIds = Array.isArray(c.followers) ? c.followers.map((f) => String(f)) : [];
      const onlineFollowerCount = followerIds.length
        ? await User.countDocuments({
            _id: { $in: followerIds },
            lastSeenAt: { $gte: onlineCutoff },
          })
        : 0;
      return {
        ...c,
        followers: followerIds,
        followersCount: followerIds.length,
        onlineCount: onlineFollowerCount,
      };
    })
  );
  const serializedChannels = channelsWithStats.map((c) => ({
    _id: String(c._id),
    name: c.name || '',
    slug: c.slug || '',
    description: c.description || '',
    avatar: c.avatar || '',
    coverImage: c.coverImage || '',
    isVerified: Boolean(c.isVerified),
    isPinned: Boolean(c.isPinned),
    followers: c.followers,
    followersCount: Number(c.followersCount),
    onlineCount: Number(c.onlineCount),
    createdBy: c.createdBy ? String(c.createdBy) : null,
    isReviewEnabled: Boolean(c.isReviewEnabled),
    tickerEnabled: c.tickerEnabled !== false,
    tickerText: c.tickerText || '',
    latestPostPreview: '',
    latestPostAt: null,
    unseenCount: 0,
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : null,
    updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : null,
  }));

  return (
    <ChannelLayoutClient channels={serializedChannels}>
      {children}
    </ChannelLayoutClient>
  );
}
