'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { deletePost } from '@/actions/posts';
import EditPostModal from './EditPostModal';

export default function PostActions({ post }) {
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDelete = () => {
    startDelete(async () => {
      await deletePost(post._id);
      setShowDeleteConfirm(false);
    });
  };

  return (
    <>
      {/* ── Trigger button ── */}
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(p => !p)}
          title="Post options"
          style={{
            background: open ? 'rgba(255,255,255,0.08)' : 'transparent',
            border: 'none',
            color: 'rgba(240,240,240,0.5)',
            cursor: 'pointer',
            width: '28px', height: '28px',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
        >
          <i className="fas fa-ellipsis-v" />
        </button>

        {/* ── Dropdown menu ── */}
        {open && (
          <div style={{
            position: 'absolute', top: '34px', right: '0',
            background: 'linear-gradient(145deg,rgba(30,30,38,0.98),rgba(22,22,28,0.99))',
            border: '1px solid rgba(250,186,37,0.15)',
            borderRadius: '12px',
            padding: '6px',
            minWidth: '160px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            zIndex: 50,
            animation: 'slideUp 0.15s ease',
          }}>
            {/* Edit */}
            <button
              onClick={() => { setShowEditModal(true); setOpen(false); }}
              style={{
                width: '100%', background: 'none', border: 'none',
                color: '#E8E8EE', cursor: 'pointer',
                padding: '9px 14px', borderRadius: '8px',
                fontSize: '13px', fontWeight: '500',
                display: 'flex', alignItems: 'center', gap: '10px',
                transition: 'background 0.15s',
                textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <i className="fas fa-pen" style={{ color: 'var(--gold)', width: '14px' }} />
              Edit Post
            </button>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

            {/* Delete */}
            <button
              onClick={() => { setShowDeleteConfirm(true); setOpen(false); }}
              style={{
                width: '100%', background: 'none', border: 'none',
                color: '#ff6b6b', cursor: 'pointer',
                padding: '9px 14px', borderRadius: '8px',
                fontSize: '13px', fontWeight: '500',
                display: 'flex', alignItems: 'center', gap: '10px',
                transition: 'background 0.15s',
                textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,68,68,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <i className="fas fa-trash-alt" style={{ width: '14px' }} />
              Delete Post
            </button>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteConfirm && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => !isDeleting && setShowDeleteConfirm(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(145deg,rgba(28,28,34,0.98),rgba(20,20,26,0.99))',
              border: '1px solid rgba(255,68,68,0.25)',
              borderRadius: '20px', padding: '28px 28px 24px',
              maxWidth: '380px', width: '90%',
              boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
              animation: 'slideUp 0.2s ease',
            }}
          >
            {/* Icon */}
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'rgba(255,68,68,0.12)',
              border: '1px solid rgba(255,68,68,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', color: '#ff6b6b', margin: '0 auto 16px',
            }}>
              <i className="fas fa-trash-alt" />
            </div>

            <h3 style={{ textAlign: 'center', fontSize: '18px', fontWeight: '700', color: '#F0F0F0', marginBottom: '8px' }}>
              Delete Post?
            </h3>
            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
              This action cannot be undone. The post will be permanently removed from the channel.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                style={{
                  flex: 1, padding: '11px', borderRadius: '10px',
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--text-main)', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '600', transition: 'all 0.2s',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  flex: 1, padding: '11px', borderRadius: '10px',
                  background: 'linear-gradient(135deg,#ff4444,#cc0000)',
                  border: 'none', color: '#fff', cursor: isDeleting ? 'wait' : 'pointer',
                  fontSize: '14px', fontWeight: '700', transition: 'all 0.2s',
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? <><i className="fas fa-spinner fa-spin" /> Deleting…</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Edit Modal ── */}
      {showEditModal && (
        <EditPostModal
          post={post}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}
