'use client';
import { useState, useRef, useEffect, useTransition } from 'react';
import EmojiPicker, { Emoji, EmojiStyle } from 'emoji-picker-react';
import { toggleReaction } from '@/actions/reactions';

// Convert any emoji char → unified hex string (e.g. "❤️" → "2764-fe0f")
function emojiToUnified(emoji) {
  return [...emoji]
    .map(c => c.codePointAt(0).toString(16).toLowerCase())
    .join('-');
}

// Quick reactions with pre-computed unified codes for reliability
const QUICK_EMOJIS = [
  { emoji: '👍', unified: '1f44d' },
  { emoji: '❤️', unified: '2764-fe0f' },
  { emoji: '😂', unified: '1f602' },
  { emoji: '😮', unified: '1f62e' },
  { emoji: '😢', unified: '1f622' },
  { emoji: '🙏', unified: '1f64f' },
];

export default function ReactionBar({ postId, reactions: initialReactions, currentUserId }) {
  const [reactions, setReactions] = useState(initialReactions || []);
  const [showQuickPicker, setShowQuickPicker] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pickerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowQuickPicker(false);
        setShowFullPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasReacted = (emoji) => {
    if (!currentUserId) return false;
    return reactions.find(r => r.emoji === emoji)?.users?.includes(currentUserId);
  };

  const handleToggleReaction = (emoji) => {
    if (!currentUserId) return;

    // Optimistic update
    setReactions(prev => {
      let next = [...prev];

      // 1. Remove user from any OTHER reaction
      next = next.map(r => {
        if (r.emoji !== emoji && r.users.includes(currentUserId)) {
          const newUsers = r.users.filter(id => id !== currentUserId);
          return { ...r, users: newUsers, count: newUsers.length };
        }
        return r;
      });

      // 2. Toggle the requested emoji
      const rIdx = next.findIndex(r => r.emoji === emoji);
      if (rIdx !== -1) {
        const users = [...next[rIdx].users];
        const uIdx = users.indexOf(currentUserId);
        if (uIdx !== -1) {
          users.splice(uIdx, 1);
          next[rIdx] = { ...next[rIdx], users, count: users.length };
        } else {
          users.push(currentUserId);
          next[rIdx] = { ...next[rIdx], users, count: users.length };
        }
      } else {
        next.push({ emoji, users: [currentUserId], count: 1 });
      }

      // Cleanup any remaining empty reactions
      return next.filter(r => r.count > 0);
    });

    setShowQuickPicker(false);
    setShowFullPicker(false);

    startTransition(async () => {
      const res = await toggleReaction(postId, emoji, currentUserId);
      if (res.success && res.reactions) setReactions(res.reactions);
    });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', position: 'relative' }}>

      {/* ── Existing reaction badges ── */}
      {reactions.map((reaction, idx) => {
        const active = hasReacted(reaction.emoji);
        return (
          <button
            key={idx}
            onClick={() => handleToggleReaction(reaction.emoji)}
            disabled={isPending}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '3px 9px 3px 6px',
              borderRadius: '999px',
              border: active ? '1.5px solid var(--gold)' : '1.5px solid transparent',
              background: active ? 'rgba(212,175,55,0.12)' : 'var(--bg-card2)',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              fontSize: '13px', fontWeight: '600',
              color: active ? 'var(--gold)' : 'var(--text-sub)',
            }}
          >
            <Emoji unified={emojiToUnified(reaction.emoji)} emojiStyle={EmojiStyle.APPLE} size={20} />
            <span>{reaction.count}</span>
          </button>
        );
      })}

      {/* ── Smile trigger button ── */}
      <div ref={pickerRef} style={{ position: 'relative' }}>
        <button
          onClick={() => {
            if (showFullPicker) { setShowFullPicker(false); }
            else { setShowQuickPicker(v => !v); }
          }}
          disabled={!currentUserId}
          title={currentUserId ? 'React' : 'Log in to react'}
          style={{
            width: '30px', height: '30px', borderRadius: '50%',
            border: '1.5px solid transparent',
            background: (showQuickPicker || showFullPicker) ? 'var(--bg-card2)' : 'transparent',
            color: (showQuickPicker || showFullPicker) ? 'var(--gold)' : 'var(--text-muted)',
            cursor: currentUserId ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', transition: 'all 0.18s ease',
          }}
        >
          <i className="far fa-face-smile"></i>
        </button>

        {/* ── Quick-pick pill ── */}
        {showQuickPicker && (
          <div style={{
            position: 'absolute', bottom: 'calc(100% + 8px)', left: 0,
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--bg-sidebar)',
            border: '1px solid var(--border)',
            borderRadius: '999px',
            padding: '8px 12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.65)',
            animation: 'slideUp 0.18s ease',
            zIndex: 60, whiteSpace: 'nowrap',
          }}>
            {QUICK_EMOJIS.map(q => (
              <button
                key={q.emoji}
                onClick={() => handleToggleReaction(q.emoji)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '2px', borderRadius: '50%',
                  transition: 'transform 0.18s ease',
                  lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.35) translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; }}
              >
                <Emoji unified={q.unified} emojiStyle={EmojiStyle.APPLE} size={30} />
              </button>
            ))}

            {/* Divider */}
            <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 2px' }} />

            {/* + More button */}
            <button
              onClick={() => { setShowQuickPicker(false); setShowFullPicker(true); }}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--bg-card2)',
                border: '1.5px solid var(--border)',
                color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.color = '#000'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card2)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <i className="fas fa-plus"></i>
            </button>
          </div>
        )}

        {/* ── Full emoji picker ── */}
        {showFullPicker && (
          <div style={{
            position: 'absolute', bottom: 'calc(100% + 8px)', left: 0,
            zIndex: 60, animation: 'slideUp 0.18s ease',
          }}>
            <EmojiPicker
              onEmojiClick={obj => handleToggleReaction(obj.emoji)}
              theme="dark"
              emojiStyle="apple"
              searchDisabled={false}
              skinTonesDisabled
              width={320}
              height={380}
              style={{
                '--epr-bg-color': 'var(--bg-sidebar)',
                '--epr-picker-border-color': 'var(--border)',
                '--epr-hover-bg-color': 'var(--bg-card2)',
                '--epr-text-color': 'var(--text-main)',
                '--epr-search-border-color': 'var(--border)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.65)',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
