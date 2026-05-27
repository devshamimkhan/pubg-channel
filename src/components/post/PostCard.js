'use client';

import AnnouncementPost from './templates/AnnouncementPost';
import FlashSalePost from './templates/FlashSalePost';
import TextPost from './templates/TextPost';
import MediaPost from './templates/MediaPost';
import PollPost from './templates/PollPost';
import RoyalPassPost from './templates/RoyalPassPost';
import CustomerReviewPost from './templates/CustomerReviewPost';
import ReactionBar from './ReactionBar';
import PostActions from './PostActions';

export default function PostCard({ post, isAdmin, currentUserId }) {
  const isPinned = post.isPinned;
  
  // Format createdAt into a readable time
  const date = new Date(post.createdAt);
  const now = new Date();
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const displayTime = isToday ? `Today, ${timeStr}` : `${dateStr}, ${timeStr}`;

  // Special rendering for text posts (WhatsApp Chat Bubble style)
  if (post.type === 'text') {
    return (
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <TextPost post={post} />
        {/* Admin actions – overlaid top-right of the bubble */}
        {isAdmin && (
          <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
            <PostActions post={post} />
          </div>
        )}
        
        {/* Reaction Bar for text posts */}
        <div className="mt-1 ml-1">
          <ReactionBar postId={post._id} reactions={post.reactions} viewCount={post.viewCount} currentUserId={currentUserId} />
        </div>
      </div>
    );
  }

  // Standard Template Cards
  return (
    <div className={`post-card ${isPinned ? 'pinned' : ''}`}>
      <div className="post-body" style={{ position: 'relative' }}>
        {/* Admin actions – top-right corner of card */}
        {isAdmin && (
          <div style={{ position: 'absolute', top: '0', right: '0', zIndex: 10 }}>
            <PostActions post={post} />
          </div>
        )}

        {post.type === 'announcement' && <AnnouncementPost post={post} />}
        {post.type === 'uc-flash-sale' && <FlashSalePost post={post} />}
        {post.type === 'media' && <MediaPost post={post} isAdmin={isAdmin} currentUserId={currentUserId} />}
        {post.type === 'poll' && <PollPost post={post} />}
        {post.type === 'royal-pass' && <RoyalPassPost post={post} />}
        {post.type === 'customer-review' && <CustomerReviewPost post={post} />}
      </div>

      <div className="post-footer">
        <ReactionBar postId={post._id} reactions={post.reactions} viewCount={post.viewCount} currentUserId={currentUserId} />
        <div className="post-time">{displayTime}</div>
      </div>
    </div>
  );
}
