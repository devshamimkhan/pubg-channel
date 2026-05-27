'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import WriteReviewModal from '@/components/channel/WriteReviewModal';

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

export default function CustomerReviewActions({
  channelId,
  totalReviews,
  allReviews = [],
  canWriteReview = false,
  alreadyReviewed = false,
}) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return (
    <>
      {canWriteReview ? (
        <button
          onClick={() => setShowReviewModal(true)}
          className="action-btn btn-outline"
          style={{ width: '100%', justifyContent: 'center', fontSize: '12px', marginTop: '4px' }}
        >
          <i className="fas fa-star"></i> Write a Review
        </button>
      ) : alreadyReviewed ? (
        <div
          style={{
            width: '100%',
            marginTop: '4px',
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '10px 12px',
            background: 'var(--bg-card2)',
          }}
        >
          <i className="fas fa-check-circle" style={{ color: 'var(--gold)', marginRight: '6px' }}></i>
          You have already submitted a review
        </div>
      ) : null}

      {totalReviews > 0 && (
        <button
          onClick={() => setShowAllReviewsModal(true)}
          className="action-btn btn-outline"
          style={{ width: '100%', justifyContent: 'center', fontSize: '12px', marginTop: '8px' }}
        >
          <i className="fas fa-comments"></i> View All {totalReviews} Reviews
        </button>
      )}

      {showReviewModal && (
        <WriteReviewModal
          channelId={channelId}
          onClose={() => setShowReviewModal(false)}
        />
      )}

      {mounted && showAllReviewsModal && createPortal((
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            onClick={() => setShowAllReviewsModal(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              maxWidth: '580px',
              maxHeight: '80vh',
              margin: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="font-raj" style={{ fontSize: '20px', fontWeight: '700' }}>
                <i className="fas fa-comments" style={{ color: 'var(--gold)', marginRight: '8px' }}></i>
                All Reviews
              </div>
              <button onClick={() => setShowAllReviewsModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {allReviews.map((review) => (
                <div key={review._id} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '13px' }}>
                      {(review.authorName || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-raj" style={{ fontSize: '13px', fontWeight: '700' }}>{review.authorName}</div>
                      <div style={{ color: 'var(--gold)', fontSize: '11px' }}>
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </div>
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-sub)' }}>{formatRelativeTime(review.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>"{review.text}"</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ), document.body)}
    </>
  );
}
