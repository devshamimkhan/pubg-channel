'use client';

import { useState, useRef, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { updatePost } from '@/actions/posts';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Dynamically import ReactQuill to prevent SSR window errors
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function EditPostModal({ post, onClose }) {
  const postType = post.type;
  const postId = post._id;

  const [title, setTitle] = useState(post.title || '');
  const [content, setContent] = useState(post.content || post.desc || '');
  const [viewMode, setViewMode] = useState('rich'); // 'rich' or 'code'
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  // Announcement specific
  const [steps, setSteps] = useState(post.templateData?.steps || [
    { title: '', description: '' },
    { title: '', description: '' },
  ]);
  const [ctaButtonText, setCtaButtonText] = useState(post.templateData?.ctaButtonText || '');
  const [whatsappLink, setWhatsappLink] = useState(post.templateData?.whatsappLink || '');

  // UC Flash Sale specific
  const defaultUcPacks = [
    { amount: '60', price: '45', oldPrice: '55', isPopular: false },
    { amount: '60', price: '45', oldPrice: '55', isPopular: false },
    { amount: '60', price: '45', oldPrice: '55', isPopular: false },
  ];
  const [ucPacks, setUcPacks] = useState(post.templateData?.packs?.length ? post.templateData.packs : defaultUcPacks);
  const [countdownHours, setCountdownHours] = useState(post.templateData?.countdownHours || '');
  const [flashCtaText, setFlashCtaText] = useState(postType === 'uc-flash-sale' ? (post.templateData?.ctaButtonText || '') : '');
  const [flashWhatsappLink, setFlashWhatsappLink] = useState(postType === 'uc-flash-sale' ? (post.templateData?.whatsappLink || '') : '');

  // Royal Pass specific
  const defaultTiers = [
    { name: 'RP', label: 'Royal Pass', price: '80', type: 'base' },
    { name: 'ELITE', label: 'Elite Pass', price: '480', type: 'elite' },
    { name: 'ELITE+', label: 'Elite Plus', price: '960', type: 'plus' },
  ];
  const tData = post.templateData?.tiers;
  const rpTier = tData?.find(t => t.type === 'base') || defaultTiers[0];
  const eliteTier = tData?.find(t => t.type === 'elite') || defaultTiers[1];
  const plusTier = tData?.find(t => t.type === 'plus') || defaultTiers[2];

  const [seasonName, setSeasonName] = useState(post.templateData?.seasonName || '');
  const [rpPrice, setRpPrice] = useState(rpTier.price);
  const [elitePrice, setElitePrice] = useState(eliteTier.price);
  const [elitePlusPrice, setElitePlusPrice] = useState(plusTier.price);
  const [rpCtaText, setRpCtaText] = useState(postType === 'royal-pass' ? (post.templateData?.ctaButtonText || '') : '');
  const [rpWhatsappLink, setRpWhatsappLink] = useState(postType === 'royal-pass' ? (post.templateData?.whatsappLink || '') : '');

  // Steps management
  const addStep = () => {
    setSteps(prev => [...prev, { title: '', description: '' }]);
  };

  const removeStep = (index) => {
    if (steps.length <= 1) return;
    setSteps(prev => prev.filter((_, i) => i !== index));
  };

  const updateStep = (index, field, value) => {
    setSteps(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // UC Packs management
  const addUcPack = () => {
    setUcPacks(prev => [...prev, { amount: '60', price: '45', oldPrice: '55', isPopular: false }]);
  };

  const removeUcPack = (index) => {
    if (ucPacks.length <= 1) return;
    setUcPacks(prev => prev.filter((_, i) => i !== index));
  };

  const updateUcPack = (index, field, value) => {
    setUcPacks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Auto-resize textarea in code view
  useEffect(() => {
    if (viewMode === 'code' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 400) + 'px';
    }
  }, [viewMode, content]);

  const handleInput = (e) => {
    setContent(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 400) + 'px';
  };

  const handleSave = () => {
    if (['text', 'media'].includes(postType)) {
      if (!content.trim() || content === '<p><br></p>') { setError('Content cannot be empty.'); return; }
    }
    setError('');

    let templateData = post.templateData || {};

    if (postType === 'announcement') {
      const validSteps = steps.filter(s => s.title.trim() !== '');
      templateData = {
        steps: validSteps.map(s => ({
          title: s.title.trim(),
          description: s.description.trim(),
        })),
        ctaButtonText: ctaButtonText.trim() || '',
        whatsappLink: whatsappLink.trim() || '',
      };
    } else if (postType === 'uc-flash-sale') {
      templateData = {
        packs: ucPacks.map(p => ({
          amount: p.amount,
          price: p.price,
          oldPrice: p.oldPrice,
          isPopular: p.isPopular,
        })),
        countdownHours: countdownHours || '4',
        ctaButtonText: flashCtaText || 'Buy UC Now',
        whatsappLink: flashWhatsappLink.trim() || '',
      };
    } else if (postType === 'royal-pass') {
      templateData = {
        seasonName: seasonName,
        tiers: [
          { name: 'RP', label: 'Royal Pass', price: rpPrice, type: 'base' },
          { name: 'ELITE', label: 'Elite Pass', price: elitePrice, type: 'elite' },
          { name: 'ELITE+', label: 'Elite Plus', price: elitePlusPrice, type: 'plus' },
        ],
        ctaButtonText: rpCtaText || 'Get Royal Pass Now',
        whatsappLink: rpWhatsappLink.trim() || '',
      };
    }

    startTransition(async () => {
      const payload = { content: content.trim() };
      if (['announcement', 'uc-flash-sale', 'royal-pass'].includes(postType)) {
        payload.title = title.trim();
        payload.templateData = templateData;
      }

      const result = await updatePost(postId, payload);
      if (result?.success) {
        onClose();
      } else {
        setError(result?.message || 'Failed to update post. Please try again.');
      }
    });
  };

  // ReactQuill modules toolbar
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
      ['link', 'image', 'video'],
      ['clean']
    ],
  };

  // --- Dynamic Form Renderers ---

  const renderAnnouncementForm = () => (
    <>
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Announcement Title"
          className="form-input"
          required
          style={{
            background: 'var(--bg-card2)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '14px 16px', fontSize: '14px',
            color: 'var(--text-main)', width: '100%', outline: 'none',
            fontFamily: 'inherit', transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Description..."
          className="form-input"
          rows={4}
          style={{
            background: 'var(--bg-card2)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '14px 16px', fontSize: '14px',
            color: 'var(--text-main)', width: '100%', resize: 'vertical',
            outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '14px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)',
          }}>
            <i className="fas fa-list-ol" style={{ fontSize: '13px' }}></i>
            Steps
          </div>
          <button
            type="button"
            onClick={addStep}
            style={{
              background: 'none', border: 'none', color: 'var(--gold)',
              cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '4px 8px', borderRadius: '6px', transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(250,186,37,0.1)'}
            onMouseLeave={e => e.target.style.background = 'none'}
          >
            + Add
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {steps.map((step, index) => (
            <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'var(--gold)', color: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: '700', flexShrink: 0, marginTop: '8px',
                fontFamily: "'Rajdhani', sans-serif",
              }}>
                {index + 1}
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  type="text"
                  value={step.title}
                  onChange={e => updateStep(index, 'title', e.target.value)}
                  placeholder="Step title"
                  style={{
                    background: 'var(--bg-card2)', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '10px 14px', fontSize: '14px',
                    color: 'var(--text-main)', width: '100%', outline: 'none',
                    fontFamily: 'inherit', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <input
                  type="text"
                  value={step.description}
                  onChange={e => updateStep(index, 'description', e.target.value)}
                  placeholder="Step description"
                  style={{
                    background: 'transparent', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '10px 14px', fontSize: '13px',
                    color: 'var(--text-muted)', width: '100%', outline: 'none',
                    fontFamily: 'inherit', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>

              <button
                type="button"
                onClick={() => removeStep(index)}
                style={{
                  background: 'none', border: 'none', color: 'var(--accent-red)',
                  cursor: steps.length <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '16px', padding: '8px 4px',
                  opacity: steps.length <= 1 ? 0.3 : 1, marginTop: '6px',
                  flexShrink: 0, transition: 'opacity 0.2s',
                }}
                disabled={steps.length <= 1}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <input
          type="text"
          value={ctaButtonText}
          onChange={e => setCtaButtonText(e.target.value)}
          placeholder="CTA Button Text (e.g. Order Now on WhatsApp)"
          style={{
            background: 'var(--bg-card2)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '14px 16px', fontSize: '14px',
            color: 'var(--text-main)', width: '100%', outline: 'none',
            fontFamily: 'inherit', transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      <div style={{ marginBottom: '8px' }}>
        <input
          type="text"
          value={whatsappLink}
          onChange={e => setWhatsappLink(e.target.value)}
          placeholder="WhatsApp link / Number for CTA button"
          style={{
            background: 'var(--bg-card2)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '14px 16px', fontSize: '14px',
            color: 'var(--text-main)', width: '100%', outline: 'none',
            fontFamily: 'inherit', transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>
    </>
  );

  const renderFlashSaleForm = () => (
    <>
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Flash Sale Title (e.g. Today's Special UC Deals)" className="form-input" required
          style={{
            background: 'var(--bg-card2)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '14px 16px', fontSize: '14px',
            color: 'var(--text-main)', width: '100%', outline: 'none',
          }}
        />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <textarea
          value={content} onChange={e => setContent(e.target.value)}
          placeholder="Sale description..." className="form-input" rows={3}
          style={{
            background: 'var(--bg-card2)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '14px 16px', fontSize: '14px',
            color: 'var(--text-main)', width: '100%', outline: 'none', resize: 'vertical'
          }}
        />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>
            🏷️ UC Items
          </div>
          <button type="button" onClick={addUcPack} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px' }}>
            + Add
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ucPacks.map((pack, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="text" value={pack.amount} onChange={e => updateUcPack(index, 'amount', e.target.value)} style={{ width: '60px', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 8px', fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', textAlign: 'center', outline: 'none', fontFamily: "'Rajdhani', sans-serif" }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500', minWidth: '18px' }}>UC</span>
              <div style={{ position: 'relative', width: '80px' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>৳</span>
                <input type="text" value={pack.price} onChange={e => updateUcPack(index, 'price', e.target.value)} style={{ width: '100%', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 8px 10px 24px', fontSize: '14px', color: 'var(--text-main)', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div style={{ position: 'relative', width: '80px' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>৳</span>
                <input type="text" value={pack.oldPrice} onChange={e => updateUcPack(index, 'oldPrice', e.target.value)} style={{ width: '100%', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 8px 10px 24px', fontSize: '14px', color: 'var(--text-main)', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={pack.isPopular} onChange={e => updateUcPack(index, 'isPopular', e.target.checked)} style={{ width: '14px', height: '14px', accentColor: 'var(--gold)', cursor: 'pointer' }} />
                Pop
              </label>
              <button type="button" onClick={() => removeUcPack(index)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: ucPacks.length <= 1 ? 'not-allowed' : 'pointer', fontSize: '16px', padding: '4px', opacity: ucPacks.length <= 1 ? 0.3 : 1, flexShrink: 0 }} disabled={ucPacks.length <= 1}>✕</button>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <input type="text" value={countdownHours} onChange={e => setCountdownHours(e.target.value)} placeholder="Countdown Hours (e.g. 4)" className="form-input" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', fontSize: '14px', color: 'var(--text-main)', width: '100%', outline: 'none' }} />
      </div>
      <div style={{ marginBottom: '8px' }}>
        <input type="text" value={flashCtaText} onChange={e => setFlashCtaText(e.target.value)} placeholder="CTA Button Text (e.g. Buy UC Now)" className="form-input" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', fontSize: '14px', color: 'var(--text-main)', width: '100%', outline: 'none' }} />
      </div>
      <div style={{ marginBottom: '8px' }}>
        <input type="text" value={flashWhatsappLink} onChange={e => setFlashWhatsappLink(e.target.value)} placeholder="WhatsApp link / Number for CTA button" className="form-input" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', fontSize: '14px', color: 'var(--text-main)', width: '100%', outline: 'none' }} />
      </div>
    </>
  );

  const renderRoyalPassForm = () => (
    <>
      <div style={{ marginBottom: '16px' }}>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Royal Pass Title (e.g. Royal Pass C4S19)" className="form-input" required style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', fontSize: '14px', color: 'var(--text-main)', width: '100%', outline: 'none' }} />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <input type="text" value={seasonName} onChange={e => setSeasonName(e.target.value)} placeholder="Season Name (e.g. C4S19)" className="form-input" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', fontSize: '14px', color: 'var(--text-main)', width: '100%', outline: 'none' }} />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Description..." className="form-input" rows={4} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', fontSize: '14px', color: 'var(--text-main)', width: '100%', outline: 'none', resize: 'vertical' }} />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '14px' }}>👑 Tier Pricing</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 12px', textAlign: 'center', background: 'var(--bg-card2)' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '10px' }}>RP</div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>৳</span>
              <input type="text" value={rpPrice} onChange={e => setRpPrice(e.target.value)} style={{ width: '100%', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 8px 10px 24px', fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', textAlign: 'center', outline: 'none', fontFamily: 'inherit' }} />
            </div>
          </div>
          <div style={{ border: '1px solid #9C27B0', borderRadius: '12px', padding: '14px 12px', textAlign: 'center', background: 'rgba(156,39,176,0.06)' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#CE93D8', marginBottom: '10px' }}>ELITE</div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>৳</span>
              <input type="text" value={elitePrice} onChange={e => setElitePrice(e.target.value)} style={{ width: '100%', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 8px 10px 24px', fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', textAlign: 'center', outline: 'none', fontFamily: 'inherit' }} />
            </div>
          </div>
          <div style={{ border: '1px solid var(--gold)', borderRadius: '12px', padding: '14px 12px', textAlign: 'center', background: 'rgba(250,186,37,0.06)' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gold)', marginBottom: '10px' }}>ELITE+</div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>৳</span>
              <input type="text" value={elitePlusPrice} onChange={e => setElitePlusPrice(e.target.value)} style={{ width: '100%', background: 'transparent', border: '1px solid var(--gold-dim)', borderRadius: '8px', padding: '10px 8px 10px 24px', fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', textAlign: 'center', outline: 'none', fontFamily: 'inherit' }} />
            </div>
          </div>
        </div>
      </div>
      <div style={{ marginBottom: '8px' }}>
        <input type="text" value={rpCtaText} onChange={e => setRpCtaText(e.target.value)} placeholder="CTA Button Text (e.g. Get Royal Pass Now)" className="form-input" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', fontSize: '14px', color: 'var(--text-main)', width: '100%', outline: 'none' }} />
      </div>
      <div style={{ marginBottom: '8px' }}>
        <input type="text" value={rpWhatsappLink} onChange={e => setRpWhatsappLink(e.target.value)} placeholder="WhatsApp link / Number for CTA button" className="form-input" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', fontSize: '14px', color: 'var(--text-main)', width: '100%', outline: 'none' }} />
      </div>
    </>
  );


  // Render Main Form 
  const isCustomForm = ['announcement', 'uc-flash-sale', 'royal-pass'].includes(postType);

  const modalContent = (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={() => !isPending && onClose()}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg,rgba(28,28,36,0.99),rgba(20,20,28,0.99))',
          border: '1px solid rgba(250,186,37,0.2)',
          borderRadius: '22px',
          width: '100%', maxWidth: '620px',
          boxShadow: '0 28px 70px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.05)',
          overflow: 'hidden',
          animation: 'slideUp 0.25s ease',
          display: 'flex', flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(250,186,37,0.12)',
              border: '1px solid rgba(250,186,37,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--gold)', fontSize: '15px',
            }}>
              <i className="fas fa-pen" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>
                Edit Post
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
                {postType === 'text' ? 'Text Content' : postType}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            disabled={isPending}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--text-muted)', cursor: 'pointer',
              width: '32px', height: '32px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', transition: 'all 0.2s',
            }}
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* ── Editor Area ── */}
        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
          
          {isCustomForm ? (
            <>
              {postType === 'announcement' && renderAnnouncementForm()}
              {postType === 'uc-flash-sale' && renderFlashSaleForm()}
              {postType === 'royal-pass' && renderRoyalPassForm()}
            </>
          ) : (
            <>
              {/* View Toggles */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <label style={{
                  fontSize: '11px', fontWeight: '700',
                  color: 'var(--text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  Content
                </label>
                <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
                  <button
                    onClick={() => setViewMode('rich')}
                    style={{
                      padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                      background: viewMode === 'rich' ? 'rgba(250,186,37,0.15)' : 'transparent',
                      color: viewMode === 'rich' ? 'var(--gold)' : 'var(--text-sub)',
                      border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <i className="fas fa-magic mr-1"></i> Rich Text
                  </button>
                  <button
                    onClick={() => setViewMode('code')}
                    style={{
                      padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                      background: viewMode === 'code' ? 'rgba(250,186,37,0.15)' : 'transparent',
                      color: viewMode === 'code' ? 'var(--gold)' : 'var(--text-sub)',
                      border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <i className="fas fa-code mr-1"></i> Code View
                  </button>
                </div>
              </div>

              {viewMode === 'rich' ? (
                <div className="custom-quill-wrapper">
                  <style jsx global>{`
                    .custom-quill-wrapper .ql-container {
                      min-height: 140px;
                      font-size: 14px;
                      font-family: inherit;
                      background: rgba(255,255,255,0.04);
                      border: 1px solid rgba(255,255,255,0.1);
                      border-bottom-left-radius: 12px;
                      border-bottom-right-radius: 12px;
                      color: #E8E8EE;
                    }
                    .custom-quill-wrapper .ql-toolbar {
                      background: rgba(255,255,255,0.02);
                      border: 1px solid rgba(255,255,255,0.1);
                      border-top-left-radius: 12px;
                      border-top-right-radius: 12px;
                    }
                    .custom-quill-wrapper .ql-stroke { stroke: #bbb; }
                    .custom-quill-wrapper .ql-fill { fill: #bbb; }
                    .custom-quill-wrapper .ql-picker-label { color: #bbb; }
                    .custom-quill-wrapper .ql-snow .ql-picker-options { background-color: var(--bg-card); color: #fff; }
                    .custom-quill-wrapper .ql-toolbar button:hover .ql-stroke { stroke: var(--gold); }
                    .custom-quill-wrapper .ql-toolbar button:hover .ql-fill { fill: var(--gold); }
                  `}</style>
                  <ReactQuill 
                    theme="snow" 
                    value={content} 
                    onChange={setContent} 
                    modules={modules}
                    readOnly={isPending}
                  />
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleInput}
                  placeholder="Enter post content or paste HTML…"
                  disabled={isPending}
                  style={{
                    width: '100%',
                    minHeight: '140px',
                    maxHeight: '400px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    color: '#E8E8EE',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    fontFamily: "'Consolas','Fira Code',monospace",
                    outline: 'none',
                    resize: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(250,186,37,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              )}

              {/* Character / format hint */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: '8px',
              }}>
                <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
                  {viewMode === 'code' ? (content.includes('<') && content.includes('>') ? '🌐 HTML detected' : '✏️ Plain text') : '✨ Rich Text Editor'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
                  {content.length.toLocaleString()} chars
                </span>
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div style={{
              marginTop: '12px', padding: '10px 14px', borderRadius: '10px',
              background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)',
              color: '#ff6b6b', fontSize: '13px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <i className="fas fa-exclamation-circle" /> {error}
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        <div style={{
          display: 'flex', gap: '10px', padding: '0 24px 22px',
        }}>
          <button
            onClick={onClose}
            disabled={isPending}
            style={{
              flex: 1, padding: '12px', borderRadius: '12px',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--text-main)', cursor: 'pointer',
              fontSize: '14px', fontWeight: '600', transition: 'all 0.2s',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            style={{
              flex: 2, padding: '12px', borderRadius: '12px',
              background: isPending
                ? 'rgba(250,186,37,0.3)'
                : 'linear-gradient(135deg,var(--gold-light),var(--gold),var(--gold-dim))',
              border: 'none',
              color: isPending ? 'rgba(0,0,0,0.5)' : '#000',
              cursor: isPending ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: '700',
              fontFamily: 'var(--font-rajdhani,"Rajdhani"),sans-serif',
              letterSpacing: '0.04em',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {isPending
              ? <><i className="fas fa-spinner fa-spin" /> Saving…</>
              : <><i className="fas fa-check" /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return null;
}
