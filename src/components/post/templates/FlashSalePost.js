'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FlashSalePost({ post }) {
  const packs = post.templateData?.packs || [];
  const countdownHours = parseInt(post.templateData?.countdownHours) || 4;
  const ctaText = post.templateData?.ctaButtonText || 'Buy UC Now';
  const whatsappLinkRaw = post.templateData?.whatsappLink || '';
  const defaultSelectedIndex = Math.max(0, packs.findIndex((p) => p.isPopular));
  const [selectedPackIndex, setSelectedPackIndex] = useState(defaultSelectedIndex);
  const selectedPack = packs[selectedPackIndex] || packs[0];
  const channelName = (post.channelName || 'PUBG UC STORE').toUpperCase();

  const saleEndsAt = new Date(post.createdAt).getTime() + countdownHours * 3600 * 1000;
  const initialNow = new Date(post.renderedAt || post.createdAt).getTime();

  const buildWhatsappMessage = () => {
    if (!selectedPack) return '';
    return `Hi, I want to purchase this package:

Package Name: ${selectedPack.amount} UC
Price: ৳${selectedPack.price}
Package Type: Flash Sale
Included Features/Benefits: Limited-time flash sale pricing

Channel: ${channelName}

Please confirm availability and payment details.`;
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

  // Countdown timer
  const [now, setNow] = useState(initialNow);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const totalSeconds = Math.max(0, Math.floor((saleEndsAt - now) / 1000));

  const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const secs = String(totalSeconds % 60).padStart(2, '0');

  const timerBoxStyle = {
    background: 'var(--gold)',
    color: '#000',
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: '800',
    fontSize: '22px',
    width: '52px',
    height: '52px',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  };

  const timerLabelStyle = {
    fontSize: '8px',
    fontWeight: '600',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    opacity: 0.7,
    marginTop: '2px',
  };

  return (
    <>
      {/* Flash Sale Banner Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a0a00 0%, #2d1400 30%, #1a0800 100%)',
        margin: '-18px -18px 0',
        padding: '28px 24px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '18px 18px 0 0',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute',
          top: '-30px', right: '-20px',
          width: '150px', height: '150px',
          background: 'radial-gradient(circle, rgba(250,140,0,0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ fontSize: '28px', marginBottom: '4px' }}>⚡</div>
        <div style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: '800',
          fontSize: '26px',
          letterSpacing: '0.1em',
          color: '#fff',
          textTransform: 'uppercase',
        }}>FLASH SALE</div>
        <div style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.6)',
          marginBottom: '18px',
        }}>Today Only — Limited Time!</div>

        {/* Countdown Timer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}>
          <div style={timerBoxStyle}>
            <span>{hrs}</span>
            <span style={timerLabelStyle}>HRS</span>
          </div>
          <span style={{ color: 'var(--gold)', fontSize: '20px', fontWeight: '800' }}>:</span>
          <div style={timerBoxStyle}>
            <span>{mins}</span>
            <span style={timerLabelStyle}>MIN</span>
          </div>
          <span style={{ color: 'var(--gold)', fontSize: '20px', fontWeight: '800' }}>:</span>
          <div style={timerBoxStyle}>
            <span>{secs}</span>
            <span style={timerLabelStyle}>SEC</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ padding: '18px 0 0' }}>
        <div className="post-tag tag-offer" style={{ marginBottom: '8px' }}>
          <i className="fas fa-bolt" style={{ fontSize: '9px' }}></i> FLASH SALE
        </div>

        <h3 style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: '18px',
          fontWeight: '700',
          lineHeight: 1.2,
          marginBottom: '6px',
          color: 'var(--text-main)',
        }}>
          ⚡ {post.title}
        </h3>

        <p style={{
          fontSize: '13px',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          marginBottom: '14px',
        }}>{post.content}</p>

        {/* UC Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginBottom: '14px',
        }}>
          {packs.map((pack, i) => (
            <div
              key={i}
              onClick={() => setSelectedPackIndex(i)}
              style={{
                background: 'var(--bg-card2)',
                border: `1px solid ${selectedPackIndex === i ? 'var(--gold)' : (pack.isPopular ? 'var(--gold-dim)' : 'var(--border)')}`,
                borderRadius: '8px',
                padding: '10px 8px',
                textAlign: 'center',
                position: 'relative',
                transition: 'all 0.2s',
                cursor: 'pointer',
                boxShadow: selectedPackIndex === i ? '0 0 0 1px rgba(250,186,37,.3), 0 6px 18px rgba(250,186,37,.15)' : 'none',
              }}
            >
              {pack.isPopular && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--gold)',
                  color: '#000',
                  fontSize: '9px',
                  fontWeight: '700',
                  padding: '1px 8px',
                  borderRadius: '10px',
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.04em',
                }}>Popular</div>
              )}
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--gold)',
              }}>{pack.amount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>UC</div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', marginTop: '2px' }}>৳{pack.price}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-sub)', textDecoration: 'line-through' }}>৳{pack.oldPrice}</div>
            </div>
          ))}
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
          {ctaText} - Flash Price!
        </Link>
      </div>
    </>
  );
}
