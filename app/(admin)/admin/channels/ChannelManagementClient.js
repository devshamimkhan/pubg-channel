'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaBullhorn,
  FaCheck,
  FaEdit,
  FaImage,
  FaLink,
  FaPlus,
  FaSave,
  FaSearch,
  FaShieldAlt,
  FaSpinner,
  FaStar,
  FaTrash,
  FaUsers,
} from 'react-icons/fa';
import { createChannel, deleteChannel, updateChannel } from '@/actions/channels';
import { updateSiteSettings } from '@/actions/settings';
import s from '../../admin.module.css';

function Field({ label, children, hint }) {
  return (
    <div className={s.formGroup}>
      <label>{label}</label>
      {children}
      {hint ? <div className={s.hint}>{hint}</div> : null}
    </div>
  );
}

function normalizeChannel(channel) {
  return {
    _id: channel?._id || '',
    name: channel?.name || '',
    slug: channel?.slug || '',
    description: channel?.description || '',
    avatar: channel?.avatar || '',
    coverImage: channel?.coverImage || '',
    isVerified: Boolean(channel?.isVerified),
    isPinned: Boolean(channel?.isPinned),
    isReviewEnabled: Boolean(channel?.isReviewEnabled),
    tickerEnabled: channel?.tickerEnabled !== false,
    tickerText: channel?.tickerText || '',
    createdAt: channel?.createdAt || null,
  };
}

function normalizeSettings(settings) {
  return {
    ...settings,
    featuredChannels: Array.isArray(settings?.featuredChannels)
      ? settings.featuredChannels
          .map((channel) => (typeof channel === 'string' ? channel : channel?._id || channel?.id))
          .filter(Boolean)
      : [],
  };
}

