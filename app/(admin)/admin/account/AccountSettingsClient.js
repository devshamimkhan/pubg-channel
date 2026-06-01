'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash, FaLock, FaSpinner, FaUser } from 'react-icons/fa';
import { updateAdminAccount } from '@/actions/settings';
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

function normalizeUser(user) {
  return {
    _id: user?._id || '',
    fullName: user?.fullName || '',
    whatsappNumber: user?.whatsappNumber || '',
    role: user?.role || 'admin',
  };
}

export default function AccountSettingsClient({ initialUser = null, currentUserId = '' }) {
  const router = useRouter();
  const [user, setUser] = useState(() => normalizeUser(initialUser));
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState(() => ({
    fullName: user.fullName,
    whatsappNumber: user.whatsappNumber,
    password: '',
  }));

  const initials = useMemo(() => {
    const parts = String(form.fullName || 'A').trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }, [form.fullName]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentUserId) {
      toast.error('Unable to update account. Please sign in again.');
      return;
    }

    const payload = {
      fullName: form.fullName.trim(),
      whatsappNumber: form.whatsappNumber.trim(),
      password: form.password,
    };

    if (!payload.fullName || !payload.whatsappNumber || !payload.password) {
      toast.error('Full name, WhatsApp number, and password are required.');
      return;
    }

    setSaving(true);

    const result = await updateAdminAccount(currentUserId, payload);

    if (result?.success) {
      const nextUser = normalizeUser(result.user);
      setUser(nextUser);
      setForm({
        fullName: nextUser.fullName,
        whatsappNumber: nextUser.whatsappNumber,
        password: '',
      });
      setShowPassword(false);
      toast.success(result.message || 'Account updated successfully');
      router.refresh();
    } else {
      toast.error(result?.message || 'Failed to update account');
    }

    setSaving(false);
  };

  return (
    <div className={s.contentArea}>
      <div className={s.card}>
        <div className={s.cardTitle}>
          <FaUser /> Account Settings
        </div>

        <div className={s.profileHeader}>
          <div className={s.profileAvatarWrap}>
            <div className={s.profileAvatar}>{initials}</div>
          </div>

          <div>
            <div className={s.profileName}>{form.fullName || 'Admin'}</div>
            <div className={s.profileRole}>
              {user.role === 'admin' ? 'Administrator' : 'User'} • {form.whatsappNumber || 'No WhatsApp number'}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
          <Field label="Full Name">
            <input
              className={s.formControl}
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              placeholder="Enter full name"
              required
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="words"
              spellCheck="false"
            />
          </Field>

          <Field label="WhatsApp Number">
            <input
              className={s.formControl}
              type="tel"
              inputMode="tel"
              value={form.whatsappNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
              placeholder="01XXXXXXXXX"
              required
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck="false"
            />
          </Field>

          <Field label="Password" hint="Use your password to save account changes.">
            <div className={s.pwWrap}>
              <input
                className={s.formControl}
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
                required
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                className={s.pwToggleIcon}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </Field>

          <div className={s.cardFooter}>
            <button type="submit" className={s.btnGold} disabled={saving}>
              {saving ? <FaSpinner className="animate-spin" /> : <FaLock />}
              {saving ? 'Saving...' : 'Save Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
