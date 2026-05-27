'use client';

import { useState, useRef } from 'react';
import { createPost } from '@/actions/posts';
import { uploadMediaFiles } from '@/lib/media/upload';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const POST_TABS = [
  { key: 'announcement', label: 'Announcement', icon: 'fas fa-flag' },
  { key: 'uc-flash-sale', label: 'Flash Sale', icon: 'fas fa-bolt' },
  { key: 'royal-pass', label: 'Royal Pass', icon: 'fas fa-crown' },
];

export default function CreatePostModal({ type: initialType, channelId, onClose }) {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState(initialType || 'announcement');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Shared State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); // description or text
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  // Announcement specific
  const [steps, setSteps] = useState([
    { title: '', description: '' },
    { title: '', description: '' },
  ]);
  const [ctaButtonText, setCtaButtonText] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');

  // Poll specific state
  const [pollOptions, setPollOptions] = useState([{ text: '' }, { text: '' }]);
  const [pollDuration, setPollDuration] = useState('24h');

  // UC Flash Sale specific
  const [ucPacks, setUcPacks] = useState([
    { amount: '60', price: '45', oldPrice: '55', isPopular: false },
    { amount: '60', price: '45', oldPrice: '55', isPopular: false },
    { amount: '60', price: '45', oldPrice: '55', isPopular: false },
  ]);
  const [countdownHours, setCountdownHours] = useState('');
  const [flashCtaText, setFlashCtaText] = useState('');
  const [flashWhatsappLink, setFlashWhatsappLink] = useState('');

  // Royal Pass specific
  const [seasonName, setSeasonName] = useState('');
  const [rpPrice, setRpPrice] = useState('80');
  const [elitePrice, setElitePrice] = useState('480');
  const [elitePlusPrice, setElitePlusPrice] = useState('960');
  const [rpCtaText, setRpCtaText] = useState('');
  const [rpWhatsappLink, setRpWhatsappLink] = useState('');

  // Handle local file preview
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFiles(prev => [...prev, ...selectedFiles]);

      const newPreviews = selectedFiles.map(file => ({
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' : 'image',
        name: file.name
      }));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
    // reset input value to allow selecting same files again if removed
    e.target.value = null;
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Upload files via the shared helper
  const uploadFiles = async () => {
    if (!files || files.length === 0) return [];

    setUploadProgress(0);

    const uploadedFiles = await uploadMediaFiles(files, {
      onProgress: ({ percent }) => setUploadProgress(percent),
    });

    setUploadProgress(100);

    return uploadedFiles.map((file) => ({
      url: file.url,
      type: file.type,
    }));
  };

  // Steps management
  const addStep = () => {
    setSteps(prev => [...prev, { title: '', description: '' }]);
  };

  const removeStep = (index) => {
    if (steps.length <= 1) return; // keep at least one
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      let mediaPayload = [];

      if (files && files.length > 0) {
        mediaPayload = await uploadFiles();
      }

      let templateData = {};
      let postType = activeTab;

      if (activeTab === 'poll') {
        const validOptions = pollOptions.filter(o => o.text.trim() !== '');
        if (validOptions.length < 2) throw new Error('Poll needs at least 2 options');
        templateData = {
          options: validOptions.map(o => ({ text: o.text.trim(), votes: 0 })),
          duration: pollDuration,
          endTime: new Date(Date.now() + (pollDuration === '24h' ? 86400000 : 86400000 * 7)).toISOString()
        };
      } else if (activeTab === 'announcement') {
        const validSteps = steps.filter(s => s.title.trim() !== '');
        templateData = {
          steps: validSteps.map(s => ({
            title: s.title.trim(),
            description: s.description.trim(),
          })),
          ctaButtonText: ctaButtonText.trim() || '',
          whatsappLink: whatsappLink.trim() || '',
        };
      } else if (activeTab === 'uc-flash-sale') {
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
      } else if (activeTab === 'royal-pass') {
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

      const result = await createPost({
        channel: channelId,
        author: session?.user?.id,
        type: postType,
        title,
        content,
        media: mediaPayload,
        templateData
      });

      if (result.success) {
        router.refresh();
        onClose();
      } else {
        throw new Error(result.message);
      }

    } catch (err) {
      setUploadProgress(0);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // --- Dynamic Form Renderers --- //

  const renderMediaForm = () => (
    <>
      <div style={{ marginBottom: '16px' }}>
        {previews.length > 0 ? (
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', WebkitOverflowScrolling: 'touch' }}>
            {previews.map((preview, idx) => (
              <div key={idx} style={{
                position: 'relative', minWidth: '120px', width: '120px', height: '120px',
                borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)',
                flexShrink: 0
              }}>
                <button type="button" onClick={() => removeFile(idx)} style={{
                  position: 'absolute', top: '6px', right: '6px', zIndex: 10,
                  width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)',
                  color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <i className="fas fa-times" style={{ fontSize: '12px' }}></i>
                </button>
                {preview.type === 'video' ? (
                  <video src={`${preview.url}#t=0.1`} preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={preview.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
            ))}

            {/* Add More Button */}
            <div
              onClick={() => fileInputRef.current.click()}
              style={{
                minWidth: '120px', width: '120px', height: '120px', border: '2px dashed var(--border)',
                borderRadius: '12px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                background: 'var(--bg-card2)', color: 'var(--text-muted)', flexShrink: 0
              }}
            >
              <i className="fas fa-plus" style={{ fontSize: '24px', marginBottom: '8px' }}></i>
              <span style={{ fontSize: '12px' }}>Add More</span>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current.click()}
            style={{
              width: '100%', height: '200px', border: '2px dashed var(--border)',
              borderRadius: '12px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              background: 'var(--bg-card2)', color: 'var(--text-muted)',
              overflow: 'hidden', position: 'relative'
            }}
          >
            <i className="fas fa-cloud-upload-alt" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
            <span>Click to select Image or Video</span>
          </div>
        )}
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" multiple style={{ display: 'none' }} required={files.length === 0} />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text" value={content} onChange={e => setContent(e.target.value)}
          placeholder="Add a caption..." className="form-input"
        />
      </div>
    </>
  );



  const renderPollForm = () => (
    <>
      <div style={{ marginBottom: '16px' }}>
        <label className="form-label">Question</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ask a question..." className="form-input" required />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label className="form-label">Options</label>
        {pollOptions.map((opt, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="text" value={opt.text} placeholder={`Option ${i + 1}`} className="form-input"
              onChange={(e) => {
                const newOpts = [...pollOptions];
                newOpts[i].text = e.target.value;
                setPollOptions(newOpts);
              }}
            />
            {i >= 2 && (
              <button type="button" onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}>
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        ))}
        {pollOptions.length < 5 && (
          <button type="button" onClick={() => setPollOptions([...pollOptions, { text: '' }])} className="btn-outline" style={{ width: '100%', marginTop: '8px', padding: '8px' }}>
            + Add Option
          </button>
        )}
      </div>
    </>
  );

  const renderAnnouncementForm = () => (
    <>
      {/* Title */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Announcement Title (e.g. How to Order UC)"
          className="form-input"
          required
          style={{
            background: 'var(--bg-card2)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '14px 16px',
            fontSize: '14px',
            color: 'var(--text-main)',
            width: '100%',
          }}
        />
      </div>

      {/* Description */}
      <div style={{ marginBottom: '20px' }}>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Description..."
          className="form-input"
          rows={4}
          style={{
            background: 'var(--bg-card2)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '14px 16px',
            fontSize: '14px',
            color: 'var(--text-main)',
            width: '100%',
            resize: 'vertical',
          }}
        />
      </div>

      {/* Steps Section */}
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
              background: 'none',
              border: 'none',
              color: 'var(--gold)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              transition: 'background 0.2s',
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
              {/* Step Number Badge */}
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'var(--gold)', color: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: '700',
                flexShrink: 0, marginTop: '8px',
                fontFamily: "'Rajdhani', sans-serif",
              }}>
                {index + 1}
              </div>

              {/* Step Inputs */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  type="text"
                  value={step.title}
                  onChange={e => updateStep(index, 'title', e.target.value)}
                  placeholder="Step title"
                  style={{
                    background: 'var(--bg-card2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '14px',
                    color: 'var(--text-main)',
                    width: '100%',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
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
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    width: '100%',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeStep(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-red)',
                  cursor: steps.length <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  padding: '8px 4px',
                  opacity: steps.length <= 1 ? 0.3 : 1,
                  marginTop: '6px',
                  flexShrink: 0,
                  transition: 'opacity 0.2s',
                }}
                disabled={steps.length <= 1}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Button Text */}
      <div style={{ marginBottom: '8px' }}>
        <input
          type="text"
          value={ctaButtonText}
          onChange={e => setCtaButtonText(e.target.value)}
          placeholder="CTA Button Text (e.g. Order Now on WhatsApp)"
          style={{
            background: 'var(--bg-card2)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '14px 16px',
            fontSize: '14px',
            color: 'var(--text-main)',
            width: '100%',
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* WhatsApp Link / Number */}
      <div style={{ marginBottom: '8px' }}>
        <input
          type="text"
          value={whatsappLink}
          onChange={e => setWhatsappLink(e.target.value)}
          placeholder="WhatsApp link / Number for CTA button"
          style={{
            background: 'var(--bg-card2)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '14px 16px',
            fontSize: '14px',
            color: 'var(--text-main)',
            width: '100%',
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>
    </>
  );

  const renderFlashSaleForm = () => (
    <>
      {/* Title */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Flash Sale Title (e.g. Today's Special UC Deals)"
          className="form-input"
          required
        />
      </div>

      {/* Description */}
      <div style={{ marginBottom: '20px' }}>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Sale description..."
          className="form-input"
          rows={3}
          style={{ resize: 'vertical' }}
        />
      </div>

      {/* UC Items Section */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '14px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)',
          }}>
            🏷️ UC Items
          </div>
          <button
            type="button"
            onClick={addUcPack}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--gold)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(250,186,37,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            + Add
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ucPacks.map((pack, index) => (
            <div key={index} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              {/* UC Amount */}
              <input
                type="text"
                value={pack.amount}
                onChange={e => updateUcPack(index, 'amount', e.target.value)}
                style={{
                  width: '60px',
                  background: 'var(--bg-card2)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '10px 8px',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  textAlign: 'center',
                  outline: 'none',
                  fontFamily: "'Rajdhani', sans-serif",
                }}
              />

              {/* UC Label */}
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500', minWidth: '18px' }}>UC</span>

              {/* Price with ৳ */}
              <div style={{ position: 'relative', width: '80px' }}>
                <span style={{
                  position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600',
                }}>৳</span>
                <input
                  type="text"
                  value={pack.price}
                  onChange={e => updateUcPack(index, 'price', e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-card2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 8px 10px 24px',
                    fontSize: '14px',
                    color: 'var(--text-main)',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Old Price with ৳ */}
              <div style={{ position: 'relative', width: '80px' }}>
                <span style={{
                  position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600',
                }}>৳</span>
                <input
                  type="text"
                  value={pack.oldPrice}
                  onChange={e => updateUcPack(index, 'oldPrice', e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-card2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 8px 10px 24px',
                    fontSize: '14px',
                    color: 'var(--text-main)',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Popular Checkbox */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}>
                <input
                  type="checkbox"
                  checked={pack.isPopular}
                  onChange={e => updateUcPack(index, 'isPopular', e.target.checked)}
                  style={{ width: '14px', height: '14px', accentColor: 'var(--gold)', cursor: 'pointer' }}
                />
                Pop
              </label>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removeUcPack(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-red)',
                  cursor: ucPacks.length <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  padding: '4px',
                  opacity: ucPacks.length <= 1 ? 0.3 : 1,
                  flexShrink: 0,
                  transition: 'opacity 0.2s',
                  lineHeight: 1,
                }}
                disabled={ucPacks.length <= 1}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Countdown Hours */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          value={countdownHours}
          onChange={e => setCountdownHours(e.target.value)}
          placeholder="Countdown Hours (e.g. 4)"
          className="form-input"
        />
      </div>

      {/* CTA Button Text */}
      <div style={{ marginBottom: '8px' }}>
        <input
          type="text"
          value={flashCtaText}
          onChange={e => setFlashCtaText(e.target.value)}
          placeholder="CTA Button Text (e.g. Buy UC Now)"
          className="form-input"
        />
      </div>

      {/* WhatsApp Link / Number */}
      <div style={{ marginBottom: '8px' }}>
        <input
          type="text"
          value={flashWhatsappLink}
          onChange={e => setFlashWhatsappLink(e.target.value)}
          placeholder="WhatsApp link / Number for CTA button"
          className="form-input"
        />
      </div>
    </>
  );

  const renderRoyalPassForm = () => (
    <>
      {/* Title */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Royal Pass Title (e.g. Royal Pass C4S19)"
          className="form-input"
          required
        />
      </div>

      {/* Season Name */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          value={seasonName}
          onChange={e => setSeasonName(e.target.value)}
          placeholder="Season Name (e.g. C4S19)"
          className="form-input"
        />
      </div>

      {/* Description */}
      <div style={{ marginBottom: '20px' }}>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Description..."
          className="form-input"
          rows={4}
          style={{ resize: 'vertical' }}
        />
      </div>

      {/* Tier Pricing Section */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)',
          marginBottom: '14px',
        }}>
          👑 Tier Pricing
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          {/* RP Tier */}
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '14px 12px',
            textAlign: 'center',
            background: 'var(--bg-card2)',
          }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '10px' }}>RP</div>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600',
              }}>৳</span>
              <input
                type="text"
                value={rpPrice}
                onChange={e => setRpPrice(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-card2)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '10px 8px 10px 24px',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  textAlign: 'center',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* ELITE Tier */}
          <div style={{
            border: '1px solid #9C27B0',
            borderRadius: '12px',
            padding: '14px 12px',
            textAlign: 'center',
            background: 'rgba(156,39,176,0.06)',
          }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#CE93D8', marginBottom: '10px' }}>ELITE</div>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600',
              }}>৳</span>
              <input
                type="text"
                value={elitePrice}
                onChange={e => setElitePrice(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '10px 8px 10px 24px',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  textAlign: 'center',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* ELITE+ Tier */}
          <div style={{
            border: '1px solid var(--gold)',
            borderRadius: '12px',
            padding: '14px 12px',
            textAlign: 'center',
            background: 'rgba(250,186,37,0.06)',
          }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gold)', marginBottom: '10px' }}>ELITE+</div>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600',
              }}>৳</span>
              <input
                type="text"
                value={elitePlusPrice}
                onChange={e => setElitePlusPrice(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid var(--gold-dim)',
                  borderRadius: '8px',
                  padding: '10px 8px 10px 24px',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  textAlign: 'center',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button Text */}
      <div style={{ marginBottom: '8px' }}>
        <input
          type="text"
          value={rpCtaText}
          onChange={e => setRpCtaText(e.target.value)}
          placeholder="CTA Button Text (e.g. Get Royal Pass Now)"
          className="form-input"
        />
      </div>

      {/* WhatsApp Link / Number */}
      <div style={{ marginBottom: '8px' }}>
        <input
          type="text"
          value={rpWhatsappLink}
          onChange={e => setRpWhatsappLink(e.target.value)}
          placeholder="WhatsApp link / Number for CTA button"
          className="form-input"
        />
      </div>
    </>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />

      <div style={{
        position: 'relative', zIndex: 1,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', width: '100%', maxWidth: '540px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        animation: 'slideUp .3s ease',
        margin: '16px',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 className="font-raj" style={{ fontSize: '22px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
            Create Post
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: '20px', padding: '4px',
            transition: 'color 0.2s',
          }}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Tab Bar */}
        <div style={{
          display: 'flex', gap: '8px', padding: '0 24px 16px',
          flexWrap: 'wrap',
        }}>
          {POST_TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: isActive ? '2px solid var(--gold)' : '1px solid var(--border)',
                  background: isActive ? 'var(--gold)' : 'transparent',
                  color: isActive ? '#000' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: isActive ? '700' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                <i className={tab.icon} style={{ fontSize: '12px' }}></i>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border)', margin: '0 24px' }} />

        {/* Form Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          <form id="postForm" onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: 'rgba(255,68,68,.1)', border: '1px solid rgba(255,68,68,.3)',
                borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
                fontSize: '13px', color: 'var(--accent-red)',
              }}>
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}

            {loading && uploadProgress > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <span>Uploading media</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', borderRadius: '999px', background: 'var(--bg-card2)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--gold)', transition: 'width 0.2s ease' }} />
                </div>
              </div>
            )}

            <style>{`.form-label { display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; }`}</style>

            {activeTab === 'media' && renderMediaForm()}
            {activeTab === 'poll' && renderPollForm()}
            {activeTab === 'announcement' && renderAnnouncementForm()}

            {activeTab === 'uc-flash-sale' && renderFlashSaleForm()}
            {activeTab === 'royal-pass' && renderRoyalPassForm()}
          </form>
        </div>

        {/* Footer Buttons */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: '12px', justifyContent: 'flex-end',
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-main)',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="postForm"
            disabled={loading}
            style={{
              padding: '10px 28px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--gold)',
              color: '#000',
              fontSize: '14px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Rajdhani', sans-serif",
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
              letterSpacing: '0.3px',
            }}
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin"></i> Posting...</>
            ) : (
              'Publish'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
