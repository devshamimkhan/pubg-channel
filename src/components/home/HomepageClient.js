'use client';

import Link from 'next/link';
import SafeHtml from '@/components/ui/SafeHtml';

function SocialButton({ href, title, iconClass, color }) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="home-social-icon"
      title={title}
      style={{ color }}
    >
      <i className={iconClass} />
    </a>
  );
}

function SiteLogo({ logo, siteName }) {
  if (logo) {
    return <img src={logo} alt={siteName} className="h-full w-full object-cover" />;
  }

  return <span className="text-[16px] font-bold leading-none text-[var(--gold)]">{(siteName || 'P').charAt(0)}</span>;
}

function getLinkHref(url) {
  return String(url || '').trim();
}

function isExternalHref(href) {
  return /^https?:\/\//i.test(href) || href.startsWith('//');
}

function getLinkIcon(type) {
  if (type === 'grid') return '🎮';
  if (type === 'row') return '🔗';
  return '⚡';
}

function LinkCard({ link }) {
  const href = getLinkHref(link?.url);
  if (!href) return null;

  const content = (
    <>
      <div className={`card-img ${link?.image ? '' : 'placeholder'}`}>
        {link?.image ? (
          <img src={link.image} alt={link?.title || 'Link post'} className="card-img" />
        ) : (
          <span aria-hidden="true" style={{ fontSize: link?.type === 'grid' ? '40px' : '48px' }}>
            {getLinkIcon(link?.type)}
          </span>
        )}
      </div>
      <div className="card-footer">
        <span className="card-title">{link?.title || 'Untitled link'}</span>
        <i className="fas fa-ellipsis-vertical card-more"></i>
      </div>
    </>
  );

  const className = `home-link-card${link?.type === 'grid' ? ' grid-card' : ''}`;
  const commonProps = {
    className,
    'data-link-type': link?.type || 'card',
  };

  if (isExternalHref(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" {...commonProps}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} {...commonProps}>
      {content}
    </Link>
  );
}

function FeaturedChannelRow({ channel }) {
  if (!channel) return null;

  const href = channel?.slug ? `/channels/${channel.slug}` : '/channels';

  return (
    <Link href={href} className="home-link-row">
      <div className="row-icon">
        {channel?.avatar ? <img src={channel.avatar} alt={channel?.name || 'Channel'} /> : <i className="fas fa-globe" />}
      </div>
      <div className="row-body">
        <div className="row-title">{channel?.name || 'Untitled channel'}</div>
        <div className="row-sub">
          <span className="live-dot"></span>
          {channel?.description || 'Featured channel'}
        </div>
      </div>
      <i className="fas fa-ellipsis-vertical row-more"></i>
    </Link>
  );
}

export default function HomepageClient({ settings }) {
  const siteName = settings?.siteName || 'PUBG UC Store BD';
  const logo = settings?.logo || '';
  const siteDescription = settings?.siteDescription || '';
  const socialLinks = settings?.socialLinks || {};
  const homepageBio = settings?.homepageContent?.bio || '';

  const homepageLinks = Array.isArray(settings?.homepageContent?.links)
    ? settings.homepageContent.links.filter((link) => link?.title || link?.url || link?.image)
    : [];

  const featuredChannels = Array.isArray(settings?.featuredChannels)
    ? settings.featuredChannels.filter((channel) => channel && typeof channel === 'object')
    : [];

  const hasHomepageLinks = homepageLinks.length > 0;
  const hasFeaturedChannels = featuredChannels.length > 0;
  const homepageDescription = siteDescription || homepageBio;

  const handleShare = async () => {
    try {
      const pageUrl = window.location.href;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(pageUrl);
      }
    } catch (error) {
      console.error('Copy link failed:', error);
    }
  };

  return (
    <div className="home-wrapper">
      <div className="home-card">
        {/* Top Nav */}
        <div className="top-nav">
          <div className="logo" title={siteName}>
            <SiteLogo logo={logo} siteName={siteName} />
          </div>
          <button className="share-btn" title="Share" onClick={handleShare}>
            <i className="fas fa-share-nodes"></i>
          </button>
        </div>

        {/* Profile */}
        <div className="profile">
          <div className="avatar-wrap">
            <div className="avatar-ring"></div>
            <div className="avatar-img">
              <SiteLogo logo={logo} siteName={siteName} />
            </div>
          </div>

          <div className="username">
            {siteName}
            <i className="fas fa-circle-check verified"></i>
          </div>

          {homepageDescription ? (
            <div className="bio">
              <SafeHtml html={homepageDescription} />
            </div>
          ) : null}

          <div className="socials">
            <SocialButton href={socialLinks.whatsapp} title="WhatsApp" iconClass="fab fa-whatsapp" color="#25D366" />
            <SocialButton href={socialLinks.youtube} title="YouTube" iconClass="fab fa-youtube" color="#FF0000" />
            <SocialButton href={socialLinks.facebook} title="Facebook" iconClass="fab fa-facebook-f" color="#1877F2" />
            <SocialButton href={socialLinks.telegram} title="Telegram" iconClass="fab fa-telegram-plane" color="#2AABEE" />
          </div>
        </div>

        {/* Tabs */}
        {hasHomepageLinks || hasFeaturedChannels ? (
          <div className="home-tabs">
            <button className="home-tab-btn active">Links</button>
          </div>
        ) : null}

        {/* Link Posts */}
        {hasHomepageLinks ? (
          <div className="links-section animate-[slideUp_.3s_ease]">
            <div className="links-grid">
              {homepageLinks.map((link, index) => (
                <div
                  key={`${link?.title || 'link'}-${index}`}
                  style={{
                    gridColumn: link?.type === 'grid' ? 'auto' : '1 / -1',
                  }}
                >
                  <LinkCard link={link} />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Featured Channels */}
        {hasFeaturedChannels ? (
          <>
            <div className="home-section-divider">Featured Channels</div>
            <div className="links-section animate-[slideUp_.3s_ease]">
              {featuredChannels.map((channel, index) => (
                <FeaturedChannelRow key={channel?._id || channel?.slug || index} channel={channel} />
              ))}
            </div>
          </>
        ) : null}

        {/* Empty state */}
        {!hasHomepageLinks && !hasFeaturedChannels ? null : null}

        {/* Join CTA */}
        <Link href="/register" className="home-join-btn">
          🛒 Order UC from <span>{siteName}</span>
        </Link>

        {/* Footer */}
        <footer className="home-footer">
          <Link href="#">Privacy</Link>
          <Link href="#">Report</Link>
          <Link href="/admin/settings">Settings</Link>
        </footer>
      </div>
    </div>
  );
}
