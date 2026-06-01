'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import CreateChannelModal from './CreateChannelModal';

export default function ChannelSidebar({ channels, onClose, onChannelCreated }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const pinnedChannels = channels.filter(c => c.isPinned);
  const otherChannels = channels.filter(c => !c.isPinned);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const userName = session?.user?.name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();
  const isAdmin = session?.user?.role === 'admin';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── TOP HEADER ── */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', width: '100%', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, background: 'var(--bg-sidebar)' }}>
        <span className="font-raj" style={{ fontSize: '16px', fontWeight: '700', flex: 1 }}>Channels</span>
        {isAdmin && (
          <button 
            className="btn-outline action-btn" 
            style={{ padding: '6px 10px', fontSize: '11px' }}
            onClick={() => setShowCreateModal(true)}
          >
            <i className="fas fa-plus"></i> New
          </button>
        )}
      </div>

      {/* ── CHANNEL LIST ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--bg-sidebar)' }}>
        {/* Pinned */}
        {pinnedChannels.length > 0 && (
          <>
            <div style={{ padding: '6px 16px 4px', fontSize: '10px', color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <i className="fas fa-thumbtack" style={{ fontSize: '9px' }}></i> Pinned
            </div>
            {pinnedChannels.map(channel => (
              <ChannelItem key={channel._id} channel={channel} isActive={pathname === `/channels/${channel.slug}`} onClose={onClose} />
            ))}
          </>
        )}

        {/* Followed */}
        {otherChannels.length > 0 && (
          <>
            <div style={{ padding: '6px 16px 4px', fontSize: '10px', color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <i className="fas fa-hashtag" style={{ fontSize: '9px' }}></i> Channels you follow
            </div>
            {otherChannels.map(channel => (
              <ChannelItem key={channel._id} channel={channel} isActive={pathname === `/channels/${channel.slug}`} onClose={onClose} />
            ))}
          </>
        )}

        {/* Discover More */}
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <button className="btn-outline action-btn" style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}>
            <i className="fas fa-compass"></i> Discover More Channels
          </button>
        </div>
      </div>

      {/* ── USER PROFILE + LOGOUT (FIXED BOTTOM) ── */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'var(--bg-card)',
        flexShrink: 0,
      }}>
        {/* Avatar */}
        <div style={{
          width: '38px', height: '38px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Rajdhani, sans-serif', fontWeight: '700', fontSize: '16px', color: '#000',
          flexShrink: 0,
        }}>
          {userInitial}
        </div>

        {/* Name & subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="font-raj" style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {userName}
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          title="Logout"
          style={{
            background: 'rgba(255,68,68,.1)', border: '1px solid rgba(255,68,68,.25)',
            color: 'var(--accent-red)', borderRadius: '8px', padding: '7px 10px',
            cursor: 'pointer', fontSize: '14px', flexShrink: 0,
            transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,68,68,.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,68,68,.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <i className="fas fa-sign-out-alt"></i>
        </button>
      </div>

      {/* Mobile close button CSS */}
      <style>{`
        @media (max-width: 900px) {
          .sidebar-close-btn-mobile { display: flex !important; }
        }
      `}</style>
      {showCreateModal && (
        <CreateChannelModal
          onClose={() => setShowCreateModal(false)}
          onCreated={onChannelCreated}
        />
      )}
    </div>
  );
}

function ChannelItem({ channel, isActive, onClose }) {
  const lastMsg = channel.latestPostPreview || 'No posts yet';
  const time = channel.latestPostAt
    ? new Date(channel.latestPostAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';
  const badge = channel.unseenCount || 0;

  // Avatar gradient colors per channel type
  const avatarGradients = {
    true: 'linear-gradient(135deg,#D4AF37,#8B6F1A)',   // pinned = gold
    false: 'linear-gradient(135deg,#1A3566,#5B9BD5)',  // followed = blue
  };

  return (
    <Link
      href={`/channels/${channel.slug}`}
      onClick={onClose}
      className={`channel-item no-underline text-[var(--text-main)] ${isActive ? 'active' : ''}`}
    >
      <div className="avatar" style={{ background: avatarGradients[String(channel.isPinned)] }}>
        {channel.avatar ? (
          <img src={channel.avatar} alt="" />
        ) : (
          <span>{channel.name.charAt(0)}</span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="font-raj" style={{ fontSize: '15px', fontWeight: '700' }}>
            {channel.name}
            {channel.isVerified && <i className="fas fa-check-circle" style={{ color: 'var(--gold)', fontSize: '11px', marginLeft: '4px' }}></i>}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-sub)' }}>{time}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
            {lastMsg}
          </span>
          {badge > 0 && <span className="badge badge-gold">{badge}</span>}
        </div>
      </div>
    </Link>
  );
}
