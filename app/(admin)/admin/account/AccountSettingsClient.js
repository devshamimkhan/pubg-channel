'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaCheck,
  FaKey,
  FaLock,
  FaSave,
  FaShieldAlt,
  FaSpinner,
  FaUser,
} from 'react-icons/fa';
import { updateAdminCredentials, updateAdminProfile } from '@/actions/settings';
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
    displayName: user?.displayName || '',
    email: user?.email || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
    whatsappNumber: user?.whatsappNumber || '',
    role: user?.role || 'admin',
  };
}

export default function AccountSettingsClient({ initialUser = null, currentUserId = '' }) {
  const router = useRouter();
  const [user, setUser] = useState(() => normalizeUser(initialUser));
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [credentialsSaving, setCredentialsSaving] = useState(false);

  const [profileForm, setProfileForm] = useState(() => ({
    fullName: user.fullName,
    displayName: user.displayName,
    bio: user.bio,
    avatar: user.avatar,
  }));

  const [credentialsForm, setCredentialsForm] = useState({
    newEmail: user.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const initials = useMemo(() => {
    const parts = String(profileForm.fullName || 'A').trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }, [profileForm.fullName]);

  const refreshPage = () => {
    router.refresh();
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    setError('');
    setMessage('');

    const result = await updateAdminProfile(currentUserId, profileForm);

    if (result?.success) {
      const nextUser = normalizeUser(result.user);
      setUser(nextUser);
      setProfileForm({
        fullName: nextUser.fullName,
        displayName: nextUser.displayName,
        bio: nextUser.bio,
        avatar: nextUser.avatar,
      });
      setMessage(result.message || 'Profile updated successfully');
      refreshPage();
    } else {
      setError(result?.message || 'Failed to update profile');
    }

    setProfileSaving(false);
  };

  const handleCredentialsSubmit = async (event) => {
    event.preventDefault();
    setCredentialsSaving(true);
    setError('');
    setMessage('');

    const result = await updateAdminCredentials(currentUserId, credentialsForm);

    if (result?.success) {
      const nextUser = normalizeUser(result.user);
      setUser((prev) => ({
        ...prev,
        email: nextUser.email || credentialsForm.newEmail || prev.email,
      }));
      setCredentialsForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        newEmail: nextUser.email || prev.newEmail,
      }));
      setMessage(result.message || 'Credentials updated successfully');
      refreshPage();
    } else {
      setError(result?.message || 'Failed to update credentials');
    }

    setCredentialsSaving(false);
  };

  return (
    <div className={s.contentArea}>
      {error ? (
        <div className={`${s.alert} ${s.alertInfo}`}>
          <FaShieldAlt />
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
          <FaUser /> Account Settings
        </div>

        <div className={s.profileHeader}>
          <div className={s.profileAvatarWrap}>
            <div className={s.profileAvatar}>
              {profileForm.avatar ? <img src={profileForm.avatar} alt={profileForm.fullName || 'Admin'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : initials}
            </div>
          </div>

          <div>
            <div className={s.profileName}>{profileForm.fullName || 'Admin'}</div>
            <div className={s.profileRole}>{user.role === 'admin' ? 'Administrator' : 'User'} • {user.whatsappNumber || 'No WhatsApp number'}</div>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit}>
          <div className={s.formGrid2}>
            <Field label="Full Name">
              <input className={s.formControl} value={profileForm.fullName} onChange={(e) => setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))} required />
            </Field>
            <Field label="Display Name">
              <input className={s.formControl} value={profileForm.displayName} onChange={(e) => setProfileForm((prev) => ({ ...prev, displayName: e.target.value }))} />
            </Field>
          </div>

          <Field label="Bio">
            <textarea className={`${s.formControl} ${s.formControlTextarea}`} value={profileForm.bio} onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))} />
          </Field>

          <Field label="Avatar URL">
            <input className={s.formControl} value={profileForm.avatar} onChange={(e) => setProfileForm((prev) => ({ ...prev, avatar: e.target.value }))} />
          </Field>

          <div className={s.cardFooter}>
            <button type="submit" className={s.btnGold} disabled={profileSaving}>
              {profileSaving ? <FaSpinner className="animate-spin" /> : <FaSave />}
              Save Profile
            </button>
          </div>
        </form>
      </div>

      <div className={s.card}>
        <div className={s.cardTitle}>
          <FaKey /> Email & Password
        </div>

        <form onSubmit={handleCredentialsSubmit}>
          <div className={s.formGrid2}>
            <Field label="Email">
              <input
                className={s.formControl}
                type="email"
                value={credentialsForm.newEmail}
                onChange={(e) => setCredentialsForm((prev) => ({ ...prev, newEmail: e.target.value }))}
                placeholder="admin@example.com"
              />
            </Field>
            <Field label="Current Password">
              <input
                className={s.formControl}
                type="password"
                value={credentialsForm.currentPassword}
                onChange={(e) => setCredentialsForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Required for password changes"
              />
            </Field>
          </div>

          <div className={s.formGrid2}>
            <Field label="New Password" hint="Leave blank to keep the current password">
              <input
                className={s.formControl}
                type="password"
                value={credentialsForm.newPassword}
                onChange={(e) => setCredentialsForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                placeholder="New password"
              />
            </Field>
            <Field label="Confirm Password">
              <input
                className={s.formControl}
                type="password"
                value={credentialsForm.confirmPassword}
                onChange={(e) => setCredentialsForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
              />
            </Field>
          </div>

          <div className={s.cardFooter}>
            <button type="submit" className={s.btnGold} disabled={credentialsSaving}>
              {credentialsSaving ? <FaSpinner className="animate-spin" /> : <FaLock />}
              Update Email / Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
