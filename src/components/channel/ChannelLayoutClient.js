'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ChannelSidebar from './ChannelSidebar';
import ChannelInfoPanel from './ChannelInfoPanel';
import { getChannelsLiveSnapshot, markChannelSeen, toggleFollowChannel } from '@/actions/channels';

export default function ChannelLayoutClient({ channels, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [panelState, setPanelState] = useState('closed');
  const [channelsState, setChannelsState] = useState(channels);
  const [followPending, setFollowPending] = useState(false);

  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const router = useRouter();
  const pathname = usePathname();
  const slug = pathname?.split('/').pop();
  const isChannelListPage = pathname === '/channels';

  const activeChannel = useMemo(
    () => {
      if (isChannelListPage) return null;
      return channelsState.find(c => c.slug === slug) || channelsState[0];
    },
    [channelsState, slug, isChannelListPage]
  );

  const currentUserId = session?.user?.id;
  const panelOpen = panelState === 'open';
  const panelVisible = panelState !== 'closed';
  const panelCloseTimerRef = useRef(null);
  const isFollowing = useMemo(() => {
    if (!activeChannel || !currentUserId) return false;
    if (typeof activeChannel.isFollowing === 'boolean') return activeChannel.isFollowing;
    const followers = activeChannel.followers || [];
    return followers.some((id) => id?.toString?.() === currentUserId || id === currentUserId);
  }, [activeChannel, currentUserId]);

  useEffect(() => {
    setChannelsState(channels);
  }, [channels]);

  const handleChannelCreated = (channel) => {
    if (!channel?._id) return;

    setChannelsState((prev) => {
      const nextChannel = {
        ...channel,
        followersCount: Number(channel.followersCount ?? 0),
        onlineCount: Number(channel.onlineCount ?? 0),
        latestPostPreview: channel.latestPostPreview || '',
        latestPostAt: channel.latestPostAt || null,
        unseenCount: Number(channel.unseenCount ?? 0),
      };

      return [nextChannel, ...prev.filter((item) => item._id !== nextChannel._id)];
    });
  };

  useEffect(() => {
    let active = true;
    let timerId;
    let eventSource;

    const refreshLiveCounts = async () => {
      const snapshot = await getChannelsLiveSnapshot(currentUserId);
      if (!active || !snapshot?.success) return;
      const byId = new Map(snapshot.channels.map((c) => [c._id, c]));
      setChannelsState((prev) =>
        prev.map((channel) => {
          const live = byId.get(channel._id);
          return live
            ? {
                ...channel,
                followersCount: live.followersCount,
                isFollowing: live.isFollowing,
                latestPostPreview: live.latestPostPreview,
                latestPostAt: live.latestPostAt,
                unseenCount: live.unseenCount,
              }
            : channel;
        })
      );
    };

    refreshLiveCounts();

    if (currentUserId) {
      eventSource = new EventSource(`/api/channels/live?userId=${encodeURIComponent(currentUserId)}`);
      eventSource.addEventListener('channels', (event) => {
        try {
          const snapshot = JSON.parse(event.data);
          if (!active || !snapshot?.success) return;
          const byId = new Map(snapshot.channels.map((c) => [c._id, c]));
          setChannelsState((prev) =>
            prev.map((channel) => {
              const live = byId.get(channel._id);
              return live
                ? {
                    ...channel,
                    followersCount: live.followersCount,
                    isFollowing: live.isFollowing,
                    latestPostPreview: live.latestPostPreview,
                    latestPostAt: live.latestPostAt,
                    unseenCount: live.unseenCount,
                  }
                : channel;
            })
          );
        } catch {
          // noop
        }
      });

      eventSource.onerror = () => {
        if (!timerId) timerId = setInterval(refreshLiveCounts, 8000);
      };
    } else {
      timerId = setInterval(refreshLiveCounts, 8000);
    }

    return () => {
      active = false;
      clearInterval(timerId);
      if (eventSource) eventSource.close();
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId || !activeChannel?._id) return;
    markChannelSeen(activeChannel._id, currentUserId);
  }, [activeChannel?._id, currentUserId]);

  const handleFollowToggle = async () => {
    if (!activeChannel?._id || !currentUserId || followPending) return;
    setFollowPending(true);
    const result = await toggleFollowChannel(activeChannel._id, currentUserId);
    setFollowPending(false);
    if (!result?.success) return;

    setChannelsState((prev) =>
      prev.map((channel) =>
        channel._id === activeChannel._id
          ? {
              ...channel,
              followersCount: result.followersCount,
              isFollowing: result.isFollowing,
            }
          : channel
      )
    );
  };

  const openPanel = () => {
    if (panelCloseTimerRef.current) {
      clearTimeout(panelCloseTimerRef.current);
      panelCloseTimerRef.current = null;
    }
    setPanelState('open');
  };

  const closePanel = () => {
    if (panelCloseTimerRef.current) return;
    setPanelState('closing');
    panelCloseTimerRef.current = setTimeout(() => {
      setPanelState('closed');
      panelCloseTimerRef.current = null;
    }, 300);
  };

  useEffect(() => () => {
    if (panelCloseTimerRef.current) {
      clearTimeout(panelCloseTimerRef.current);
    }
  }, []);


  return (
    <>
      <style>{`
        /* Desktop: hide mobile-only controls */
        @media (min-width: 901px) {
          #hamburger-btn { display: none !important; }
        }

        /* Mobile: sidebar as overlay and header stays inline */
        @media (max-width: 900px) {
          #sidebar {
            position: fixed !important;
            top: 0; left: 0;
            width: 100vw !important;
            min-width: unset !important;
            height: 100vh;
            z-index: 1000;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
          }
          #sidebar.open { transform: translateX(0); }
          #hamburger-btn { display: flex !important; }
          #channel-header {
            flex-wrap: nowrap;
            padding: 10px 12px;
            gap: 8px;
            align-items: center;
          }
          #channel-header > .avatar {
            width: 34px !important;
            height: 34px !important;
            font-size: 14px !important;
          }
          .channel-header-main {
            min-width: 0;
            flex: 1 1 auto;
          }
          .channel-header-main > div:first-child {
            font-size: 15px !important;
            line-height: 1.1;
          }
          .channel-header-main > div:last-child {
            width: 100%;
            gap: 6px;
            align-items: center;
          }
          .channel-header-main > div:last-child > div:first-child {
            min-width: 0;
          }
          .channel-header-actions {
            width: auto;
            margin-left: auto;
            gap: 4px;
            align-items: center;
            justify-content: flex-end;
            flex-wrap: nowrap;
            flex-shrink: 0;
          }
          .channel-header-actions > * {
            flex-shrink: 0;
          }
          #right-panel {
            position: fixed !important;
            top: 0;
            right: 0;
            width: 100vw !important;
            max-width: 100vw !important;
            height: 100vh !important;
            z-index: 1100;
            background: var(--bg-sidebar);
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
            pointer-events: none;
          }
          #right-panel.open {
            transform: translateX(0);
            pointer-events: auto;
          }
          #right-panel > * {
            width: 100% !important;
            max-width: 100% !important;
          }
        }

        .backdrop-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 999;
        }
        .backdrop-overlay.show { display: block; }
        @media (min-width: 901px) {
          .backdrop-overlay.show { display: none !important; }
        }
      `}</style>

      <div className="flex h-screen w-full bg-[var(--bg-deepest)] overflow-hidden">
        {/* Backdrop – mobile sidebar ONLY */}
        <div
          className={`backdrop-overlay ${(sidebarOpen || panelVisible || isChannelListPage) ? 'show' : ''}`}
          onClick={() => {
            setSidebarOpen(false);
            closePanel();
          }}
        />

        {/* ── LEFT SIDEBAR ── */}
        <div
          id="sidebar"
          style={{
            width: '320px',
            minWidth: '320px',
            background: 'var(--bg-sidebar)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden',
            flexShrink: 0,
          }}
          className={(sidebarOpen || isChannelListPage) ? 'open' : ''}
        >
            <ChannelSidebar
              channels={channelsState}
              onClose={() => setSidebarOpen(false)}
              onChannelCreated={handleChannelCreated}
            />
        </div>

        {/* ── CENTER MAIN ── */}
        <main
          id="main"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            minHeight: 0,
            overflow: 'hidden',
            background: 'var(--bg-dark)',
          }}
        >
          {/* CHANNEL HEADER */}
          {activeChannel && (
            <div
              id="channel-header"
              style={{
                background: 'var(--bg-sidebar)',
                borderBottom: '1px solid var(--border)',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                flexShrink: 0,
                flexWrap: 'wrap',
              }}
            >
              {/* Back arrow – mobile only */}
              <button
                id="hamburger-btn"
                title="Back"
                onClick={() => router.push('/channels')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '22px',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  flexShrink: 0,
                  alignItems: 'center',
                }}
              >
                <i className="fas fa-arrow-left"></i>
              </button>

              {/* Avatar */}
              <div
                className="avatar"
                style={{ width: '40px', height: '40px', fontSize: '16px', flexShrink: 0, background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))' }}
              >
                {activeChannel.avatar ? (
                  <img src={activeChannel.avatar} alt="" />
                ) : (
                  <span>{activeChannel.name.charAt(0)}</span>
                )}
              </div>

              {/* Name + followers + follow */}
              <div className="channel-header-main" style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="font-raj"
                  style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minWidth: 0,
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeChannel.name}
                  </span>
                  {activeChannel.isVerified && (
                    <i className="fas fa-check-circle" style={{ color: 'var(--gold)', fontSize: '13px', flexShrink: 0 }}></i>
                  )}
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '3px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span className="gold-text font-raj" style={{ fontSize: '14px', fontWeight: '700' }}>
                      {activeChannel.followersCount > 1000
                        ? (activeChannel.followersCount / 1000).toFixed(1) + 'K'
                        : activeChannel.followersCount}
                    </span>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Followers</span>
                  </div>

                  {!isAdmin && (
                    <button
                      onClick={handleFollowToggle}
                      className={`action-btn ${isFollowing ? 'btn-outline' : 'btn-gold'}`}
                      style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        opacity: followPending ? 0.7 : 1,
                        flexShrink: 0,
                      }}
                      disabled={followPending}
                    >
                      <i className={followPending ? 'fas fa-spinner fa-spin' : isFollowing ? 'fas fa-check' : 'fas fa-user-plus'}></i>
                      {followPending ? ' Updating...' : isFollowing ? ' Following' : ' Follow'}
                    </button>
                  )}
                </div>
              </div>

              {/* Right actions */}
              <div className="channel-header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto', flexShrink: 0 }}>
                {/* Ellipsis → open right panel */}
                <button
                  id="toggle-settings-btn"
                  onClick={() => (panelOpen ? closePanel() : openPanel())}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: panelOpen ? 'var(--gold)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '4px',
                    transition: 'color .2s',
                    flexShrink: 0,
                  }}
                  title="More"
                >
                  <i className="fas fa-ellipsis-v"></i>
                </button>
              </div>
            </div>
          )}

          {/* Feed content */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {children}
          </div>
        </main>

        {/* ── RIGHT PANEL ── */}
        <aside
          id="right-panel"
          style={{
            width: panelVisible ? '360px' : '0',
            background: 'var(--bg-sidebar)',
            borderLeftWidth: '1px',
            borderLeftStyle: 'solid',
            borderLeftColor: panelOpen ? 'var(--border)' : 'transparent',
            height: '100vh',
            overflowX: 'hidden',
            overflowY: 'hidden',
            transition: 'width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), border-left-color 0.3s',
            flexShrink: 0,
          }}
          className={`${panelState === 'open' ? 'open' : panelVisible ? 'closing' : ''}`.trim()}
        >
          <ChannelInfoPanel
            activeChannel={activeChannel}
            onClose={closePanel}
            isOpen={panelOpen}
          />
        </aside>
      </div>
    </>
  );
}