export default function ChannelManagementClient({ initialChannels = [], initialSettings = null, currentUserId = '' }) {
  const router = useRouter();
  const [channels, setChannels] = useState(() => initialChannels.map(normalizeChannel));
  const [settings, setSettings] = useState(() => normalizeSettings(initialSettings));
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    avatar: '',
    coverImage: '',
    tickerText: '',
    tickerEnabled: true,
    isVerified: false,
    isPinned: false,
    isReviewEnabled: false,
  });

  const filteredChannels = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return channels;

    return channels.filter((channel) =>
      [channel.name, channel.slug, channel.description, channel.tickerText]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [channels, search]);

  const featuredSet = useMemo(() => new Set(settings.featuredChannels || []), [settings.featuredChannels]);

  const refreshPage = () => {
    router.refresh();
  };

  const updateChannelInState = (updated) => {
    if (!updated?._id) return;
    setChannels((prev) => prev.map((channel) => (channel._id === updated._id ? normalizeChannel(updated) : channel)));
  };

  const prependChannel = (created) => {
    if (!created?._id) return;
    setChannels((prev) => [normalizeChannel(created), ...prev]);
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      avatar: '',
      coverImage: '',
      tickerText: '',
      tickerEnabled: true,
      isVerified: false,
      isPinned: false,
      isReviewEnabled: false,
    });
    setEditingId('');
  };

  const handleEdit = (channel) => {
    setEditingId(channel._id);
    setForm({
      name: channel.name,
      description: channel.description,
      avatar: channel.avatar,
      coverImage: channel.coverImage,
      tickerText: channel.tickerText,
      tickerEnabled: channel.tickerEnabled,
      isVerified: channel.isVerified,
      isPinned: channel.isPinned,
      isReviewEnabled: channel.isReviewEnabled,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusyId(editingId || 'create');
    setError('');
    setMessage('');

    const payload = {
      ...form,
      createdBy: currentUserId,
    };

    const result = editingId ? await updateChannel(editingId, payload) : await createChannel(payload);

    if (result?.success) {
      setMessage(result.message || (editingId ? 'Channel updated successfully' : 'Channel created successfully'));
      if (editingId) {
        updateChannelInState(result.channel);
      } else {
        prependChannel(result.channel);
      }
      resetForm();
      refreshPage();
    } else {
      setError(result?.message || 'Failed to save channel');
    }

    setBusyId('');
  };

  const handleDelete = async (channelId) => {
    setBusyId(channelId);
    setError('');
    setMessage('');

    const result = await deleteChannel(channelId);
    if (result?.success) {
      setMessage(result.message || 'Channel deleted successfully');
      setChannels((prev) => prev.filter((channel) => channel._id !== channelId));
      if (editingId === channelId) resetForm();
      refreshPage();
    } else {
      setError(result?.message || 'Failed to delete channel');
    }

    setBusyId('');
  };

  const toggleFeatured = async (channelId) => {
    const nextFeatured = featuredSet.has(channelId)
      ? settings.featuredChannels.filter((id) => id !== channelId)
      : [...settings.featuredChannels, channelId];

    setBusyId(channelId);
    setError('');
    setMessage('');

    const result = await updateSiteSettings(settings?._id || '', {
      ...(settings || {}),
      featuredChannels: nextFeatured,
    });

    if (result?.success) {
      setSettings(normalizeSettings(result.settings));
      setMessage(result.message || 'Featured channels updated');
      refreshPage();
    } else {
      setError(result?.message || 'Failed to update featured channels');
    }

    setBusyId('');
  };

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

      <div className={s.card}>
        <div className={s.cardTitle}>
          <FaUsers /> Channel Management
        </div>

        <div className={s.searchBar}>
          <FaSearch />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search channels..." />
        </div>

        <form onSubmit={handleSubmit}>
          <div className={s.formGrid2}>
            <Field label="Channel Name">
              <input className={s.formControl} value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
            </Field>
            <Field label="Avatar URL">
              <input className={s.formControl} value={form.avatar} onChange={(e) => setForm((prev) => ({ ...prev, avatar: e.target.value }))} />
            </Field>
          </div>

          <Field label="Description">
            <textarea className={`${s.formControl} ${s.formControlTextarea}`} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          </Field>

          <div className={s.formGrid2}>
            <Field label="Cover Image URL">
              <input className={s.formControl} value={form.coverImage} onChange={(e) => setForm((prev) => ({ ...prev, coverImage: e.target.value }))} />
            </Field>
            <Field label="Ticker Text">
              <input className={s.formControl} value={form.tickerText} onChange={(e) => setForm((prev) => ({ ...prev, tickerText: e.target.value }))} />
            </Field>
          </div>

          <div className={s.formGrid2}>
            <label className={s.featuredToggle}>
              <input type="checkbox" checked={form.tickerEnabled} onChange={(e) => setForm((prev) => ({ ...prev, tickerEnabled: e.target.checked }))} />
              Ticker enabled
            </label>
            <label className={s.featuredToggle}>
              <input type="checkbox" checked={form.isVerified} onChange={(e) => setForm((prev) => ({ ...prev, isVerified: e.target.checked }))} />
              Verified
            </label>
            <label className={s.featuredToggle}>
              <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm((prev) => ({ ...prev, isPinned: e.target.checked }))} />
              Pinned
            </label>
            <label className={s.featuredToggle}>
              <input type="checkbox" checked={form.isReviewEnabled} onChange={(e) => setForm((prev) => ({ ...prev, isReviewEnabled: e.target.checked }))} />
              Reviews enabled
            </label>
          </div>

          <div className={s.cardFooter}>
            {editingId ? (
              <button type="button" className={s.btnOutline} onClick={resetForm}>
                Cancel Edit
              </button>
            ) : null}
            <button type="submit" className={s.btnGold} disabled={Boolean(busyId)}>
              {busyId ? <FaSpinner className="animate-spin" /> : editingId ? <FaSave /> : <FaPlus />}
              {editingId ? 'Save Channel' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>

      <div className={s.card}>
        <div className={s.cardTitle}>
          <FaStar /> Featured Channels
        </div>

        {filteredChannels.length ? filteredChannels.map((channel) => {
          const isFeatured = featuredSet.has(channel._id);
          const isBusy = busyId === channel._id;
          return (
            <div key={channel._id} className={s.channelItem}>
              <div className={s.channelThumb}>
                {channel.avatar ? <img src={channel.avatar} alt={channel.name} /> : <FaImage />}
              </div>

              <div className={s.channelInfo}>
                <div className={s.channelTitle}>{channel.name}</div>
                <div className={s.channelUrl}>/{channel.slug || 'channel'}</div>
                <div className={s.hint}>{channel.description || 'No description'}</div>
              </div>

              <button type="button" className={`${s.iconBtn} ${isFeatured ? s.iconBtnUnban : ''}`} onClick={() => toggleFeatured(channel._id)} disabled={isBusy}>
                {isBusy ? <FaSpinner className="animate-spin" /> : <FaStar />}
              </button>
            </div>
          );
        }) : (
          <div className={s.hint}>No channels found.</div>
        )}
      </div>

      <div className={s.card}>
        <div className={s.cardTitle}>
          <FaShieldAlt /> All Channels
        </div>

        {filteredChannels.map((channel) => (
          <div key={channel._id} className={s.channelItem}>
            <div className={s.channelThumb}>
              {channel.avatar ? <img src={channel.avatar} alt={channel.name} /> : <FaImage />}
            </div>

            <div className={s.channelInfo}>
              <div className={s.channelTitle}>{channel.name}</div>
              <div className={s.channelUrl}>/{channel.slug}</div>
            </div>

            <div className={s.channelActions}>
              <button type="button" className={s.iconBtn} onClick={() => handleEdit(channel)} aria-label="Edit channel">
                <FaEdit />
              </button>
              <button type="button" className={`${s.iconBtn} ${s.iconBtnDel}`} onClick={() => handleDelete(channel._id)} disabled={busyId === channel._id} aria-label="Delete channel">
                {busyId === channel._id ? <FaSpinner className="animate-spin" /> : <FaTrash />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
