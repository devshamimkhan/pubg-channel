'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaBullhorn,
  FaCheck,
  FaGlobe,
  FaImage,
  FaLink,
  FaPlus,
  FaSave,
  FaSearch,
  FaTrash,
  FaUpload,
} from 'react-icons/fa';
import { createSiteSettings, updateSiteSettings } from '@/actions/settings';
import { uploadSingleMediaFile } from '@/lib/media/upload';
import s from '../../admin.module.css';

const SOCIAL_FIELDS = [
  { key: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/...' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@...' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
  { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/...' },
  { key: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/...' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
];

function emptyLink() {
  return { title: '', url: '', image: '', type: 'card' };
}

function normalizeSettings(settings) {
  return {
    siteName: settings?.siteName || 'PUBG UC Store BD',
    siteDescription: settings?.siteDescription || '',
    logo: settings?.logo || '',
    favicon: settings?.favicon || '',
    contactEmail: settings?.contactEmail || '',
    whatsappNumber: settings?.whatsappNumber || '',
    socialLinks: {
      whatsapp: settings?.socialLinks?.whatsapp || '',
      youtube: settings?.socialLinks?.youtube || '',
      facebook: settings?.socialLinks?.facebook || '',
      telegram: settings?.socialLinks?.telegram || '',
      twitter: settings?.socialLinks?.twitter || '',
      instagram: settings?.socialLinks?.instagram || '',
    },
    homepageContent: {
      bio: settings?.homepageContent?.bio || '',
      links: Array.isArray(settings?.homepageContent?.links) && settings.homepageContent.links.length
        ? settings.homepageContent.links.map((link) => ({
            title: link?.title || '',
            url: link?.url || '',
            image: link?.image || '',
            type: ['card', 'grid', 'row'].includes(link?.type) ? link.type : 'card',
          }))
        : [emptyLink()],
    },
    seo: {
      metaTitle: settings?.seo?.metaTitle || '',
      metaDescription: settings?.seo?.metaDescription || '',
      keywords: settings?.seo?.keywords || '',
      canonicalUrl: settings?.seo?.canonicalUrl || '',
      ogImage: settings?.seo?.ogImage || '',
    },
    featuredChannels: Array.isArray(settings?.featuredChannels)
      ? settings.featuredChannels.map((channel) => (typeof channel === 'string' ? channel : channel?._id || channel?.id)).filter(Boolean)
      : [],
  };
}

function Field({ label, children, hint }) {
  return (
    <div className={s.formGroup}>
      <label>{label}</label>
      {children}
      {hint ? <div className={s.hint}>{hint}</div> : null}
    </div>
  );
}

export default function AdminSettingsClient({ initialSettings, initialError, initialMode = 'edit', initialChannels = [] }) {
  const router = useRouter();
  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);
  const ogImageInputRef = useRef(null);
  const linkImageInputRefs = useRef([]);

  const [mode, setMode] = useState(initialMode);
  const [settingsId, setSettingsId] = useState(initialSettings?._id || '');
  const [error, setError] = useState(initialError || '');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [uploadingLinkIndex, setUploadingLinkIndex] = useState(-1);

  const [search, setSearch] = useState('');
  const [form, setForm] = useState(() => normalizeSettings(initialSettings));

  const featuredChannelSet = useMemo(() => new Set(form.featuredChannels), [form.featuredChannels]);

  const filteredChannels = useMemo(() => {
    const query = search.trim().toLowerCase();
    return Array.isArray(initialChannels)
      ? initialChannels.filter((channel) => {
          if (!query) return true;
          return [channel?.name, channel?.slug, channel?.description]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
        })
      : [];
  }, [initialChannels, search]);

  const updateField = (path, value) => {
    setForm((prev) => {
      if (path.length === 1) {
        return { ...prev, [path[0]]: value };
      }

      if (path[0] === 'socialLinks') {
        return { ...prev, socialLinks: { ...prev.socialLinks, [path[1]]: value } };
      }

      if (path[0] === 'seo') {
        return { ...prev, seo: { ...prev.seo, [path[1]]: value } };
      }

      if (path[0] === 'homepageContent' && path[1] === 'bio') {
        return { ...prev, homepageContent: { ...prev.homepageContent, bio: value } };
      }

      return prev;
    });
  };

  const updateLink = (index, key, value) => {
    setForm((prev) => {
      const links = prev.homepageContent.links.slice();
      links[index] = { ...links[index], [key]: value };
      return { ...prev, homepageContent: { ...prev.homepageContent, links } };
    });
  };

  const addLink = () => {
    setForm((prev) => ({
      ...prev,
      homepageContent: { ...prev.homepageContent, links: [...prev.homepageContent.links, emptyLink()] },
    }));
  };

  const removeLink = (index) => {
    setForm((prev) => {
      const links = prev.homepageContent.links.filter((_, i) => i !== index);
      return {
        ...prev,
        homepageContent: { ...prev.homepageContent, links: links.length ? links : [emptyLink()] },
      };
    });
  };

  const toggleFeaturedChannel = (channelId) => {
    setForm((prev) => {
      const next = prev.featuredChannels.includes(channelId)
        ? prev.featuredChannels.filter((id) => id !== channelId)
        : [...prev.featuredChannels, channelId];
      return { ...prev, featuredChannels: next };
    });
  };

  const handleUpload = async (file, targetKey, nestedKey = '') => {
    if (!file) return;
    setUploading(targetKey);
    setError('');

    try {
      const uploaded = await uploadSingleMediaFile(file);
      if (!uploaded?.url) throw new Error('Upload failed');

      setForm((prev) => {
        if (!nestedKey) {
          return { ...prev, [targetKey]: uploaded.url };
        }

        return {
          ...prev,
          [targetKey]: {
            ...prev[targetKey],
            [nestedKey]: uploaded.url,
          },
        };
      });
    } catch (err) {
      setError(err?.message || 'Failed to upload file');
    } finally {
      setUploading('');
    }
  };

  const handleLinkImageUpload = async (file, index) => {
    if (!file) return;
    setUploadingLinkIndex(index);
    setError('');

    try {
      const uploaded = await uploadSingleMediaFile(file);
      if (!uploaded?.url) throw new Error('Upload failed');

      updateLink(index, 'image', uploaded.url);
    } catch (err) {
      setError(err?.message || 'Failed to upload image');
    } finally {
      setUploadingLinkIndex(-1);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    const payload = {
      ...form,
      homepageContent: {
        ...form.homepageContent,
        links: form.homepageContent.links.filter((link) => link.title || link.url || link.image),
      },
    };

    const result =
      mode === 'create' || !settingsId
        ? await createSiteSettings(payload)
        : await updateSiteSettings(settingsId, payload);

    if (result?.success) {
      setMessage(result.message || 'Settings saved successfully');
      setMode('edit');
      if (result.settings?._id) setSettingsId(result.settings._id);
      if (result.settings) setForm(normalizeSettings(result.settings));
      router.refresh();
    } else {
      setError(result?.message || 'Failed to save settings');
    }

    setSaving(false);
  };

  const isBusy = saving || Boolean(uploading);

  return (
    <div className={s.contentArea}>
      {error ? (
        <div className={`${s.alert} ${s.alertInfo}`}>
          <FaBullhorn />
          <div>{error}</div>
        </div>
      ) : null}

      {message ? (
        <div className={`${s.alert} ${s.alertInfo}`}>
          <FaCheck />
          <div>{message}</div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        <div className={s.card}>
          <div className={s.cardTitle}>
            <FaGlobe /> Site Settings
          </div>

          <div className={s.formGrid2}>
            <Field label="Site Title">
              <input className={s.formControl} value={form.siteName} onChange={(e) => updateField(['siteName'], e.target.value)} placeholder="Site title" />
            </Field>
            <Field label="Contact Email">
              <input className={s.formControl} value={form.contactEmail} onChange={(e) => updateField(['contactEmail'], e.target.value)} placeholder="admin@example.com" />
            </Field>
          </div>

          <Field label="Site Description">
            <textarea className={`${s.formControl} ${s.formControlTextarea}`} value={form.siteDescription} onChange={(e) => updateField(['siteDescription'], e.target.value)} placeholder="Short site description" />
          </Field>

          <div className={s.formGrid2}>
            <Field label="Logo Upload" hint="Recommended: square PNG/WebP">
              <div
                className={`${s.uploadBox} ${form.logo ? s.uploadBoxHasPreview : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => logoInputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && logoInputRef.current?.click()}
              >
                {form.logo ? (
                  <div className={s.uploadBoxPreviewCompact}>
                    <div className={s.uploadBoxPreviewMedia}>
                      <img src={form.logo} alt="Logo preview" />
                    </div>
                    <div className={s.uploadBoxPreviewText}>
                      <div className={s.uploadBoxPreviewLabel}>Current logo</div>
                      <div className={s.uploadBoxPreviewName}>Click to replace</div>
                      <div className={s.uploadBoxPreviewSub}>{uploading === 'logo' ? 'Uploading...' : form.logo}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <FaImage />
                    <p>
                      <span>Click</span> to upload logo
                    </p>
                  </div>
                )}
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" hidden onChange={(e) => handleUpload(e.target.files?.[0], 'logo')} />
            </Field>

            <Field label="Favicon Upload" hint="Recommended: 32×32 or SVG">
              <div
                className={`${s.uploadBox} ${form.favicon ? s.uploadBoxHasPreview : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => faviconInputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && faviconInputRef.current?.click()}
              >
                {form.favicon ? (
                  <div className={s.uploadBoxPreviewCompact}>
                    <div className={s.uploadBoxPreviewMedia}>
                      <img src={form.favicon} alt="Favicon preview" />
                    </div>
                    <div className={s.uploadBoxPreviewText}>
                      <div className={s.uploadBoxPreviewLabel}>Current favicon</div>
                      <div className={s.uploadBoxPreviewName}>Click to replace</div>
                      <div className={s.uploadBoxPreviewSub}>{uploading === 'favicon' ? 'Uploading...' : form.favicon}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <FaUpload />
                    <p>
                      <span>Click</span> to upload favicon
                    </p>
                  </div>
                )}
              </div>
              <input ref={faviconInputRef} type="file" accept="image/*,.ico,.svg" hidden onChange={(e) => handleUpload(e.target.files?.[0], 'favicon')} />
            </Field>
          </div>
        </div>

        <div className={s.card}>
          <div className={s.cardTitle}>
            <FaLink /> Social Links
          </div>

          {SOCIAL_FIELDS.map((field) => (
            <div key={field.key} className={s.socialRow}>
              <div className={`${s.socialIcon} ${field.key === 'facebook' ? s.socialFb : field.key === 'youtube' ? s.socialYt : field.key === 'telegram' ? s.socialTg : field.key === 'twitter' ? s.socialTw : s.socialIg}`}>
                <FaLink />
              </div>
              <input
                className={s.formControl}
                value={form.socialLinks[field.key]}
                onChange={(e) => updateField(['socialLinks', field.key], e.target.value)}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>

        <div className={s.card}>
          <div className={s.cardTitle}>
            <FaSearch /> Home Page SEO
          </div>

          <div className={s.formGrid2}>
            <Field label="Meta Title">
              <input className={s.formControl} value={form.seo.metaTitle} onChange={(e) => updateField(['seo', 'metaTitle'], e.target.value)} placeholder="Homepage meta title" />
            </Field>
            <Field label="Canonical URL">
              <input className={s.formControl} value={form.seo.canonicalUrl} onChange={(e) => updateField(['seo', 'canonicalUrl'], e.target.value)} placeholder="https://example.com/" />
            </Field>
          </div>

          <Field label="Meta Description">
            <textarea className={`${s.formControl} ${s.formControlTextarea}`} value={form.seo.metaDescription} onChange={(e) => updateField(['seo', 'metaDescription'], e.target.value)} placeholder="Search engine description" />
          </Field>

          <div className={s.formGrid2}>
            <Field label="Keywords">
              <input className={s.formControl} value={form.seo.keywords} onChange={(e) => updateField(['seo', 'keywords'], e.target.value)} placeholder="PUBG UC, Royal Pass, top up" />
            </Field>
            <Field label="OG Image">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input className={s.formControl} value={form.seo.ogImage} onChange={(e) => updateField(['seo', 'ogImage'], e.target.value)} placeholder="Open Graph image URL" />
                <button type="button" className={s.iconBtn} onClick={() => ogImageInputRef.current?.click()} aria-label="Upload OG image">
                  <FaUpload />
                </button>
              </div>
              <input ref={ogImageInputRef} type="file" accept="image/*" hidden onChange={(e) => handleUpload(e.target.files?.[0], 'seo', 'ogImage')} />
            </Field>
          </div>

          <div className={s.seoPreview}>
            <div className={s.seoSite}>{form.siteName || 'Site name'}</div>
            <div className={s.seoTitle}>{form.seo.metaTitle || form.siteName || 'Homepage title'}</div>
            <div className={s.seoDesc}>{form.seo.metaDescription || form.siteDescription || 'Search preview description'}</div>
          </div>
        </div>

        <div className={s.card}>
          <div className={s.cardTitle}>
            <FaLink /> Home Page Link Posts
          </div>
          <div className={s.hint} style={{ marginTop: '-10px', marginBottom: '18px' }}>
            Build homepage cards with a clean preview, image upload, and destination link.
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            {form.homepageContent.links.map((link, index) => (
              <div
                key={index}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  background: 'var(--bg-card2)',
                  overflow: 'hidden',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '124px 1fr',
                    gap: '16px',
                    padding: '16px',
                    alignItems: 'start',
                  }}
                >
                  <div
                    style={{
                      width: '124px',
                      height: '124px',
                      borderRadius: '14px',
                      border: '1px solid var(--border)',
                      background: link.image
                        ? `center / cover no-repeat url(${link.image})`
                        : 'linear-gradient(135deg, rgba(250,186,37,0.12), rgba(255,255,255,0.02))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: link.image ? 'transparent' : 'var(--gold)',
                      flexShrink: 0,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {!link.image ? <FaImage style={{ fontSize: 28 }} /> : null}

                    <button
                      type="button"
                      onClick={() => linkImageInputRefs.current[index]?.click()}
                      disabled={uploadingLinkIndex === index}
                      style={{
                        position: 'absolute',
                        left: 10,
                        right: 10,
                        bottom: 10,
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.14)',
                        background: 'rgba(15,15,18,0.84)',
                        color: 'var(--text-main)',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '8px 10px',
                        cursor: uploadingLinkIndex === index ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <FaUpload />
                      {uploadingLinkIndex === index ? 'Uploading...' : link.image ? 'Replace Image' : 'Upload Image'}
                    </button>

                    <input
                      ref={(el) => {
                        linkImageInputRefs.current[index] = el;
                      }}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => handleLinkImageUpload(e.target.files?.[0], index)}
                    />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                          Link Card #{index + 1}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 4 }}>
                          This card will appear on the homepage as a clickable post.
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`${s.iconBtn} ${s.iconBtnDel}`}
                        onClick={() => removeLink(index)}
                        aria-label="Remove link"
                        title="Remove link"
                      >
                        <FaTrash />
                      </button>
                    </div>

                    <div className={s.formGrid2}>
                      <div className={s.formGroup}>
                        <label>Card Title</label>
                        <input
                          className={s.formControl}
                          value={link.title}
                          onChange={(e) => updateLink(index, 'title', e.target.value)}
                          placeholder="Test Post Link"
                        />
                      </div>
                      <div className={s.formGroup}>
                        <label>Card Type</label>
                        <select
                          className={`${s.formControl} ${s.formControlSelect}`}
                          value={link.type}
                          onChange={(e) => updateLink(index, 'type', e.target.value)}
                        >
                          <option value="card">Card</option>
                          <option value="grid">Grid</option>
                          <option value="row">Row</option>
                        </select>
                      </div>
                    </div>

                    <div className={s.formGroup}>
                      <label>Destination URL</label>
                      <input
                        className={s.formControl}
                        value={link.url}
                        onChange={(e) => updateLink(index, 'url', e.target.value)}
                        placeholder="/channels or https://..."
                      />
                    </div>

                    <div className={s.formGroup}>
                      <label>Image URL</label>
                      <input
                        className={s.formControl}
                        value={link.image}
                        onChange={(e) => updateLink(index, 'image', e.target.value)}
                        placeholder="Upload or paste an image URL"
                      />
                      <div className={s.hint}>Images uploaded from the Media Server will appear instantly in the preview.</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={s.cardFooter} style={{ marginTop: 18 }}>
            <button type="button" className={s.btnOutline} onClick={addLink}>
              <FaPlus /> Add link post
            </button>
          </div>
        </div>

        <div className={s.card}>
          <div className={s.cardTitle}>
            <FaGlobe /> Featured Channels
          </div>

          <div className={s.searchBar}>
            <FaSearch />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search channels..." />
          </div>

          {filteredChannels.length ? filteredChannels.map((channel) => {
            const channelId = String(channel?._id || '');
            const isFeatured = featuredChannelSet.has(channelId);

            return (
              <div key={channelId} className={s.channelItem}>
                <div className={s.channelThumb}>
                  {channel?.avatar ? <img src={channel.avatar} alt={channel.name || 'Channel'} /> : <FaGlobe />}
                </div>

                <div className={s.channelInfo}>
                  <div className={s.channelTitle}>{channel?.name || 'Unnamed channel'}</div>
                  <div className={s.channelUrl}>/{channel?.slug || 'channel'}</div>
                </div>

                <button
                  type="button"
                  className={`${s.toggle} ${isFeatured ? s.toggleOn : ''}`}
                  onClick={() => toggleFeaturedChannel(channelId)}
                  aria-label={isFeatured ? 'Unset featured channel' : 'Set featured channel'}
                />
                <div className={s.featuredToggle}>
                  <span className={s.featuredToggleLabel}>{isFeatured ? 'Featured' : 'Hidden'}</span>
                </div>
              </div>
            );
          }) : (
            <div className={s.hint}>No channels match your search.</div>
          )}
        </div>

        <div className={s.cardFooter}>
          <button type="submit" className={s.btnGold} disabled={isBusy}>
            <FaSave /> {saving ? 'Saving...' : mode === 'create' ? 'Create Settings' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
