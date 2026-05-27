'use client';

import { useEffect, useState } from 'react';
import { submitReview } from '@/actions/reviews';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

export default function WriteReviewModal({ channelId, onClose }) {
  const { data: session } = useSession();
  const router = useRouter();

  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please write a review text');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await submitReview({
        channel: channelId,
        author: session?.user?.id,
        authorName: session?.user?.name || 'Anonymous',
        rating,
        text,
      });

      if (result.success) {
        router.refresh();
        onClose();
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal((
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />

      <div style={{
        position: 'relative', zIndex: 1,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', width: '100%', maxWidth: '400px',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        animation: 'slideUp .3s ease',
        margin: '16px',
      }}>
        <div style={{
          padding: '20px 24px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 className="font-raj" style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
            <i className="fas fa-star text-[var(--gold)] mr-2"></i> Write a Review
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: '20px', padding: '4px',
          }}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div style={{ height: '1px', background: 'var(--border)', margin: '0 24px' }} />

        <div style={{ padding: '20px 24px' }}>
          <form id="reviewForm" onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: 'rgba(255,68,68,.1)', border: '1px solid rgba(255,68,68,.3)',
                borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
                fontSize: '13px', color: 'var(--accent-red)',
              }}>
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '28px', color: star <= rating ? 'var(--gold)' : 'var(--text-muted)',
                    transition: 'color 0.2s', padding: 0
                  }}
                >
                  <i className="fas fa-star"></i>
                </button>
              ))}
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tell us about your experience..."
              rows={4}
              style={{
                width: '100%',
                background: 'var(--bg-card2)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '14px 16px',
                fontSize: '14px',
                color: 'var(--text-main)',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </form>
        </div>

        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: '12px', justifyContent: 'flex-end',
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text-main)', fontSize: '14px',
              fontWeight: '500', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="reviewForm"
            disabled={loading}
            style={{
              padding: '10px 24px', borderRadius: '8px', border: 'none',
              background: 'var(--gold)', color: '#000', fontSize: '14px',
              fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Rajdhani', sans-serif", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Submitting...</> : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  ), document.body);
}
