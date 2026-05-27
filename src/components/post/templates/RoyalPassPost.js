'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RoyalPassPost({ post }) {
  const CURRENCY_SYMBOL = '\u09F3';
  const tiers = post.templateData?.tiers || [
    { name: 'RP', label: 'Royal Pass', price: '80', type: 'base' },
    { name: 'ELITE', label: 'Elite Pass', price: '480', type: 'elite' },
    { name: 'ELITE+', label: 'Elite Plus', price: '960', type: 'plus' },
  ];
  const seasonName = post.templateData?.seasonName || '';
  const ctaText = post.templateData?.ctaButtonText || 'Get Royal Pass Now';
  const whatsappLinkRaw = post.templateData?.whatsappLink || '';

  const defaultSelectedIndex = Math.max(0, tiers.findIndex((t) => t.type === 'elite'));
  const [selectedTierIndex, setSelectedTierIndex] = useState(defaultSelectedIndex);
  const selectedTier = tiers[selectedTierIndex] || tiers[0];
  const channelName = (post.channelName || 'PUBG UC STORE').toUpperCase();

  const buildWhatsappMessage = () => {
    if (!selectedTier) return '';
    return `Hi, I want to purchase this package:\n\nPackage Name: ${selectedTier.name}\nPrice: ${CURRENCY_SYMBOL}${selectedTier.price}\nPackage Type: Royal Pass\nIncluded Features/Benefits: ${selectedTier.label}\n\nChannel: ${channelName}\n\nPlease confirm availability and payment details.`;
  };

  const buildWhatsappHref = () => {
    const message = encodeURIComponent(buildWhatsappMessage());
    if (!whatsappLinkRaw) return `https://wa.me/?text=${message}`;

    if (whatsappLinkRaw.startsWith('http')) {
      try {
        const url = new URL(whatsappLinkRaw);
        url.searchParams.set('text', buildWhatsappMessage());
        return url.toString();
      } catch {
        return `https://wa.me/?text=${message}`;
      }
    }

    const cleanNumber = whatsappLinkRaw.replace(/[^\d+]/g, '');
    return cleanNumber
      ? `https://wa.me/${cleanNumber}?text=${message}`
      : `https://wa.me/?text=${message}`;
  };

  const tierBadges = [
    { label: 'RP', bg: '#4A4A58', color: '#fff' },
    { label: 'ELITE', bg: '#9C27B0', color: '#fff' },
    { label: 'ELITE PLUS', bg: 'var(--gold)', color: '#000' },
  ];

  const getTierStyle = (type) => {
    switch (type) {
      case 'elite':
        return {
          background: 'rgba(156,39,176,0.08)',
          nameColor: '#CE93D8',
        };
      case 'plus':
        return {
          background: 'rgba(250,186,37,0.08)',
          nameColor: 'var(--gold)',
        };
      default:
        return {
          border: '1px solid var(--border)',
          background: 'var(--bg-card2)',
          nameColor: 'var(--text-muted)',
        };
    }
  };

  return (
    <>
      {/* Royal Pass Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0a0a2e 0%, #1a1a4e 40%, #12123a 100%)',
        margin: '-18px -18px 0',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '18px 18px 0 0',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute',
          top: '-20px', right: '-10px',
          width: '120px', height: '120px',
          background: 'radial-gradient(circle, rgba(156,39,176,0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Crown Icon */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: 'rgba(250,186,37,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <i className="fas fa-crown" style={{ fontSize: '24px', color: 'var(--gold)' }}></i>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: '700',
            fontSize: '18px',
            color: '#fff',
            marginBottom: '2px',
          }}>
            Royal Pass {seasonName}
          </div>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: '8px',
          }}>Current Season – Available Now</div>

          {/* Tier Badges */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {tierBadges.map((badge, i) => (
              <span key={i} style={{
                background: badge.bg,
                color: badge.color,
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '9px',
                fontWeight: '700',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>{badge.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ padding: '18px 0 0' }}>
        <div className="post-tag tag-new" style={{ marginBottom: '8px' }}>
          <i className="fas fa-star" style={{ fontSize: '9px' }}></i> NEW SEASON
        </div>

        <h3 style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: '18px',
          fontWeight: '700',
          lineHeight: 1.2,
          marginBottom: '6px',
          color: 'var(--text-main)',
        }}>
          <i className="fas fa-crown" style={{ color: 'var(--gold)', marginRight: '8px', fontSize: '15px' }}></i>
          {post.title}
        </h3>

        <p style={{
          fontSize: '13px',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          marginBottom: '14px',
        }}>{post.content}</p>

        {/* Tier Pricing Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginBottom: '14px',
        }}>
          {tiers.map((tier, i) => {
            const style = getTierStyle(tier.type);
            const isSelected = selectedTierIndex === i;
            return (
              <div
                key={i}
                onClick={() => setSelectedTierIndex(i)}
                style={{
                  border: isSelected ? '1px solid var(--gold)' : style.border,
                  background: isSelected ? 'rgba(250,186,37,0.08)' : style.background,
                  borderRadius: '12px',
                  padding: '14px 8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 0 0 1px rgba(250,186,37,.3), 0 6px 18px rgba(250,186,37,.15)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: style.nameColor,
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>{tier.name}</div>
                <div style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '18px',
                  fontWeight: '700',
                  color: isSelected ? 'var(--gold)' : 'var(--text-main)',
                }}>{CURRENCY_SYMBOL}{tier.price}</div>
                <div style={{
                  fontSize: '10px',
                  color: 'var(--text-sub)',
                  marginTop: '4px',
                }}>{tier.label}</div>
              </div>
            );
          })}
        </div>

        {/* CTA Button */}
        <Link
          href={buildWhatsappHref()}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(135deg, var(--gold-light), var(--gold), var(--gold-dim))',
            color: '#000',
            fontSize: '14px',
            fontWeight: '700',
            fontFamily: "'Rajdhani', sans-serif",
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            letterSpacing: '0.03em',
            boxShadow: '0 4px 16px rgba(250,186,37,0.25)',
            transition: 'all 0.2s',
            textDecoration: 'none'
          }}>
          <i className="fab fa-whatsapp" style={{ fontSize: '15px' }}></i>
          {ctaText}
        </Link>
      </div>
    </>
  );
}

