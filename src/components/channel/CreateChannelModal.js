'use client';

import { useState } from 'react';
import { createChannel } from '@/actions/channels';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function CreateChannelModal({ onClose }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    avatar: '',
    coverImage: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Channel name is required');
      return;
    }
    setLoading(true);
    setError('');

    const result = await createChannel({
      ...form,
      createdBy: session?.user?.id,
    });

    if (result.success) {
      router.refresh();
      onClose();
    } else {
      setError(result.message || 'Failed to create channel');
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'relative', zIndex: 1,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        width: '100%', maxWidth: '440px',
        padding: '0',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        animation: 'slideUp .3s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-sidebar)',
        }}>
          <h2 className="font-raj" style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
            <i className="fas fa-plus-circle" style={{ color: 'var(--gold)', marginRight: '8px' }}></i>
            Create New Channel
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: '18px', padding: '4px',
            transition: 'color .2s',
          }}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div style={{
              background: 'rgba(255,68,68,.1)', border: '1px solid rgba(255,68,68,.3)',
              borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
              fontSize: '13px', color: 'var(--accent-red)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          {/* Channel Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Channel Name *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., PUBG UC Store"
              className="form-input"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Tell people what this channel is about..."
              className="form-input"
              rows={3}
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>

          {/* Preview */}
          {form.name && (
            <div style={{
              background: 'var(--bg-card2)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '12px', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '16px', background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))' }}>
                {form.avatar ? (
                  <img src={form.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  form.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="font-raj" style={{ fontSize: '14px', fontWeight: '700' }}>{form.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>0 followers · Preview</div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              style={{ flex: 1, justifyContent: 'center', padding: '10px 16px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-gold"
              disabled={loading}
              style={{ flex: 1, justifyContent: 'center', padding: '10px 16px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin"></i> Creating...</>
              ) : (
                <><i className="fas fa-plus"></i> Create Channel</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
