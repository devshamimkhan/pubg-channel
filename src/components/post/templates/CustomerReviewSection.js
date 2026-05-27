import { getReviews, getReviewCount, hasUserReviewed } from '@/actions/reviews';
import CustomerReviewActions from './CustomerReviewActions';
// Utility to format relative time
const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Utility to generate a consistent gradient based on a string (like username)
const generateGradient = (name) => {
  const colors = [
    ['#2D4A1A', '#4A8A25'],
    ['#1A2A4A', '#254A8A'],
    ['#4A1A1A', '#8A2525'],
    ['#4A3C1A', '#8A7325'],
    ['#3C1A4A', '#73258A'],
  ];
  const charCode = (name || 'A').charCodeAt(0);
  const colorPair = colors[charCode % colors.length];
  return `linear-gradient(135deg, ${colorPair[0]}, ${colorPair[1]})`;
};

export default async function CustomerReviewSection({ channelId, currentUserId, isAdmin }) {
  // Fetch latest 2 reviews and total count
  const reviews = await getReviews(channelId, 2);
  const totalReviews = await getReviewCount(channelId);
  const allReviews = totalReviews > reviews.length ? await getReviews(channelId, totalReviews) : reviews;
  const alreadyReviewed = currentUserId ? await hasUserReviewed(channelId, currentUserId) : false;
  const canWriteReview = Boolean(currentUserId) && !isAdmin && !alreadyReviewed;

  // For the moment we will show the section even if empty, 
  // or you might want to return null if totalReviews === 0.
  // For better discoverability of the feature, we'll show a placeholder if empty.

  return (
    <div className="post-card">
      <div className="post-body">
        <span className="post-tag tag-offer"><i className="fas fa-star"></i> CUSTOMER REVIEW</span>
        <div className="post-title font-raj">⭐ What Our Customers Say</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '10px 0' }}>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review._id} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div className="avatar" style={{ 
                    width: '32px', height: '32px', fontSize: '13px', 
                    background: generateGradient(review.authorName)
                  }}>
                    {review.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-raj" style={{ fontSize: '13px', fontWeight: '700' }}>{review.authorName}</div>
                    <div style={{ color: 'var(--gold)', fontSize: '11px' }}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-sub)' }}>
                    {formatRelativeTime(review.createdAt)}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>"{review.text}"</div>
              </div>
            ))
          ) : (
            <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No reviews yet. Be the first to leave a review!
            </div>
          )}
        </div>

        <CustomerReviewActions
          channelId={channelId}
          totalReviews={totalReviews}
          allReviews={allReviews}
          canWriteReview={canWriteReview}
          alreadyReviewed={alreadyReviewed}
        />
      </div>
      <div className="post-footer" style={{ justifyContent: 'flex-end' }}>
        <span className="post-time">Updated Daily</span>
      </div>
    </div>
  );
}
