'use client';

import SafeHtml from '@/components/ui/SafeHtml';

export default function TextPost({ post }) {
  const date = new Date(post.createdAt);
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Glowing gradient border layer */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '18px',
        padding: '1px',
        background: 'linear-gradient(135deg, rgba(250,186,37,0.35) 0%, rgba(91,155,213,0.18) 50%, rgba(250,186,37,0.08) 100%)',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Card body */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        background: 'linear-gradient(145deg, rgba(28,28,34,0.92) 0%, rgba(20,20,26,0.96) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '18px',
        border: '1px solid rgba(250,186,37,0.12)',
        padding: '18px 46px 38px 20px',  // extra right padding for the actions button
        boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
        overflow: 'hidden',
      }}>

        {/* Subtle ambient glow orb */}
        <div style={{
          position: 'absolute', top: '-30px', left: '-20px',
          width: '120px', height: '120px',
          background: 'radial-gradient(circle, rgba(250,186,37,0.06) 0%, transparent 70%)',
          pointerEvents: 'none', borderRadius: '50%',
        }} />

        {/* Rich HTML content — sanitized on server (sanitize-html) + client (DOMPurify) */}
        <SafeHtml
          html={post.content}
          style={{
            color: '#E8E8EE',
            fontSize: '14.5px',
            lineHeight: '1.7',
            fontFamily: "'Segoe UI', 'Inter', Helvetica, Arial, sans-serif",
            fontWeight: '400',
            letterSpacing: '0.01em',
          }}
          className="rich-html-content"
        />

        {/* Timestamp + gold ticks */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: 'rgba(240,240,240,0.35)',
          fontSize: '11px',
          fontFamily: "'Segoe UI', sans-serif",
          letterSpacing: '0.02em',
        }}>
          <span>{timeStr}</span>
          <svg viewBox="0 0 16 15" width="15" height="15">
            <path fill="rgba(250,186,37,0.55)"
              d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
