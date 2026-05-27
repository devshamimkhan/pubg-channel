import PostCard from '@/components/post/PostCard';
import { connectDB } from '@/lib/db/mongoose';
import Channel from '@/lib/db/models/Channel';
import Post from '@/lib/db/models/Post';
import { notFound } from 'next/navigation';
import ChannelInputBar from '@/components/channel/ChannelInputBar';
import FeedScrollAnchor from '@/components/channel/FeedScrollAnchor';
import CustomerReviewSection from '@/components/post/templates/CustomerReviewSection';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export default async function ChannelFeedPage({ params }) {
  await connectDB();

  const { slug } = await params;
  const channel = await Channel.findOne({ slug }).lean();

  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'admin';

  if (!channel) {
    notFound();
  }

  const posts = await Post.find({ channel: channel._id }).sort({ createdAt: 1 }).lean();
  const feedRenderedAt = new Date().toISOString();
  const tickerText = channel.tickerText || 'FLASH SALE: 60 UC @ ৳45 | 325 UC @ ৳235 | 660 UC @ ৳450 | 1800 UC @ ৳1,150   ✅ Instant Delivery via UID   🏆 10,000+ Happy Customers   💳 bKash · Nagad · Rocket Accepted';
  const tickerEnabled = channel.tickerEnabled !== false;

  return (
    <div className="flex flex-col h-full bg-[var(--bg-dark)]">
      {/* ─── TICKER ─── */}
      {tickerEnabled && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(212,175,55,.08), rgba(212,175,55,.15), rgba(212,175,55,.08))',
          borderBottom: '1px solid rgba(212,175,55,.2)',
          padding: '7px 0',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <span className="ticker-text" style={{ fontSize: '12px', fontFamily: "'Rajdhani', sans-serif", fontWeight: '600', color: 'var(--gold)' }}>
            {tickerText}
          </span>
        </div>
      )}

      {/* ─── FEED ─── */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative scroll-smooth" id="feed" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px' }}>
        {/* Center wrapper */}
        <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Channel Created Pill */}
          <div className="text-center py-6">
            <div className="inline-block bg-[var(--bg-card2)] border border-[var(--border)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-2">
              Channel Created
            </div>
            <div className="text-[13px] text-[var(--text-sub)] font-medium">
              {new Date(channel.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Posts */}
          {posts.map(post => {
            const createdAtMs = new Date(post.createdAt).getTime();
            const countdownHours = parseInt(post.templateData?.countdownHours) || 4;
            const countdownSecondsRemaining = Math.max(0, Math.floor(((createdAtMs + countdownHours * 3600 * 1000) - feedRenderedAt) / 1000));

            const serializedPost = {
              ...post,
              _id: post._id.toString(),
              channel: post.channel.toString(),
              author: post.author.toString(),
              createdAt: post.createdAt.toISOString(),
              updatedAt: post.updatedAt.toISOString(),
              renderedAt: feedRenderedAt,
              desc: post.content,
              templateData: post.type === 'uc-flash-sale'
                ? {
                    ...post.templateData,
                    countdownSecondsRemaining,
                  }
                : post.templateData,
              reactions: post.reactions?.map(r => ({
                emoji: r.emoji,
                count: r.count,
                users: r.users?.map(u => u.toString()) || [],
              })) || [],
              media: post.media?.map(m => ({
                url: m.url,
                type: m.type,
              })) || [],
            };
            return <PostCard key={serializedPost._id} post={serializedPost} isAdmin={isAdmin} currentUserId={session?.user?.id} />;
          })}

          {/* Customer Reviews Section */}
          {channel.isReviewEnabled && (
            <CustomerReviewSection
              channelId={channel._id.toString()}
              currentUserId={session?.user?.id}
              isAdmin={isAdmin}
            />
          )}

          <FeedScrollAnchor />
        </div>
      </div>

      {/* ─── INPUT BAR ─── */}
      <ChannelInputBar
        channelId={channel._id.toString()}
        isAdmin={isAdmin}
      />
    </div>
  );
}
